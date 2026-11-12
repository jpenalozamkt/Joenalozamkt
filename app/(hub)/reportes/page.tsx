import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Reportes" };

export default async function Page() {
  await requireRole("admin", "equipo", "cliente");
  return <Soon eyebrow="Resultados" title="Reportes" phase={4} intro="Reportes semanales y mensuales, cortos y directos." items={["Los números que importan, qué conectó y qué ajustamos", "Lo que sigue, con una meta clara", "Publicarlos para que el cliente los vea en su portal"]} />;
}
