"use server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env, usernameToEmail } from "@/lib/env";
import { initialsFrom } from "@/lib/passwords";

export type SetupState = { error?: string; done?: boolean; username?: string };

const USERNAME = /^[a-z0-9._-]{3,32}$/;

function sameCode(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function adminExists(): Promise<boolean> {
  const { count } = await supabaseAdmin().from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return (count ?? 0) > 0;
}

export async function createFirstAdmin(_: SetupState, form: FormData): Promise<SetupState> {
  const code = String(form.get("codigo") ?? "");
  const name = String(form.get("nombre") ?? "").trim();
  const username = String(form.get("usuario") ?? "").trim().toLowerCase();
  const pass = String(form.get("contrasena") ?? "");
  const pass2 = String(form.get("contrasena2") ?? "");

  if (!env.setupCode() || !sameCode(code, env.setupCode())) return { error: "El código de configuración no coincide." };
  if (await adminExists()) return { error: "Ya existe un administrador. Entra con tu usuario." };
  if (!name) return { error: "Escribe tu nombre." };
  if (!USERNAME.test(username)) return { error: "El usuario debe tener de 3 a 32 letras minúsculas, números, punto o guion." };
  if (pass.length < 10) return { error: "La contraseña debe tener al menos 10 caracteres." };
  if (pass !== pass2) return { error: "Las contraseñas no coinciden." };

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username), password: pass, email_confirm: true, user_metadata: { username },
  });
  if (error || !data.user) return { error: "No se pudo crear el usuario: " + (error?.message ?? "error desconocido") };

  const { error: pErr } = await admin.from("profiles").insert({
    id: data.user.id, username, full_name: name, initials: initialsFrom(name), role: "admin", must_change_password: false,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo guardar el perfil: " + pErr.message };
  }
  return { done: true, username };
}
