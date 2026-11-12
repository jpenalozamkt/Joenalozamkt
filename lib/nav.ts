import type { Role } from "@/lib/types";

export type NavItem = { href: string; label: string; icon: IconName; phase?: number };
export type IconName = "inicio" | "mis" | "tablero" | "backlog" | "parrilla" | "campanas" | "reportes" | "accesos" | "clientes";

const STAFF: NavItem[] = [
  { href: "/panorama", label: "Panorama", icon: "inicio" },
  { href: "/mis-tareas", label: "Mis tareas", icon: "mis", phase: 2 },
  { href: "/sprint", label: "Sprint", icon: "tablero", phase: 2 },
  { href: "/backlog", label: "Backlog", icon: "backlog", phase: 2 },
  { href: "/parrilla", label: "Parrilla", icon: "parrilla", phase: 3 },
  { href: "/campanas", label: "Campañas", icon: "campanas", phase: 4 },
  { href: "/reportes", label: "Reportes", icon: "reportes", phase: 4 },
];

const ADMIN_EXTRA: NavItem[] = [
  { href: "/accesos", label: "Accesos", icon: "accesos" },
  { href: "/clientes", label: "Clientes y marcas", icon: "clientes" },
];

const CLIENT: NavItem[] = [
  { href: "/mi-cuenta", label: "Mi cuenta", icon: "inicio" },
  { href: "/avance", label: "Avance", icon: "tablero", phase: 2 },
  { href: "/parrilla", label: "Parrilla", icon: "parrilla", phase: 3 },
  { href: "/campanas", label: "Campañas", icon: "campanas", phase: 4 },
  { href: "/reportes", label: "Reportes", icon: "reportes", phase: 4 },
];

export function navFor(role: Role): { main: NavItem[]; admin: NavItem[] } {
  if (role === "cliente") return { main: CLIENT, admin: [] };
  if (role === "equipo") return { main: [STAFF[1], STAFF[0], ...STAFF.slice(2)], admin: [] };
  return { main: STAFF, admin: ADMIN_EXTRA };
}
