import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Campañas y resultados" };

export default async function Page() {
  await requireRole("admin", "equipo", "cliente");
  return <Soon eyebrow="Pauta" title="Campañas y resultados" phase={4} intro="Meta Ads, TikTok Ads y Google Ads juntos, con los mismos indicadores." items={["Subir el CSV que exportas de cada plataforma", "CTR, CPC, costo por conversación, alcance, interacción y seguidores", "Tasa de conversión y ROAS cuando el cliente comparte sus ventas"]} />;
}
