import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Brand, Client, Profile, Role } from "@/lib/types";

export const BRAND_COOKIE = "hub_marca";

export type Viewer = {
  profile: Profile;
  clients: Client[];
  brands: Brand[];      // marcas activas que este usuario puede ver
  selected: string;     // slug de la marca elegida o "todas"
};

/** Usuario actual con sus marcas. Redirige a /entrar si no hay sesión válida. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    redirect("/entrar?motivo=inactivo");
  }

  const [{ data: clients }, { data: brands }] = await Promise.all([
    supabase.from("clients").select("id,name,note,active").order("name"),
    supabase.from("brands").select("id,client_id,slug,name,sector,initials,active").eq("active", true).order("name"),
  ]);

  const list = (brands ?? []) as Brand[];
  const saved = (await cookies()).get(BRAND_COOKIE)?.value ?? "todas";
  const selected = saved === "todas" || list.some((b) => b.slug === saved) ? saved : "todas";

  return {
    profile,
    clients: (clients ?? []) as Client[],
    brands: list,
    selected: list.length === 1 ? list[0].slug : selected,
  };
});

/** Exige uno de los perfiles indicados; si no, regresa al inicio. */
export async function requireRole(...roles: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!roles.includes(viewer.profile.role)) redirect("/");
  return viewer;
}

export function homePath(role: Role): string {
  return role === "cliente" ? "/mi-cuenta" : role === "equipo" ? "/mis-tareas" : "/panorama";
}

/** Marcas en alcance según el selector: todas las visibles o solo la elegida. */
export function scopeBrands(v: Viewer): Brand[] {
  return v.selected === "todas" ? v.brands : v.brands.filter((b) => b.slug === v.selected);
}
