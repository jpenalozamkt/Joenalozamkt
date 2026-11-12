import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Avance de la semana" };

export default async function Page() {
  await requireRole("cliente");
  return <Soon eyebrow="Tu cuenta" title="Avance de la semana" phase={2} intro="Lo que el equipo trae en curso para ti." items={["Ver en qué columna va cada entregable de la semana", "Porcentaje de avance actualizado al momento"]} />;
}
