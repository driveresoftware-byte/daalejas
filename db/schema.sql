-- ============================================================
-- Esquema de la tienda. Cópialo y pégalo completo en:
-- Supabase → tu proyecto → SQL Editor → New query → Run
-- ============================================================

create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  slug text unique not null,
  description text not null default '',
  category text not null default 'general',
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promotions (
  id bigint generated always as identity primary key,
  code text unique not null,
  type text not null check (type in ('percentage', 'fixed')),
  value integer not null check (value > 0),
  min_order_cents integer not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  reference text unique not null,
  customer_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  total_cents integer not null,
  promotion_code text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  wompi_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists idx_products_active on products(active);
create index if not exists idx_orders_reference on orders(reference);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- ============================================================
-- Seguridad a nivel de fila (RLS).
-- "anon" = cualquier visitante del sitio. "authenticated" = quien
-- inició sesión con Supabase Auth (es decir, tu usuario admin).
-- Las funciones serverless (api/*.js) se conectan directo a Postgres
-- y por eso no dependen de estas políticas: siempre pueden leer/escribir.
-- ============================================================

alter table products enable row level security;
alter table promotions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Productos: el público ve solo los activos; el admin los ve todos.
create policy "ver_productos" on products
  for select using (active = true or auth.role() = 'authenticated');

create policy "admin_crea_productos" on products
  for insert to authenticated with check (true);
create policy "admin_actualiza_productos" on products
  for update to authenticated using (true) with check (true);
create policy "admin_elimina_productos" on products
  for delete to authenticated using (true);

-- Promociones: nadie del público las puede leer directamente (para que no
-- se puedan listar todos los códigos); solo el admin desde el panel.
create policy "admin_ve_promociones" on promotions
  for select to authenticated using (true);
create policy "admin_crea_promociones" on promotions
  for insert to authenticated with check (true);
create policy "admin_actualiza_promociones" on promotions
  for update to authenticated using (true) with check (true);
create policy "admin_elimina_promociones" on promotions
  for delete to authenticated using (true);

-- Pedidos: el navegador nunca escribe aquí directamente (lo hace la función
-- serverless). El admin los puede ver para el panel de pedidos.
create policy "admin_ve_pedidos" on orders
  for select to authenticated using (true);
create policy "admin_ve_items_pedidos" on order_items
  for select to authenticated using (true);
