import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Parrilla de contenido" };

export default async function Page() {
  await requireRole("admin", "equipo", "cliente");
  return <Soon eyebrow="Contenido" title="Parrilla de contenido" phase={3} intro="La parrilla de cada marca, con aprobación pieza por pieza." items={["Ver la parrilla en tabla o calendario", "Autorizar o pedir cambios con comentarios en cada pieza", "Importar la parrilla desde Google Sheets"]} />;
}
