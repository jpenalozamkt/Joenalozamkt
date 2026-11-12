"use client";
import { useActionState } from "react";
import { changePassword, type PassState } from "./actions";
import { SubmitButton } from "@/components/Buttons";

export function PassForm({ first }: { first: boolean }) {
  const [state, action] = useActionState<PassState, FormData>(changePassword, {});
  return (
    <form className="card-form" action={action}>
      <span className="tag">Tu contraseña</span>
      <h1>{first ? "Crea tu contraseña" : "Cambia tu contraseña"}</h1>
      <p className="muted">{first ? "Entraste con una contraseña temporal. Elige una tuya para seguir." : "Elige una contraseña nueva."}</p>
      <div className="field"><label htmlFor="contrasena">Contraseña nueva (mínimo 10 caracteres)</label><input className="input" id="contrasena" name="contrasena" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="field"><label htmlFor="contrasena2">Repítela</label><input className="input" id="contrasena2" name="contrasena2" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="error" role="alert">{state.error}</div>
      <SubmitButton pending="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
