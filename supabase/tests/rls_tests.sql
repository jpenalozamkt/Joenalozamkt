-- Pruebas de permisos. Cada bloque actúa como un usuario distinto.
\set ON_ERROR_STOP on
-- Usuarios de prueba
insert into auth.users (id) values
 ('00000000-0000-0000-0000-00000000000a'),  -- admin
 ('00000000-0000-0000-0000-00000000000b'),  -- equipo
 ('00000000-0000-0000-0000-00000000000c'),  -- cliente AlphaBrand (todas sus marcas)
 ('00000000-0000-0000-0000-00000000000d'),  -- cliente solo TaxBox
 ('00000000-0000-0000-0000-00000000000e');  -- cliente Ilse
insert into public.profiles (id, username, full_name, initials, role, client_id) values
 ('00000000-0000-0000-0000-00000000000a','jorge','Jorge Peñaloza','JP','admin',null),
 ('00000000-0000-0000-0000-00000000000b','diseno','Diseño','DI','equipo',null),
 ('00000000-0000-0000-0000-00000000000c','alphabrand','AlphaBrand','AB','cliente',(select id from clients where name='AlphaBrand')),
 ('00000000-0000-0000-0000-00000000000d','taxbox','Equipo TaxBox','TB','cliente',null),
 ('00000000-0000-0000-0000-00000000000e','ilse','Ilse Cosio','IC','cliente',(select id from clients where name='Ilse Cosio'));
insert into public.profile_brands values ('00000000-0000-0000-0000-00000000000d',(select id from brands where slug='taxbox'));

insert into public.sprints (number, starts_on, ends_on, status) values (46,'2026-11-09','2026-11-13','activo');
insert into public.tasks (brand_id, sprint_id, title, type) values
 ((select id from brands where slug='taxbox'), (select id from sprints where number=46), 'Tarea sprint TaxBox','Diseño'),
 ((select id from brands where slug='taxbox'), null, 'Tarea backlog TaxBox','Copy'),
 ((select id from brands where slug='ilse-cosio'), (select id from sprints where number=46), 'Tarea Ilse','Reporte');
insert into public.pieces (brand_id, code, publish_on, hook, status) values
 ((select id from brands where slug='taxbox'),'ORG-32','2026-11-16','Quedan 2 días','Por aprobar'),
 ((select id from brands where slug='luca'),'BF-01','2026-11-13','Empieza el Buen Fin','Por aprobar'),
 ((select id from brands where slug='ilse-cosio'),'IC-01','2026-11-14','Pieza Ilse','En proceso');
insert into public.piece_notes values ((select id from pieces where code='ORG-32'),'nota secreta', now());
insert into public.reports (brand_id, kind, period_start, period_end, period_label, title, published_at) values
 ((select id from brands where slug='taxbox'),'semanal','2026-11-02','2026-11-08','S1','publicado', now()),
 ((select id from brands where slug='taxbox'),'mensual','2026-10-01','2026-10-31','Oct','borrador', null);

create function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false); $$;
create function pg_temp.check(cond boolean, msg text) returns void language plpgsql as $$
begin if not cond then raise exception 'FALLÓ: %', msg; end if; raise notice 'ok · %', msg; end $$;

set role authenticated;

-- Anónimo: nada
select pg_temp.as_user('');
select pg_temp.check((select count(*) from brands) = 0, 'sin sesión no ve marcas');

-- Admin
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from brands) = 8, 'admin ve las 8 marcas');
select pg_temp.check((select count(*) from profiles) = 5, 'admin ve todos los perfiles');
insert into clients (name) values ('Cliente nuevo');
select pg_temp.check(true, 'admin crea clientes');

-- Equipo
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from tasks) = 3, 'equipo ve sprint y backlog');
select pg_temp.check((select count(*) from piece_notes) = 1, 'equipo ve notas internas');
select pg_temp.check((select count(*) from reports) = 2, 'equipo ve reportes en borrador');
update tasks set status = 'done' where title = 'Tarea sprint TaxBox';
select pg_temp.check((select completed_at is not null from tasks where title='Tarea sprint TaxBox'), 'al cerrar tarea se guarda la fecha');
do $$ begin
  insert into clients (name) values ('No debe');
  raise exception 'FALLÓ: equipo pudo crear cliente';
exception when insufficient_privilege then raise notice 'ok · equipo no crea clientes';
end $$;

-- Cliente AlphaBrand (todas sus marcas)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from brands) = 7, 'AlphaBrand ve sus 7 marcas');
select pg_temp.check((select count(*) from clients) = 1, 'AlphaBrand solo ve su cliente');
select pg_temp.check((select count(*) from tasks) = 1, 'AlphaBrand ve solo tareas del sprint, no backlog ni otras marcas');
select pg_temp.check((select count(*) from pieces) = 2, 'AlphaBrand ve piezas de TaxBox y LUCA');
select pg_temp.check((select count(*) from piece_notes) = 0, 'cliente no ve notas internas');
select pg_temp.check((select count(*) from reports) = 1, 'cliente solo ve reportes publicados');
select pg_temp.check((select count(*) from profiles) = 1, 'cliente solo ve su propio perfil');
update pieces set status = 'Publicado';
select pg_temp.check((select count(*) from pieces where status='Publicado') = 0, 'cliente no edita piezas directamente');
select public.client_review_piece((select id from pieces where code='ORG-32'), 'autorizo');
select pg_temp.check((select status from pieces where code='ORG-32') = 'Autorizado', 'cliente autoriza con la función');
select pg_temp.check((select count(*) from piece_comments where kind='autorizo') = 1, 'queda registro de la autorización');
do $$ begin
  perform public.client_review_piece((select id from pieces where code='BF-01'), 'cambios', '  ');
  raise exception 'FALLÓ: cambios sin comentario';
exception when raise_exception then
  if sqlerrm like 'FALLÓ%' then raise; end if;
  raise notice 'ok · pedir cambios exige comentario';
end $$;
insert into piece_comments (piece_id, author_id, author_name, body)
values ((select id from pieces where code='BF-01'), '00000000-0000-0000-0000-00000000000c', 'AlphaBrand', 'Duda sobre el precio');
select pg_temp.check(true, 'cliente comenta piezas de sus marcas');
do $$ begin
  insert into piece_comments (piece_id, author_id, author_name, kind, body)
  values ((select id from pieces where code='BF-01'), '00000000-0000-0000-0000-00000000000c', 'AlphaBrand', 'autorizo', 'trampa');
  raise exception 'FALLÓ: cliente insertó autorización directa';
exception when insufficient_privilege then raise notice 'ok · cliente no falsifica autorizaciones';
end $$;
do $$ begin
  update profiles set role = 'admin' where id = auth.uid();
  if (select role from profiles where id = auth.uid()) = 'admin' then raise exception 'FALLÓ: cliente se hizo admin'; end if;
  raise notice 'ok · cliente no cambia su rol';
end $$;

-- Cliente con una sola marca
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from brands) = 1, 'usuario TaxBox solo ve TaxBox');
select pg_temp.check((select count(*) from pieces) = 1, 'usuario TaxBox no ve piezas de LUCA');
do $$ begin
  perform public.client_review_piece((select id from pieces where code='BF-01'), 'autorizo');
  raise exception 'FALLÓ: autorizó pieza ajena';
exception when raise_exception then
  if sqlerrm like 'FALLÓ%' then raise; end if;
  raise notice 'ok · no autoriza piezas de otra marca';
end $$;

-- Cliente Ilse
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from brands) = 1 and (select slug from brands) = 'ilse-cosio', 'Ilse solo ve su marca');
select pg_temp.check((select count(*) from pieces) = 1, 'Ilse ve solo su pieza');

-- Usuario desactivado pierde acceso
reset role;
update profiles set active = false where username = 'ilse';
set role authenticated;
select pg_temp.check((select count(*) from brands) = 0, 'usuario desactivado no ve nada');

-- Cambio de contraseña
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select public.mark_password_changed();
select pg_temp.check((select not must_change_password from profiles where username='diseno'), 'marca contraseña cambiada');
\echo TODAS LAS PRUEBAS PASARON
