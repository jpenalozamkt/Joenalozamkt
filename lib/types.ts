export type Role = "admin" | "equipo" | "cliente";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  initials: string;
  role: Role;
  client_id: string | null;
  contact_email: string | null;
  must_change_password: boolean;
  active: boolean;
};

export type Client = { id: string; name: string; note: string | null; active: boolean };

export type Brand = {
  id: string;
  client_id: string;
  slug: string;
  name: string;
  sector: string | null;
  initials: string;
  active: boolean;
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  equipo: "Colaborador",
  cliente: "Cliente",
};
