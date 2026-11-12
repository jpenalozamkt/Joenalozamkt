import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Backlog" };

export default async function Page() {
  await requireRole("admin", "equipo");
  return <Soon eyebrow="SCRUM" title="Backlog" phase={2} intro="Todo lo pendiente por marca, ordenado por prioridad." items={["Agregar historias y tareas con puntos y prioridad", "Pasarlas al sprint en el planning del lunes"]} />;
}
