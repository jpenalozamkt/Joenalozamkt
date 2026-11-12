import type { Metadata } from "next";
import { requireRole, scopeBrands } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function MiCuentaPage() {
  const v = await requireRole("cliente");
  const brands = scopeBrands(v);
  const ids = brands.length ? brands.map((b) => b.id) : ["00000000-0000-0000-0000-000000000000"];
  const supabase = await supabaseServer();
  const [{ data: pieces }, { data: tasks }] = await Promise.all([
    supabase.from("pieces").select("id,code,hook,publish_on,format,status,brand_id").in("brand_id", ids).order("publish_on"),
    supabase.from("tasks").select("status").in("brand_id", ids),
  ]);
  const pend = (pieces ?? []).filter((p) => p.status === "Por aprobar");
  const t = tasks ?? [];
  const done = t.filter((x) => x.status === "done").length;
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? "";
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });

  return (
    <>
      <div className="page-head"><div><span className="tag">Portal de cliente</span><h1>Hola, {v.profile.full_name}</h1>
        <p>Aquí ves en qué estamos trabajando, qué necesita tu visto bueno y cómo van los resultados.</p></div></div>
      <div className="kpis">
        <div className="kpi lead"><span className="k-label">Piezas por aprobar</span><span className="k-val">{pend.length}</span><span className="k-sub">de {(pieces ?? []).length} en la parrilla</span></div>
        <div className="kpi"><span className="k-label">Avance de la semana</span><span className="k-val">{t.length ? Math.round((done / t.length) * 100) : 0}%</span><span className="k-sub">{done} de {t.length} entregables</span></div>
        <div className="kpi"><span className="k-label">Marcas</span><span className="k-val">{v.brands.length}</span><span className="k-sub">{v.brands.map((b) => b.name).slice(0, 3).join(" · ")}{v.brands.length > 3 ? "…" : ""}</span></div>
      </div>
      <div className="section-title"><h2>Esperan tu visto bueno</h2></div>
      <div className="panel list">
        {pend.length ? pend.map((p) => (
          <div key={p.id} className="list-row"><span className="muted small" style={{ minWidth: 52, fontWeight: 700 }}>{p.code}</span>
            <div className="grow"><b>{p.hook}</b><span className="cell-sub">{name(p.brand_id)} · {fmt(p.publish_on)} · {p.format}</span></div></div>
        )) : <div className="empty"><h3>Todo al día</h3><span>No hay piezas esperando tu aprobación.</span></div>}
      </div>
    </>
  );
}
