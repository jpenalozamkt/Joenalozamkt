import type { Metadata } from "next";
import Link from "next/link";
import { adminExists } from "./actions";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Configuración inicial" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const exists = await adminExists();
  return (
    <main className="center-page">
      {exists ? (
        <div className="card-form">
          <span className="tag">Configuración inicial</span>
          <h1>Ya está configurado</h1>
          <p>El administrador ya existe. Entra con tu usuario y contraseña.</p>
          <Link className="link" href="/entrar">Ir a entrar</Link>
        </div>
      ) : <SetupForm />}
    </main>
  );
}
