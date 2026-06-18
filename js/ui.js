function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  el.innerHTML = `
    <div class="bar">
      <a href="/index.html" class="logo">Discreto<em>&amp;</em>Íntimo</a>
      <nav>
        <a href="/index.html">Catálogo</a>
        <a href="/carrito.html">
          <span class="material-symbols-outlined">shopping_bag</span>
          Carrito
          <span id="cart-count" class="cart-badge" style="display:none">0</span>
        </a>
      </nav>
    </div>
  `;
  updateCartBadge();
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.innerHTML = `
    <div class="container">
      <p>Envíos en empaque neutro, sin marcas visibles. Pagos procesados de forma segura.</p>
      <p style="margin-top:4px">© ${new Date().getFullYear()} Discreto &amp; Íntimo. Producto exclusivo para mayores de edad.</p>
    </div>
  `;
}

function renderAgeGate() {
  const KEY = "verificacion_edad_v1";
  if (localStorage.getItem(KEY)) return;

  const el = document.createElement("div");
  el.id = "age-gate";
  el.innerHTML = `
    <div class="box" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div class="seal">18+</div>
      <h2 id="age-gate-title" style="font-size:1.2rem">Contenido para mayores de edad</h2>
      <p class="muted" style="margin-top:10px">
        Este sitio vende productos de bienestar sexual para adultos. Para continuar,
        confirma que tienes 18 años o más.
      </p>
      <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px">
        <button id="age-confirm" class="btn btn-block">Tengo 18 años o más</button>
        <button id="age-decline" class="btn-text">Salir</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById("age-confirm").addEventListener("click", () => {
    localStorage.setItem(KEY, "true");
    el.remove();
  });
  document.getElementById("age-decline").addEventListener("click", () => {
    window.location.href = "https://www.google.com";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderAgeGate();
});
