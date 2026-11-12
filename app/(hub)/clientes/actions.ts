"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import { initialsFrom, slugify } from "@/lib/passwords";

export type FormState = { error?: string; ok?: string };

export async function createClientAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const name = String(form.get("nombre") ?? "").trim();
  const note = String(form.get("nota") ?? "").trim() || null;
  const sameBrand = form.get("misma_marca") === "on";
  if (!name) return { error: "Escribe el nombre del cliente." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("clients").insert({ name, note }).select("id").single();
  if (error) return { error: error.code === "23505" ? "Ya existe un cliente con ese nombre." : error.message };

  if (sameBrand) {
    const { error: bErr } = await supabase.from("brands").insert({ client_id: data.id, name, slug: slugify(name), initials: initialsFrom(name), sector: note });
    if (bErr) return { error: "El cliente se creó, pero la marca no: " + bErr.message };
  }
  revalidatePath("/", "layout");
  return { ok: `Cliente «${name}» creado.` };
}

export async function createBrandAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const clientId = String(form.get("cliente") ?? "");
  const name = String(form.get("nombre") ?? "").trim();
  const sector = String(form.get("sector") ?? "").trim() || null;
  if (!clientId) return { error: "Elige el cliente." };
  if (!name) return { error: "Escribe el nombre de la marca." };
  const slug = slugify(name);
  if (!slug) return { error: "El nombre necesita al menos una letra o número." };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("brands").insert({ client_id: clientId, name, slug, sector, initials: initialsFrom(name) });
  if (error) return { error: error.code === "23505" ? "Ya existe una marca con ese nombre." : error.message };
  revalidatePath("/", "layout");
  return { ok: `Marca «${name}» agregada.` };
}

export async function toggleBrand(form: FormData) {
  await requireRole("admin");
  const supabase = await supabaseServer();
  await supabase.from("brands").update({ active: form.get("activa") === "1" }).eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}
