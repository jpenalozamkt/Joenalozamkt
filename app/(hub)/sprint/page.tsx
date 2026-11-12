import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Sprint de la semana" };

export default async function Page() {
  await requireRole("admin", "equipo");
  return <Soon eyebrow="SCRUM" title="Sprint de la semana" phase={2} intro="El tablero del equipo para la semana, de lunes a viernes." items={["Tablero Por hacer · En proceso · En revisión · Hecho, arrastrando tarjetas", "Objetivo de la semana, planning, daily, review y retro", "Gráficas de avance (burndown) y velocidad por semana"]} />;
}
