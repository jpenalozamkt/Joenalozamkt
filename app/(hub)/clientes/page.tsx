import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";
import { NewBrandForm, NewClientForm } from "./ClientForms";
import { toggleBrand } from "./actions";
import { SmallSubmit } from "@/components/Buttons";

export const metadata: Metadata = { title: "Clientes y marcas" };

export default async function ClientesPage() {
  const v = await requireRole("admin");
  const supabase = await supabaseServer();
  const { data } = await supabase.from("brands").select("id,client_id,slug,name,sector,initials,active").order("name");
  const brands = (data ?? []) as Brand[];
  const activeCount = brands.filter((b) => b.active).length;

  return (
    <>
      <div className="page-head"><div><span className="tag">Solo administrador</span><h1>Clientes y marcas</h1>
        <p>Un cliente es quien te contrata; cada cliente puede tener varias marcas. Las tareas, la parrilla y los reportes van por marca.</p></div></div>
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi lead"><span className="k-label">Marcas activas</span><span className="k-val">{activeCount} / 10</span><span className="k-sub">meta de crecimiento</span></div>
        <div className="kpi"><span className="k-label">Clientes</span><span className="k-val">{v.clients.length}</span><span className="k-sub">con acceso propio</span></div>
      </div>
      <div className="acc-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", alignItems: "start" }}>
        <div className="stack">
          {v.clients.map((c) => {
            const bs = brands.filter((b) => b.client_id === c.id);
            return (
              <div key={c.id} className="table-wrap">
                <table>
                  <thead><tr><th colSpan={3}>{c.name}{c.note ? ` · ${c.note}` : ""}</th></tr></thead>
                  <tbody>
                    {bs.length ? bs.map((b) => (
                      <tr key={b.id} className={b.active ? "" : "inactive"}>
                        <td style={{ width: 52 }}><span className="mono-tile" style={{ width: 34, height: 34, fontSize: 12 }}>{b.initials}</span></td>
                        <td><b>{b.name}</b><span className="cell-sub">{b.sector ?? "Sin descripción"}{b.active ? "" : " · pausada"}</span></td>
                        <td className="r"><form action={toggleBrand} className="inline-form">
                          <input type="hidden" name="id" value={b.id} /><input type="hidden" name="activa" value={b.active ? "0" : "1"} />
                          <SmallSubmit className="btn-ghost">{b.active ? "Pausar" : "Reactivar"}</SmallSubmit></form></td>
                      </tr>
                    )) : <tr><td colSpan={3} className="muted">Sin marcas todavía.</td></tr>}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <div className="stack">
          <NewBrandForm clients={v.clients.map((c) => ({ id: c.id, name: c.name }))} />
          <NewClientForm />
        </div>
      </div>
    </>
  );
}
