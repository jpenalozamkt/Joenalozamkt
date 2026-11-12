-- Clientes y marcas iniciales de Jorge Peñaloza MKT
insert into public.clients (name, note) values
  ('AlphaBrand', 'Agencia · Puebla'),
  ('Ilse Cosio', 'Marca personal')
on conflict (name) do nothing;

insert into public.brands (client_id, slug, name, sector, initials)
select c.id, b.slug, b.name, b.sector, b.initials
from (values
  ('AlphaBrand', 'taxbox',      'TaxBox',             'Devolución de impuestos por nómina', 'TB'),
  ('AlphaBrand', 'luca',        'LUCA',               'Plataforma contable · Lite y Pro',   'LU'),
  ('AlphaBrand', 'castelan',    'Castelán',           null,                                 'CA'),
  ('AlphaBrand', 'facturafast', 'FacturaFast',        null,                                 'FF'),
  ('AlphaBrand', 'meson',       'Mesón de los Reyes', null,                                 'MR'),
  ('AlphaBrand', 'milo',        'MILO',               null,                                 'MI'),
  ('AlphaBrand', 'novaflight',  'NovaFlight',         null,                                 'NF'),
  ('Ilse Cosio', 'ilse-cosio',  'Ilse Cosio',         'Marca personal',                     'IC')
) as b(client, slug, name, sector, initials)
join public.clients c on c.name = b.client
on conflict (slug) do nothing;
