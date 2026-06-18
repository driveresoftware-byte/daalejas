# Tienda de bienestar sexual — HTML + Supabase + Vercel

Tienda online completa construida con **HTML, CSS y JavaScript plano**. Sin
frameworks ni paso de "build". Solo editas los archivos y subes a Vercel.

## Estructura del proyecto

```
index.html              Catálogo de productos
producto.html           Detalle de producto
carrito.html            Carrito de compras
checkout.html           Datos de envío + pago
confirmacion.html       Página de confirmación de pago

css/styles.css          Hoja de estilos global
js/
  config.js             ← TUS credenciales de Supabase (edita esto)
  supabaseClient.js     Inicializa el cliente de Supabase
  money.js              Formateo de pesos colombianos
  cart.js               Lógica del carrito (localStorage)
  ui.js                 Header, footer y aviso de edad
  catalogo.js           Lógica del catálogo
  producto.js           Lógica del detalle de producto
  carrito-page.js       Lógica de la página del carrito
  checkout.js           Lógica del checkout y apertura del widget de Wompi
  confirmacion.js       Consulta el estado del pedido
  admin/
    guard.js            Protege las páginas de admin con Supabase Auth
    common.js           Navegación y helpers del panel

admin/
  login.html            Página de login del admin
  pedidos.html          Lista de pedidos
  productos.html        Gestión de productos (crear, editar, eliminar)
  promociones.html      Gestión de códigos de descuento

api/
  validate-promo.js     Valida un código de descuento (función serverless)
  create-order.js       Crea el pedido y firma el pago (función serverless)
  order-status.js       Consulta el estado de un pedido (función serverless)
  wompi-webhook.js      Recibe confirmaciones de pago de Wompi (función serverless)

lib/
  db.js                 Conexión a Postgres para las funciones serverless
  wompi.js              Firma de integridad y verificación de webhooks
  promotions.js         Cálculo de descuentos

db/
  schema.sql            ← Copia y pega esto en Supabase SQL Editor PRIMERO
  seed.sql              ← Luego copia y pega esto (datos de ejemplo)

vercel.json             Configuración de rutas de Vercel
package.json            Solo tiene "pg" como dependencia (para las funciones serverless)
```

---

## Paso 1 — Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea una cuenta si no tienes.
2. Crea un nuevo proyecto. Anota la **contraseña de la base de datos** que definas.
3. Espera 1-2 minutos mientras se aprovisiona.

---

## Paso 2 — Crear las tablas

1. En tu proyecto de Supabase, ve a **SQL Editor → New query**.
2. Copia todo el contenido de `db/schema.sql` y pégalo ahí. Dale a **Run**.
3. Repite con `db/seed.sql` para insertar los productos y promoción de ejemplo.

---

## Paso 3 — Crear tu usuario administrador

El panel de admin usa Supabase Auth (correo y contraseña).

1. En Supabase ve a **Authentication → Users → Add user → Create new user**.
2. Escribe el correo y contraseña con los que quieres entrar al panel `/admin`.
3. Ese será el único usuario con acceso al panel de administración.

---

## Paso 4 — Conectar el sitio a tu proyecto de Supabase

Abre `js/config.js` y reemplaza los dos valores con los de **tu** proyecto:

```js
const SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "pega-aqui-tu-anon-key";
```

Los encuentras en: Supabase → tu proyecto → **Project Settings → Data API**.
Copia la "URL" y la "anon public" key (no la service_role, esa nunca va en el navegador).

---

## Paso 5 — Variables de entorno (para las funciones de pago)

Las funciones serverless en `/api` necesitan acceder a la base de datos y a Wompi.
Estas variables las defines en Vercel (no en un archivo del proyecto).

| Variable | Dónde la encuentras |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → **Connection string → "Session"** (puerto **5432**) |
| `WOMPI_PUBLIC_KEY` | Panel de Wompi → llaves de prueba o producción |
| `WOMPI_INTEGRITY_SECRET` | Panel de Wompi → secreto de integridad |
| `WOMPI_EVENTS_SECRET` | Panel de Wompi → secreto de eventos |

> **Nota sobre el DATABASE_URL**: para las funciones serverless usa la cadena
> de conexión "Session" de Supabase (puerto 5432), no el pooler. El pooler
> (puerto 6543) no soporta el modo de transacciones que usa nuestro código.
> La encuentras en Project Settings → Database → Connection string → pestaña "Session".

---

## Paso 6 — Subir a GitHub y desplegar en Vercel

### Subir a GitHub
1. Crea un repositorio nuevo en github.com (vacío, sin README).
2. Desde la carpeta del proyecto en tu terminal:
```bash
git init
git add -A
git commit -m "Tienda inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

### Desplegar en Vercel
1. Entra a https://vercel.com e importa el repositorio.
2. En el formulario de import, **antes de desplegar**, ve a "Environment Variables"
   y agrega las 4 variables del Paso 5.
3. Dale a **Deploy**. Vercel detecta el `vercel.json` y lo configura solo.
4. Cuando termine, copia la URL que Vercel te asigna (ej: `tu-tienda.vercel.app`).

### Configurar el webhook de Wompi
En el panel de Wompi, configura la URL de eventos apuntando a:
`https://tu-tienda.vercel.app/api/wompi-webhook`

---

## Paso 7 — Probar el pago

Wompi entrega llaves de **sandbox** (pruebas) cuando creas tu cuenta de comercio.
Úsalas primero para hacer una compra completa de prueba. Cuando todo funcione,
reemplaza las variables de entorno en Vercel por las llaves de **producción**.

Tarjetas de prueba de Wompi: https://docs.wompi.co/docs/colombia/medios-de-pago-disponibles/

---

## Sobre el plan gratuito de Supabase

Los proyectos gratuitos se pausan automáticamente tras ~1 semana sin actividad.
Si eso pasa, la tienda no responderá hasta que entres al dashboard de Supabase
y la reactives manualmente. Para un negocio activo, considera el plan de pago.
