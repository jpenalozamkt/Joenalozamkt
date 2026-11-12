# Hub de Cuentas · Jorge Peñaloza MKT

Espacio de trabajo para el equipo y los clientes de Jorge Peñaloza MKT: sprint semanal (SCRUM), parrilla con aprobación del cliente, campañas de Meta, TikTok y Google Ads, reportes y control de accesos.

- **Prototipo visual:** `prototipo/index.html` (referencia de diseño, no se publica con la app).
- **App real:** Next.js 15 + Supabase (base de datos, inicio de sesión y permisos por fila), publicada en Vercel.

## Fases

| Fase | Qué incluye | Estado |
|---|---|---|
| 1 · Cimientos | Inicio de sesión con usuario y contraseña, perfiles (admin, colaborador, cliente), clientes y marcas, accesos, panorama, base de datos completa con permisos | ✅ Lista |
| 2 · SCRUM | Mis tareas, sprint semanal con tablero, backlog, burndown, velocidad, retro; avance para el cliente | Siguiente |
| 3 · Parrilla | Tabla y calendario, aprobación y comentarios del cliente, importación desde Google Sheets | Pendiente |
| 4 · Campañas y reportes | Carga de CSV de Meta, TikTok y Google; indicadores; reportes semanales y mensuales publicables | Pendiente |
| 5 · Pulido | Avisos por correo, logo oficial, dominio propio | Pendiente |

## Quién ve qué

| | Admin (Jorge) | Colaborador | Cliente |
|---|---|---|---|
| Marcas | Todas | Todas | Solo las suyas (todo su cliente o marcas sueltas) |
| Backlog y notas internas | Sí | Sí | No |
| Tareas del sprint | Edita | Edita | Solo ve |
| Parrilla | Edita | Edita | Ve, comenta, autoriza o pide cambios |
| Reportes | Todos | Todos | Solo los publicados |
| Accesos, clientes y marcas | Sí | No | No |

Los permisos viven en la base de datos (`supabase/migrations/0001_esquema.sql`), no solo en las pantallas: aunque alguien manipule la dirección, la base de datos no le entrega lo que no le toca.

---

## Puesta en marcha (una sola vez)

Necesitas dos cuentas gratuitas: **Supabase** (base de datos) y **Vercel** (donde vive la página). Toma unos 20 minutos.

### 1. Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta y un **New project**. Nombre: `hub-jpmkt`. Región: la más cercana (por ejemplo *East US*). Guarda la contraseña de la base de datos en un lugar seguro.
2. En el menú izquierdo abre **SQL Editor** → **New query**. Copia todo el contenido de `supabase/migrations/0001_esquema.sql`, pégalo y presiona **Run**. Debe decir *Success*.
3. Haz lo mismo con `supabase/migrations/0002_datos_iniciales.sql` (crea AlphaBrand con sus 7 marcas e Ilse Cosio).
4. Ve a **Authentication → Sign In / Providers → Email** y desactiva **Allow new users to sign up**. Así nadie puede crearse una cuenta por su lado; solo tú desde Accesos.
5. Ve a **Project Settings → API Keys** (o **Data API**) y ten a mano tres datos:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key**
   - **service_role key** (secreta: no la compartas con nadie)

### 2. Vercel

1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub.
2. **Add New → Project** y elige el repositorio `jpenalozamkt/Joenalozamkt`.
3. Antes de publicar, abre **Environment Variables** y agrega estas cinco:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `SETUP_CODE` | Un código largo que inventes (ej. `jp-hub-2026-arranque-larguisimo`) |
   | `AUTH_EMAIL_DOMAIN` | `usuarios.hub-jpmkt.app` |

4. Presiona **Deploy**. Al terminar, Vercel te da una dirección como `https://joenalozamkt.vercel.app`.

> Vercel publica la rama principal (`main`). Mientras el trabajo esté en otra rama, en **Settings → Git → Production Branch** puedes elegirla, o une la rama a `main`.

### 3. Crea tu usuario de administrador

1. Abre `https://TU-DIRECCION.vercel.app/configuracion-inicial`.
2. Escribe el `SETUP_CODE`, tu nombre, tu usuario (por ejemplo `jorge`) y una contraseña de al menos 10 caracteres.
3. Entra en `/entrar`. Esta pantalla deja de funcionar en cuanto existe un administrador.

### 4. Da de alta a tu equipo y a tus clientes

En **Accesos** → **Nuevo usuario**:
- **Colaborador** (Diseño, Community): ve todas las marcas. Hay 5 lugares de equipo, contándote a ti.
- **Cliente**: eliges si ve todo su cliente (ej. *Todo AlphaBrand*, sus 7 marcas) o una sola marca (ej. *Solo TaxBox*).

La herramienta genera una contraseña temporal. Compártela por WhatsApp; al entrar por primera vez, la persona elige la suya. Si alguien la olvida, usa **Nueva contraseña**. Si alguien deja de trabajar contigo, **Desactivar** le corta el acceso al momento.

En **Clientes y marcas** agregas clientes nuevos o marcas a un cliente existente, y pausas las que ya no atiendes.

## Costos

- **Supabase Free:** suficiente para empezar. El proyecto se pausa si pasa una semana sin uso; se reactiva desde el panel. El plan Pro (25 USD/mes) evita la pausa y agrega respaldos diarios.
- **Vercel Hobby:** gratis, pero sus condiciones lo limitan a uso no comercial. Para usarlo con clientes lo correcto es el plan Pro (20 USD/mes por persona que publica; solo tú).

---

## Para desarrolladores

```bash
npm install
cp .env.example .env.local   # y llena los valores
npm run dev                  # http://localhost:3000
npm run typecheck
npm run test:db              # prueba esquema y permisos en un Postgres temporal (necesita PostgreSQL 16 instalado)
```

Estructura:
- `app/(hub)/…` pantallas con sesión; `app/entrar`, `app/configuracion-inicial`, `app/cambiar-contrasena` públicas o de cuenta.
- `lib/session.ts` usuario actual y marcas visibles; `lib/nav.ts` menú por perfil.
- `supabase/migrations` esquema y datos iniciales; `supabase/tests` pruebas de permisos.

El usuario se convierte internamente en correo (`usuario@AUTH_EMAIL_DOMAIN`) para Supabase Auth. No se envían correos.
