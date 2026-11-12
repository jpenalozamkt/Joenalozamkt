"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type PassState = { error?: string };

export async function changePassword(_: PassState, form: FormData): Promise<PassState> {
  const pass = String(form.get("contrasena") ?? "");
  const pass2 = String(form.get("contrasena2") ?? "");
  if (pass.length < 10) return { error: "Usa al menos 10 caracteres." };
  if (pass !== pass2) return { error: "Las contraseñas no coinciden." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password: pass });
  if (error) return { error: "No se pudo cambiar la contraseña. Intenta con una distinta a la anterior." };
  await supabase.rpc("mark_password_changed");
  redirect("/");
}
