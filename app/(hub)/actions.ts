"use server";
import { cookies } from "next/headers";
import { BRAND_COOKIE } from "@/lib/session";

export async function setBrand(slug: string) {
  const value = /^[a-z0-9-]{1,40}$/.test(slug) ? slug : "todas";
  (await cookies()).set(BRAND_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 180 });
}
