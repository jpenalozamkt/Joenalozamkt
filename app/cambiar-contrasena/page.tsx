import type { Metadata } from "next";
import { getViewer } from "@/lib/session";
import { PassForm } from "./PassForm";

export const metadata: Metadata = { title: "Contraseña" };

export default async function CambiarContrasenaPage() {
  const v = await getViewer();
  return <main className="center-page"><PassForm first={v.profile.must_change_password} /></main>;
}
