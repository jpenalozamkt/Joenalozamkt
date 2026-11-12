import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  inactivo: "Tu acceso está desactivado. Si crees que es un error, escríbele a Jorge.",
  contrasena: "Listo, tu contraseña quedó actualizada. Entra con la nueva.",
};

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  return (
    <div className="login">
      <section className="login-brand">
        <Logo />
        <div style={{ display: "grid", gap: 22 }}>
          <span className="tag">Hub de cuentas</span>
          <h1>Todo lo de tus marcas, en <span className="hl">un solo lugar</span>.</h1>
          <p>Aquí planeamos la semana, aprobamos la parrilla y vemos los resultados. Sin correos perdidos ni hojas sueltas.</p>
          <ul className="login-points">
            <li>Sprint semanal con tablero, backlog y retro</li>
            <li>Parrilla que apruebas pieza por pieza</li>
            <li>Campañas de Meta, TikTok Ads y Google Ads</li>
            <li>Reportes semanales y mensuales, cortos y claros</li>
          </ul>
        </div>
        <span className="small" style={{ color: "var(--on-night-muted)" }}>Solo entras con el usuario y la contraseña que te da Jorge.</span>
      </section>
      <section className="login-side">
        <LoginForm notice={motivo ? NOTICES[motivo] : undefined} />
      </section>
    </div>
  );
}
