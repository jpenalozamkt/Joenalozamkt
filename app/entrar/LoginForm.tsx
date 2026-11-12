"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { SubmitButton } from "@/components/Buttons";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  return (
    <form className="login-form" action={action}>
      <span className="tag">Iniciar sesión</span>
      <h2>Entra a tu espacio</h2>
      {notice && <div className="notice">{notice}</div>}
      <div className="field"><label htmlFor="usuario">Usuario</label>
        <input className="input" id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="ej. alphabrand" required /></div>
      <div className="field"><label htmlFor="contrasena">Contraseña</label>
        <input className="input" id="contrasena" name="contrasena" type="password" autoComplete="current-password" required /></div>
      <div className="error" role="alert">{state.error}</div>
      <SubmitButton pending="Entrando…">Entrar</SubmitButton>
      <span className="muted small">¿Olvidaste tu contraseña? Escríbele a Jorge y te manda una nueva.</span>
    </form>
  );
}
