import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { ROLE_LABEL, type Profile } from "@/lib/types";
import { NewUserForm, ResetPasswordButton } from "./AccessForms";
import { setActive } from "./actions";
import { SmallSubmit } from "@/components/Buttons";

export const metadata: Metadata = { title: "Accesos" };

const ROLE_COLOR = { admin: "var(--accent-text)", equipo: "var(--violet)", cliente: "var(--up)" } as const;

export default async function AccesosPage() {
  const v = await requireRole("admin");
  const supabase = await supabaseServer();
  const [{ data: profiles }, { data: links }, { data: allBrands }] = await Promise.all([
    supabase.from("profiles").select("*").order("role").order("full_name"),
    supabase.from("profile_brands").select("profile_id,brand_id"),
    supabase.from("brands").select("id,name,client_id,active").order("name"),
  ]);
  const people = (profiles ?? []) as Profile[];
  const brands = allBrands ?? [];
  const clientName = (id: string | null) => v.clients.find((c) => c.id === id)?.name;
  const sees = (p: Profile) => {
    if (p.role !== "cliente") return "Todas las marcas";
    if (p.client_id) return `Todo ${clientName(p.client_id) ?? "su cliente"}`;
    const mine = (links ?? []).filter((l) => l.profile_id === p.id).map((l) => brands.find((b) => b.id === l.brand_id)?.name).filter(Boolean);
    return mine.length ? `Solo ${mine.join(", ")}` : "Sin marcas";
  };
  const team = people.filter((p) => p.role !== "cliente" && p.active).length;

  const scopes = v.clients.flatMap((c) => {
    const bs = brands.filter((b) => b.client_id === c.id && b.active);
    return [
      { value: `client:${c.id}`, label: `Todo ${c.name}${bs.length > 1 ? ` (${bs.length} marcas)` : ""}`, group: c.name },
      ...(bs.length > 1 ? bs.map((b) => ({ value: `brand:${b.id}`, label: `Solo ${b.name}`, group: c.name })) : []),
    ];
  });

  return (
    <>
      <div className="page-head"><div><span className="tag">Solo administrador</span><h1>Accesos</h1>
        <p>Nadie se registra solo. Tú creas cada usuario, decides qué marcas ve y le das una contraseña temporal.</p></div></div>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi lead"><span className="k-label">Lugares de equipo</span><span className="k-val">{team} / 5</span><span className="k-sub">incluye al administrador</span></div>
        <div className="kpi"><span className="k-label">Usuarios de cliente</span><span className="k-val">{people.filter((p) => p.role === "cliente" && p.active).length}</span><span className="k-sub">cada uno ve solo lo suyo</span></div>
        <div className="kpi"><span className="k-label">Desactivados</span><span className="k-val">{people.filter((p) => !p.active).length}</span><span className="k-sub">sin acceso</span></div>
      </div>
      <div className="acc-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", alignItems: "start" }}>
        <div className="table-wrap"><table>
          <thead><tr><th>Usuario</th><th>Rol</th><th>Ve</th><th></th></tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className={p.active ? "" : "inactive"}>
                <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="av">{p.initials}</span>
                  <div><b>{p.full_name}</b><span className="cell-sub">{p.username}{p.must_change_password ? " · aún no cambia su contraseña" : ""}{!p.active ? " · desactivado" : ""}</span></div></div></td>
                <td><span className="chip" style={{ ["--c" as string]: ROLE_COLOR[p.role] }}>{ROLE_LABEL[p.role]}</span></td>
                <td>{sees(p)}</td>
                <td>{p.id !== v.profile.id && (
                  <div className="row-actions">
                    {p.active && <ResetPasswordButton id={p.id} />}
                    <form action={setActive} className="inline-form">
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="activo" value={p.active ? "0" : "1"} />
                      <SmallSubmit className="btn-ghost">{p.active ? "Desactivar" : "Activar"}</SmallSubmit>
                    </form>
                  </div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <NewUserForm scopes={scopes} />
      </div>
    </>
  );
}
