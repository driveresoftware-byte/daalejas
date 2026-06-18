function renderAdminNav(activePage) {
  const pages = [
    { href: "/admin/pedidos.html", label: "Pedidos" },
    { href: "/admin/productos.html", label: "Productos" },
    { href: "/admin/promociones.html", label: "Promociones" },
  ];
  const links = pages
    .map((p) => `<a href="${p.href}" class="${activePage === p.href ? "active" : ""}">${p.label}</a>`)
    .join("");
  return `
    <div class="admin-nav">
      <div class="links">${links}</div>
      <button class="btn-text" onclick="adminLogout()">
        <span class="material-symbols-outlined">logout</span> Salir
      </button>
    </div>
  `;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function setFeedback(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = isError ? "error-text" : "success-text";
}

const STATUS_LABELS = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
};
const STATUS_CSS = {
  pending: "status-pending",
  paid: "status-paid",
  failed: "status-failed",
  cancelled: "status-cancelled",
};
