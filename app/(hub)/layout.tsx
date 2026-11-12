import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { navFor } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { BrandPicker } from "@/components/BrandPicker";
import { logout } from "@/app/entrar/actions";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const v = await getViewer();
  if (v.profile.must_change_password) redirect("/cambiar-contrasena");
  const nav = navFor(v.profile.role);
  const isClient = v.profile.role === "cliente";

  const groups = v.clients
    .map((c) => ({ group: c.name, items: v.brands.filter((b) => b.client_id === c.id).map((b) => ({ slug: b.slug, name: b.name })) }))
    .filter((g) => g.items.length);

  return (
    <div className="shell">
      <aside className="rail">
        <Logo />
        <NavLinks items={nav.main} />
        <NavLinks items={nav.admin} label="Administración" />
        <div className="rail-foot">
          <div className="me">
            <span className="av">{v.profile.initials}</span>
            <div className="me-txt"><b>{v.profile.full_name}</b><span>{ROLE_LABEL[v.profile.role]}</span></div>
          </div>
          <a className="btn btn-sm" href="/cambiar-contrasena">Cambiar contraseña</a>
          <form action={logout}><button className="btn btn-sm" style={{ width: "100%" }} type="submit">Cerrar sesión</button></form>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          {v.brands.length === 1 ? (
            <div className="picker"><span className="mono-tile">{v.brands[0].initials}</span><div><b>{v.brands[0].name}</b><div className="muted small">{isClient ? "Portal de cliente" : "Única marca activa"}</div></div></div>
          ) : v.brands.length > 1 ? (
            <BrandPicker groups={groups} selected={v.selected} allLabel={isClient ? "Todas mis marcas" : "Todas las marcas"} />
          ) : <span className="muted">Aún no tienes marcas asignadas.</span>}
        </div>
        {children}
      </main>
    </div>
  );
}
