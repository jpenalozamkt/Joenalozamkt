import type { Metadata } from "next";
import { requireRole, scopeBrands } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panorama" };

export default async function PanoramaPage() {
  const v = await requireRole("admin", "equipo");
  const brands = scopeBrands(v);
  const ids = brands.map((b) => b.id);
  const supabase = await supabaseServer();

  const [{ data: sprint }, { data: pieces }, { data: campaigns }] = await Promise.all([
    supabase.from("sprints").select("id,number,starts_on,ends_on,goal").eq("status", "activo").maybeSingle(),
    supabase.from("pieces").select("brand_id,status").in("brand_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("campaigns").select("brand_id,status").in("brand_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const { data: tasks } = sprint
    ? await supabase.from("tasks").select("brand_id,status,points").eq("sprint_id", sprint.id).in("brand_id", ids)
    : { data: [] as { brand_id: string; status: string; points: number }[] };

  const t = tasks ?? [], p = pieces ?? [], c = campaigns ?? [];
  const total = t.reduce((a, x) => a + x.points, 0);
  const done = t.filter((x) => x.status === "done").reduce((a, x) => a + x.points, 0);
  const pend = p.filter((x) => x.status === "Por aprobar").length;
  const changes = p.filter((x) => x.status === "Cambios").length;
  const active = c.filter((x) => x.status === "Activa").length;
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" });

  return (
    <>
      <div className="page-head"><div>
        <span className="tag">{sprint ? `Sprint ${sprint.number} · ${fmt(sprint.starts_on)} al ${fmt(sprint.ends_on)}` : "Sin sprint activo"}</span>
        <h1>Panorama</h1>
        <p>Lo que se mueve hoy en {v.selected === "todas" ? "todas las marcas" : brands[0]?.name}. Toca una marca para verla sola.</p>
      </div></div>

      <div className="kpis">
        <div className="kpi lead"><span className="k-label">Puntos completados</span><span className="k-val">{done} / {total}</span><span className="k-sub">{total ? Math.round((done / total) * 100) : 0}% del sprint</span></div>
        <div className="kpi"><span className="k-label">Tareas de la semana</span><span className="k-val">{t.length}</span><span className="k-sub">{t.filter((x) => x.status === "done").length} hechas</span></div>
        <div className="kpi"><span className="k-label">Piezas por aprobar</span><span className="k-val">{pend}</span><span className="k-sub">esperando al cliente</span></div>
        <div className="kpi"><span className="k-label">Cambios pedidos</span><span className={`k-val ${changes ? "down" : ""}`}>{changes}</span><span className="k-sub">por atender</span></div>
        <div className="kpi"><span className="k-label">Campañas activas</span><span className="k-val">{active}</span><span className="k-sub">Meta · TikTok · Google</span></div>
      </div>

      {v.clients.map((cl) => {
        const bs = brands.filter((b) => b.client_id === cl.id);
        if (!bs.length) return null;
        return (
          <section key={cl.id}>
            <div className="group-head"><h3>{cl.name}</h3><span className="chip" style={{ ["--c" as string]: "var(--muted)" }}>{bs.length} {bs.length === 1 ? "marca" : "marcas"}</span>{cl.note && <span className="muted small">{cl.note}</span>}</div>
            <div className="cards">
              {bs.map((b) => {
                const bt = t.filter((x) => x.brand_id === b.id);
                const bd = bt.filter((x) => x.status === "done").length;
                const bp = p.filter((x) => x.brand_id === b.id && x.status === "Por aprobar").length;
                const bc = c.filter((x) => x.brand_id === b.id && x.status === "Activa").length;
                const pct = bt.length ? Math.round((bd / bt.length) * 100) : 0;
                return (
                  <div key={b.id} className="ccard">
                    <div className="ccard-head"><span className="mono-tile">{b.initials}</span><div><h4>{b.name}</h4><div className="sub">{b.sector ?? cl.name}</div></div></div>
                    <div><div className="bar"><i style={{ width: `${pct}%` }} /></div><div className="muted small" style={{ marginTop: 4 }}>{bd} de {bt.length} tareas de la semana</div></div>
                    <div className="cstats"><div>Tareas<b>{bt.length}</b></div><div className={bp ? "warn" : ""}>Por aprobar<b>{bp}</b></div><div>Campañas<b>{bc}</b></div></div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
