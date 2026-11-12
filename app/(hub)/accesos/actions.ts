"use server";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/env";
import { initialsFrom, tempPassword } from "@/lib/passwords";

export type AccessState = { error?: string; created?: { username: string; password: string; title: string } };

const USERNAME = /^[a-z0-9._-]{3,32}$/;
const TEAM_SEATS = 5;

async function assertAdmin() {
  const v = await getViewer();
  if (v.profile.role !== "admin") throw new Error("Solo el administrador puede hacer esto.");
  return v;
}

export async function createUser(_: AccessState, form: FormData): Promise<AccessState> {
  await assertAdmin();
  const name = String(form.get("nombre") ?? "").trim();
  const username = String(form.get("usuario") ?? "").trim().toLowerCase();
  const role = String(form.get("rol") ?? "");
  const scope = String(form.get("alcance") ?? "");
  const contact = String(form.get("correo") ?? "").trim() || null;

  if (!name) return { error: "Escribe el nombre." };
  if (!USERNAME.test(username)) return { error: "El usuario debe tener de 3 a 32 letras minúsculas, números, punto o guion. Sin espacios ni acentos." };
  if (role !== "equipo" && role !== "cliente") return { error: "Elige un rol." };

  const admin = supabaseAdmin();
  const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return { error: "Ese usuario ya existe. Elige otro." };

  if (role === "equipo") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "equipo"]).eq("active", true);
    if ((count ?? 0) >= TEAM_SEATS) return { error: `Ya usas los ${TEAM_SEATS} lugares de equipo. Desactiva a alguien o amplía el límite.` };
  }

  let clientId: string | null = null, brandId: string | null = null;
  if (role === "cliente") {
    const [kind, id] = scope.split(":");
    if (kind === "client" && id) clientId = id;
    else if (kind === "brand" && id) brandId = id;
    else return { error: "Elige qué marcas va a ver este cliente." };
  }

  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username), password, email_confirm: true, user_metadata: { username },
  });
  if (error || !data.user) return { error: "No se pudo crear el acceso: " + (error?.message ?? "error desconocido") };

  const { error: pErr } = await admin.from("profiles").insert({
    id: data.user.id, username, full_name: name, initials: initialsFrom(name), role,
    client_id: clientId, contact_email: contact, must_change_password: true,
  });
  if (!pErr && brandId) {
    const { error: bErr } = await admin.from("profile_brands").insert({ profile_id: data.user.id, brand_id: brandId });
    if (bErr) { await admin.auth.admin.deleteUser(data.user.id); return { error: "No se pudo asignar la marca: " + bErr.message }; }
  }
  if (pErr) { await admin.auth.admin.deleteUser(data.user.id); return { error: "No se pudo guardar el perfil: " + pErr.message }; }

  revalidatePath("/accesos");
  return { created: { username, password, title: `Acceso creado para ${name}` } };
}

export async function resetPassword(_: AccessState, form: FormData): Promise<AccessState> {
  const v = await assertAdmin();
  const id = String(form.get("id") ?? "");
  if (id === v.profile.id) return { error: "Tu propia contraseña la cambias desde «Cambiar contraseña»." };
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("profiles").select("username,full_name").eq("id", id).single();
  if (!p) return { error: "No encontramos ese usuario." };
  const password = tempPassword();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: "No se pudo cambiar la contraseña: " + error.message };
  await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
  revalidatePath("/accesos");
  return { created: { username: p.username, password, title: `Nueva contraseña para ${p.full_name}` } };
}

export async function setActive(form: FormData) {
  const v = await assertAdmin();
  const id = String(form.get("id") ?? "");
  const active = form.get("activo") === "1";
  if (id === v.profile.id) return;
  const admin = supabaseAdmin();
  await admin.from("profiles").update({ active }).eq("id", id);
  // Cierra sus sesiones al desactivar
  await admin.auth.admin.updateUserById(id, { ban_duration: active ? "none" : "876000h" });
  revalidatePath("/accesos");
}
