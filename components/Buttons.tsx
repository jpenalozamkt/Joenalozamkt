"use client";
import { useFormStatus } from "react-dom";

const Arrow = () => (
  <span className="dot" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l6-6M4 3h5v5" /></svg>
  </span>
);

/** Botón principal de la marca (píldora cian con flecha). Muestra estado mientras se envía. */
export function SubmitButton({ children, pending: pendingLabel }: { children: React.ReactNode; pending?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? pendingLabel ?? "Guardando…" : children}
      <Arrow />
    </button>
  );
}

export function SmallSubmit({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={`btn btn-sm ${className}`} type="submit" disabled={pending}>{pending ? "…" : children}</button>;
}
