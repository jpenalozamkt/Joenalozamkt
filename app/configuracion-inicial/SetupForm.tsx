"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createFirstAdmin, type SetupState } from "./actions";
import { SubmitButton } from "@/components/Buttons";

export function SetupForm() {
  const [state, action] = useActionState<SetupState, FormData>(createFirstAdmin, {});
  if (state.done) {
    return (
      <div className="card-form">
        <span className="tag">Configuración inicial</span>
        <h1>Listo, ya eres administrador</h1>
        <p>Entra con el usuario <b>{state.username}</b> y la contraseña que acabas de elegir.</p>
        <Link className="btn btn-primary" href="/entrar">Ir a entrar<span className="dot" aria-hidden="true">→</span></Link>
      </div>
    );
  }
  return (
    <form className="card-form" action={action}>
      <span className="tag">Configuración inicial</span>
      <h1>Crea el usuario administrador</h1>
      <p className="muted">Esto se hace una sola vez. Después, los demás usuarios los creas desde Accesos.</p>
      <div className="field"><label htmlFor="codigo">Código de configuración</label><input className="input" id="codigo" name="codigo" type="password" autoComplete="off" required /></div>
      <div className="field"><label htmlFor="nombre">Tu nombre</label><input className="input" id="nombre" name="nombre" defaultValue="Jorge Peñaloza" required /></div>
      <div className="field"><label htmlFor="usuario">Usuario</label><input className="input" id="usuario" name="usuario" defaultValue="jorge" autoCapitalize="none" required /></div>
      <div className="field"><label htmlFor="contrasena">Contraseña (mínimo 10 caracteres)</label><input className="input" id="contrasena" name="contrasena" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="field"><label htmlFor="contrasena2">Repite la contraseña</label><input className="input" id="contrasena2" name="contrasena2" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="error" role="alert">{state.error}</div>
      <SubmitButton pending="Creando…">Crear administrador</SubmitButton>
    </form>
  );
}
