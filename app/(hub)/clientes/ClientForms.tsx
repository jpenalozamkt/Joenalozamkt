"use client";
import { useActionState } from "react";
import { createClientAction, createBrandAction, type FormState } from "./actions";
import { SubmitButton } from "@/components/Buttons";

function Msg({ s }: { s: FormState }) {
  if (s.error) return <div className="notice err" role="alert">{s.error}</div>;
  if (s.ok) return <div className="notice ok" role="status">{s.ok}</div>;
  return null;
}

export function NewClientForm() {
  const [state, action] = useActionState<FormState, FormData>(createClientAction, {});
  return (
    <form className="panel panel-pad stack" action={action}>
      <h3 style={{ fontSize: 18 }}>Nuevo cliente</h3>
      <Msg s={state} />
      <div className="field"><label htmlFor="c-nombre">Nombre</label><input className="input" id="c-nombre" name="nombre" placeholder="Ej. Clínica Dental Sonrisa" required /></div>
      <div className="field"><label htmlFor="c-nota">Nota (opcional)</label><input className="input" id="c-nota" name="nota" placeholder="Ej. Restaurante · Puebla" /></div>
      <label className="check"><input type="checkbox" name="misma_marca" defaultChecked /> Crear también una marca con el mismo nombre</label>
      <SubmitButton pending="Creando…">Crear cliente</SubmitButton>
    </form>
  );
}

export function NewBrandForm({ clients }: { clients: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createBrandAction, {});
  return (
    <form className="panel panel-pad stack" action={action}>
      <h3 style={{ fontSize: 18 }}>Nueva marca</h3>
      <Msg s={state} />
      <div className="field"><label htmlFor="b-cliente">Cliente</label>
        <select className="input" id="b-cliente" name="cliente" required>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="field"><label htmlFor="b-nombre">Nombre de la marca</label><input className="input" id="b-nombre" name="nombre" required /></div>
      <div className="field"><label htmlFor="b-sector">Giro o descripción (opcional)</label><input className="input" id="b-sector" name="sector" placeholder="Ej. Software contable" /></div>
      <SubmitButton pending="Agregando…">Agregar marca</SubmitButton>
    </form>
  );
}
