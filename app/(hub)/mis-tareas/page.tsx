import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { Soon } from "@/components/Soon";

export const metadata: Metadata = { title: "Mis tareas" };

export default async function Page() {
  await requireRole("admin", "equipo");
  return <Soon eyebrow="Tu semana" title="Mis tareas" phase={2} intro="Lo que te toca esta semana, con un clic para avanzar cada tarea." items={["Ver tus tareas de hoy, del resto de la semana y las ya hechas", "Avanzar cada tarea: empezar, mandar a revisión y cerrar", "Diseño ve las piezas por corregir; Community, las autorizadas por programar"]} />;
}
