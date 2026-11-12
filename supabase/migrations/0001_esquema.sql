-- =====================================================================
-- Hub de Cuentas · Jorge Peñaloza MKT
-- Esquema completo (todas las fases) con seguridad por filas (RLS).
--
-- Perfiles:
--   admin   → Jorge. Ve y edita todo, administra accesos.
--   equipo  → Colaboradores (Diseño, Community). Ven y trabajan todas las marcas.
--   cliente → Solo ve las marcas que tiene asignadas (todo un cliente o marcas sueltas).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Clientes y marcas
-- ---------------------------------------------------------------------
create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  note        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete restrict,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  sector      text,
  initials    text not null check (char_length(initials) between 1 and 3),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index brands_client_idx on public.brands(client_id);

-- ---------------------------------------------------------------------
-- Perfiles (uno por usuario de Supabase Auth)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  full_name             text not null,
  initials              text not null check (char_length(initials) between 1 and 3),
  role                  text not null check (role in ('admin','equipo','cliente')),
  -- Cliente con acceso a todas las marcas de un cliente (ej. AlphaBrand)
  client_id             uuid references public.clients(id) on delete set null,
  contact_email         text,
  must_change_password  boolean not null default true,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  constraint client_scope_only_for_clients check (client_id is null or role = 'cliente')
);

-- Acceso a marcas sueltas (ej. un usuario que solo ve TaxBox)
create table public.profile_brands (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  brand_id    uuid not null references public.brands(id) on delete cascade,
  primary key (profile_id, brand_id)
);

-- ---------------------------------------------------------------------
-- Funciones de permisos (security definer para evitar recursión en RLS)
-- ---------------------------------------------------------------------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','equipo'), false)
$$;

create or replace function public.can_see_brand(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1
    from public.profiles p
    join public.brands br on br.id = b
    where p.id = auth.uid() and p.active and p.role = 'cliente'
      and (p.client_id = br.client_id
           or exists (select 1 from public.profile_brands pb where pb.profile_id = p.id and pb.brand_id = b))
  )
$$;

create or replace function public.can_see_client(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from public.brands br where br.client_id = c and public.can_see_brand(br.id)
  )
$$;

-- ---------------------------------------------------------------------
-- SCRUM: sprints semanales, tareas (backlog = sin sprint) y comentarios
-- ---------------------------------------------------------------------
create table public.sprints (
  id             uuid primary key default gen_random_uuid(),
  number         int not null unique,
  starts_on      date not null,
  ends_on        date not null,
  goal           text,
  status         text not null default 'planeado' check (status in ('planeado','activo','cerrado')),
  retro_good     text[] not null default '{}',
  retro_improve  text[] not null default '{}',
  retro_actions  text[] not null default '{}',
  created_at     timestamptz not null default now(),
  check (ends_on >= starts_on)
);
-- Solo un sprint activo a la vez
create unique index sprints_one_active on public.sprints(status) where status = 'activo';

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands(id) on delete cascade,
  sprint_id     uuid references public.sprints(id) on delete set null,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  type          text not null check (type in ('Diseño','Video','Copy','Pauta','Community','Reporte','Estrategia')),
  assignee_id   uuid references public.profiles(id) on delete set null,
  points        int not null default 1 check (points in (1,2,3,5,8,13)),
  status        text not null default 'todo' check (status in ('todo','doing','review','done')),
  priority      text not null default 'Media' check (priority in ('Alta','Media','Baja')),
  due_on        date,
  position      int not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index tasks_brand_idx on public.tasks(brand_id);
create index tasks_sprint_idx on public.tasks(sprint_id);
create index tasks_assignee_idx on public.tasks(assignee_id);

create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Parrilla de contenido
-- ---------------------------------------------------------------------
create table public.pieces (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid not null references public.brands(id) on delete cascade,
  code           text not null,
  week_label     text,
  publish_on     date not null,
  publish_time   time,
  pillar         text,
  channel        text,
  format         text,
  hook           text not null,
  creative_guide text,
  content        text,
  caption        text,
  paid_plan      text,
  whatsapp_msg   text,
  status         text not null default 'En proceso'
                 check (status in ('Por aprobar','Autorizado','Cambios','En proceso','Programado','Publicado')),
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (brand_id, code)
);
create index pieces_brand_date_idx on public.pieces(brand_id, publish_on);

-- Notas internas: tabla aparte para que el cliente nunca pueda leerlas
create table public.piece_notes (
  piece_id    uuid primary key references public.pieces(id) on delete cascade,
  note        text not null default '',
  updated_at  timestamptz not null default now()
);

create table public.piece_comments (
  id          uuid primary key default gen_random_uuid(),
  piece_id    uuid not null references public.pieces(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  kind        text not null default 'comentario' check (kind in ('comentario','autorizo','cambios')),
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index piece_comments_piece_idx on public.piece_comments(piece_id);

-- ---------------------------------------------------------------------
-- Campañas y métricas (carga por CSV de Meta, TikTok y Google)
-- ---------------------------------------------------------------------
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands(id) on delete cascade,
  platform      text not null check (platform in ('Meta','TikTok','Google')),
  name          text not null,
  status        text not null default 'Activa' check (status in ('Activa','Programada','Pausada','Terminada')),
  budget_label  text,
  created_at    timestamptz not null default now(),
  unique (brand_id, platform, name)
);

create table public.campaign_metrics (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  period_start   date not null,
  period_end     date not null,
  spend          numeric(12,2) not null default 0,
  reach          int,
  impressions    int not null default 0,
  clicks         int not null default 0,
  conversations  int not null default 0,
  sales          int,
  revenue        numeric(12,2),
  source_file    text,
  imported_by    uuid references public.profiles(id) on delete set null,
  imported_at    timestamptz not null default now(),
  check (period_end >= period_start),
  unique (campaign_id, period_start, period_end)
);

create table public.organic_metrics (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid not null references public.brands(id) on delete cascade,
  period_start     date not null,
  period_end       date not null,
  followers        int not null,
  new_followers    int not null default 0,
  engagement_rate  numeric(5,2),
  unique (brand_id, period_start, period_end)
);

-- ---------------------------------------------------------------------
-- Reportes semanales y mensuales
-- ---------------------------------------------------------------------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public.brands(id) on delete cascade,
  kind          text not null check (kind in ('semanal','mensual')),
  period_start  date not null,
  period_end    date not null,
  period_label  text not null,
  title         text not null,
  kpis          jsonb not null default '[]'::jsonb,  -- [{label, value, delta, up, lead}]
  summary       text,
  worked        text[] not null default '{}',
  adjust        text[] not null default '{}',
  next_steps    text[] not null default '{}',
  goal          text,
  trend         numeric[] not null default '{}',
  published_at  timestamptz,
  published_by  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (brand_id, kind, period_start)
);

-- ---------------------------------------------------------------------
-- Disparadores
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger tasks_touch   before update on public.tasks   for each row execute function public.touch_updated_at();
create trigger pieces_touch  before update on public.pieces  for each row execute function public.touch_updated_at();
create trigger reports_touch before update on public.reports for each row execute function public.touch_updated_at();

create or replace function public.task_completed_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end $$;
create trigger tasks_completed before insert or update on public.tasks for each row execute function public.task_completed_at();

-- ---------------------------------------------------------------------
-- Acciones del cliente sobre la parrilla (sin permiso directo de edición)
-- ---------------------------------------------------------------------
create or replace function public.client_review_piece(p_piece uuid, p_decision text, p_comment text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_brand  uuid;
  v_status text;
  v_name   text;
begin
  select brand_id, status into v_brand, v_status from public.pieces where id = p_piece;
  if v_brand is null or not public.can_see_brand(v_brand) then
    raise exception 'No tienes acceso a esta pieza';
  end if;
  if p_decision not in ('autorizo','cambios') then
    raise exception 'Decisión no válida';
  end if;
  if v_status not in ('Por aprobar','Cambios','Autorizado') then
    raise exception 'Esta pieza ya no se puede revisar';
  end if;
  if p_decision = 'cambios' and coalesce(btrim(p_comment), '') = '' then
    raise exception 'Escribe qué cambio necesitas';
  end if;

  select full_name into v_name from public.profiles where id = auth.uid();

  update public.pieces
     set status = case p_decision when 'autorizo' then 'Autorizado' else 'Cambios' end
   where id = p_piece;

  insert into public.piece_comments (piece_id, author_id, author_name, kind, body)
  values (p_piece, auth.uid(), coalesce(v_name, 'Cliente'), p_decision,
          coalesce(nullif(btrim(p_comment), ''), 'Autorizó la pieza.'));
end $$;

-- El usuario marca que ya cambió su contraseña temporal
create or replace function public.mark_password_changed() returns void
language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- Seguridad por filas
-- ---------------------------------------------------------------------
alter table public.clients          enable row level security;
alter table public.brands           enable row level security;
alter table public.profiles         enable row level security;
alter table public.profile_brands   enable row level security;
alter table public.sprints          enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_comments    enable row level security;
alter table public.pieces           enable row level security;
alter table public.piece_notes      enable row level security;
alter table public.piece_comments   enable row level security;
alter table public.campaigns        enable row level security;
alter table public.campaign_metrics enable row level security;
alter table public.organic_metrics  enable row level security;
alter table public.reports          enable row level security;

-- Clientes y marcas: lectura según acceso, escritura solo admin
create policy clients_read  on public.clients for select to authenticated using (public.can_see_client(id));
create policy clients_admin on public.clients for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy brands_read   on public.brands  for select to authenticated using (public.can_see_brand(id));
create policy brands_admin  on public.brands  for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perfiles: cada quien ve el suyo; el equipo ve a todos (para asignar tareas); solo admin escribe
create policy profiles_self  on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_admin on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy profile_brands_read  on public.profile_brands for select to authenticated using (profile_id = auth.uid() or public.is_admin());
create policy profile_brands_admin on public.profile_brands for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Sprints: todos los usuarios activos los leen; el equipo los edita
create policy sprints_read  on public.sprints for select to authenticated using (public.my_role() is not null);
create policy sprints_staff on public.sprints for all    to authenticated using (public.is_staff()) with check (public.is_staff());

-- Tareas: el equipo hace todo; el cliente solo ve las del sprint (no el backlog) de sus marcas
create policy tasks_staff  on public.tasks for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy tasks_client on public.tasks for select to authenticated using (sprint_id is not null and public.can_see_brand(brand_id));
create policy task_comments_staff on public.task_comments for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Parrilla
create policy pieces_read  on public.pieces for select to authenticated using (public.can_see_brand(brand_id));
create policy pieces_staff on public.pieces for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy piece_notes_staff on public.piece_notes for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy piece_comments_read on public.piece_comments for select to authenticated
  using (exists (select 1 from public.pieces p where p.id = piece_id and public.can_see_brand(p.brand_id)));
create policy piece_comments_insert on public.piece_comments for insert to authenticated
  with check (author_id = auth.uid() and kind = 'comentario'
              and exists (select 1 from public.pieces p where p.id = piece_id and public.can_see_brand(p.brand_id)));
create policy piece_comments_staff on public.piece_comments for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Campañas y métricas
create policy campaigns_read  on public.campaigns for select to authenticated using (public.can_see_brand(brand_id));
create policy campaigns_staff on public.campaigns for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cmetrics_read   on public.campaign_metrics for select to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_see_brand(c.brand_id)));
create policy cmetrics_staff  on public.campaign_metrics for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy organic_read    on public.organic_metrics for select to authenticated using (public.can_see_brand(brand_id));
create policy organic_staff   on public.organic_metrics for all    to authenticated using (public.is_staff()) with check (public.is_staff());

-- Reportes: el cliente solo ve los publicados
create policy reports_staff  on public.reports for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy reports_client on public.reports for select to authenticated using (published_at is not null and public.can_see_brand(brand_id));

-- ---------------------------------------------------------------------
-- Permisos de tabla: nada para visitantes anónimos
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;
revoke execute on all functions in schema public from public;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.client_review_piece(uuid, text, text) to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.my_role(), public.is_admin(), public.is_staff(),
                          public.can_see_brand(uuid), public.can_see_client(uuid) to authenticated;
