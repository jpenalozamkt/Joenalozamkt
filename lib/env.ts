function req(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  return value;
}

export const env = {
  url: () => req("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey: () => req("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceKey: () => req("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  setupCode: () => process.env.SETUP_CODE ?? "",
  emailDomain: () => process.env.AUTH_EMAIL_DOMAIN || "usuarios.hub-jpmkt.app",
};

/** Convierte el usuario (ej. "alphabrand") en el correo interno con el que se autentica. */
export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${env.emailDomain()}`;
}
