"use client";
import { useActionState, useState } from "react";
import { createUser, resetPassword, type AccessState } from "./actions";
import { SubmitButton, SmallSubmit } from "@/components/Buttons";

type Opt = { value: string; label: string; group: string };

function Credentials({ c }: { c: NonNullable<AccessState["created"]> }) {
  const [copied, setCopied] = useState(false);
  const text = `Usuario: ${c.username}\nContraseña temporal: ${c.password}`;
  return (
    <div className="notice ok stack" role="status">
      <b>{c.title}</b>
      <div className="pass" style={{ fontSize: 18 }}>Usuario: {c.username}<br />Contraseña: {c.password}</div>
      <span className="small">Compártela por WhatsApp o en persona. No se vuelve a mostrar. Al entrar, se le pedirá crear su propia contraseña.</span>
      <button type="button" className="btn btn-sm" style={{ justifySelf: "start" }}
        onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))}>
        {copied ? "Copiado" : "Copiar usuario y contraseña"}
      </button>
    </div>
  );
}

export function NewUserForm({ scopes }: { scopes: Opt[] }) {
  const [state, action] = useActionState<AccessState, FormData>(createUser, {});
  const [role, setRole] = useState("cliente");
  const groups = [...new Set(scopes.map((s) => s.group))];
  return (
    <form className="panel panel-pad stack" action={action} style={{ alignContent: "start" }}>
      <h3 style={{ fontSize: 18 }}>Nuevo usuario</h3>
      {state.created && <Credentials c={state.created} />}
      <div className="field"><label htmlFor="nombre">Nombre</label><input className="input" id="nombre" name="nombre" placeholder="Ej. Equipo Mesón" required /></div>
      <div className="field"><label htmlFor="usuario">Usuario</label><input className="input" id="usuario" name="usuario" placeholder="ej. meson" autoCapitalize="none" spellCheck={false} required /></div>
      <div className="field"><label htmlFor="rol">Rol</label>
        <select className="input" id="rol" name="rol" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="cliente">Cliente</option><option value="equipo">Colaborador</option>
        </select></div>
      {role === "cliente" ? (
        <div className="field"><label htmlFor="alcance">Qué ve</label>
          <select className="input" id="alcance" name="alcance" required>
            {groups.map((g) => <optgroup key={g} label={g}>{scopes.filter((s) => s.group === g).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</optgroup>)}
          </select></div>
      ) : <p className="muted small">Los colaboradores ven y trabajan todas las marcas.</p>}
      <div className="field"><label htmlFor="correo">Correo de contacto (opcional)</label><input className="input" id="correo" name="correo" type="email" placeholder="Para avisos, más adelante" /></div>
      <div className="error" role="alert">{state.error}</div>
      <SubmitButton pending="Creando…">Crear usuario</SubmitButton>
    </form>
  );
}

export function ResetPasswordButton({ id }: { id: string }) {
  const [state, action] = useActionState<AccessState, FormData>(resetPassword, {});
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      {state.created ? <span className="small"><b>{state.created.password}</b></span> : <SmallSubmit>Nueva contraseña</SmallSubmit>}
      {state.error && <span className="error small"> {state.error}</span>}
    </form>
  );
}
