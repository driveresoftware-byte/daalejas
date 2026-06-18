const MESSAGES = {
  pending: {
    title: "Estamos confirmando tu pago",
    body: "Te notificaremos por correo en cuanto se confirme. No cierres esta página todavía.",
  },
  paid: {
    title: "¡Pago confirmado!",
    body: "Tu pedido fue recibido y entra en preparación para envío discreto.",
  },
  failed: { title: "El pago no se completó", body: "Puedes volver a intentarlo desde tu carrito." },
  cancelled: { title: "El pago fue cancelado", body: "Puedes volver a intentarlo desde tu carrito." },
  not_found: {
    title: "No encontramos ese pedido",
    body: "Revisa el enlace o contáctanos si el problema persiste.",
  },
};

function renderStatus(status, totalCents, reference) {
  const msg = MESSAGES[status] || MESSAGES.pending;
  document.getElementById("confirmation-content").innerHTML = `
    <h1 style="font-size:1.5rem">${msg.title}</h1>
    <p class="muted" style="margin-top:10px">${msg.body}</p>
    ${totalCents != null ? `<p class="muted" style="margin-top:14px">Total del pedido: ${formatCOP(totalCents)}</p>` : ""}
    ${reference ? `<p class="muted" style="font-size:0.75rem">Referencia: ${reference}</p>` : ""}
    <a href="/index.html" class="btn" style="margin-top:20px; display:inline-block">Volver al catálogo</a>
  `;
}

async function pollOrder(reference, attempt = 0) {
  try {
    const response = await fetch(`/api/order-status?reference=${encodeURIComponent(reference)}`);
    if (response.status === 404) {
      renderStatus("not_found", null, reference);
      return;
    }
    const data = await response.json();
    renderStatus(data.order.status, data.order.total_cents, reference);
    if (data.order.status === "pending" && attempt < 15) {
      setTimeout(() => pollOrder(reference, attempt + 1), 2000);
    }
  } catch {
    renderStatus("not_found", null, reference);
  }
}

const reference = new URLSearchParams(window.location.search).get("ref");
if (!reference) {
  renderStatus("not_found", null, null);
} else {
  pollOrder(reference);
}
