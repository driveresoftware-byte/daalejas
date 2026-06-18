-- Datos de ejemplo. Córrelo después de schema.sql. Bórralos o edítalos
-- desde el panel /admin/productos.html cuando tengas tu catálogo real.

insert into products (name, slug, description, category, price_cents, compare_at_price_cents, stock, image_url, active)
values
  ('Aceite de masaje relajante 100ml', 'aceite-masaje-relajante-100ml', 'Aceite hipoalergénico para masajes en pareja, aroma suave a vainilla.', 'bienestar', 4900000, null, 25, null, true),
  ('Lubricante base de agua 100ml', 'lubricante-base-agua-100ml', 'Fórmula sin parabenos, compatible con todos los materiales de juguetes.', 'bienestar', 3500000, 4200000, 40, null, true),
  ('Vela de masaje aromática', 'vela-masaje-aromatica', 'Vela que se derrite en aceite tibio para masajes. Aroma a sándalo.', 'bienestar', 5900000, null, 15, null, true),
  ('Set de accesorios para parejas', 'set-accesorios-parejas', 'Kit básico de accesorios para parejas, incluye guía de uso y bolsa discreta.', 'parejas', 8900000, 10500000, 10, null, true),
  ('Kit de cuidado íntimo', 'kit-cuidado-intimo', 'Set de higiene íntima con jabón neutro y toallitas biodegradables.', 'cuidado', 2900000, null, 30, null, true)
on conflict (slug) do nothing;

insert into promotions (code, type, value, min_order_cents, max_uses, active)
values
  ('BIENVENIDA10', 'percentage', 10, 0, null, true)
on conflict (code) do nothing;
