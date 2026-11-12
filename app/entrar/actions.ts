"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BRAND_COOKIE } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/env";

export type LoginState = { error?: string };

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get("usuario") ?? "").trim();
  const password = String(form.get("contrasena") ?? "");
  if (!username || !password) return { error: "Escribe tu usuario y tu contraseña." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error) return { error: "Usuario o contraseña incorrectos. Si no recuerdas tu contraseña, pídele a Jorge una nueva." };
  (await cookies()).delete(BRAND_COOKIE);
  redirect("/");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  (await cookies()).delete(BRAND_COOKIE);
  redirect("/entrar");
}
