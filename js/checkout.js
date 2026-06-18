let appliedPromo = null; // { code, discountCents } | null
let orderInFlight = false;

function renderCheckout() {
  const items = getCart();
  const container = document.getElementById("checkout-content");

  if (items.length === 0) {
    container.innerHTML = `
      <h1 style="font-size:1.6rem">No hay nada para pagar</h1>
      <a href="/index.html" style="color:var(--wine); font-size:0.9rem">Volver al catálogo</a>
    `;
    return;
  }

  const subtotal = getCartSubtotalCents();

  container.innerHTML = `
    <div class="checkout-grid">
      <div>
        <h1 style="font-size:1.5rem">Datos de envío</h1>
        <div style="margin-top:18px">
          <div class="field"><input id="f-name" placeholder="Nombre completo" /></div>
          <div class="field"><input id="f-email" type="email" placeholder="Correo electrónico" /></div>
          <div class="field"><input id="f-phone" placeholder="Teléfono" /></div>
          <div class="field"><input id="f-address" placeholder="Dirección de entrega" /></div>
          <div class="field"><input id="f-city" placeholder="Ciudad" /></div>
          <p class="muted">Tu pedido se enviará en empaque neutro, sin ningún logo visible.</p>
        </div>
      </div>

      <div>
        <h2 style="font-size:1.3rem">Resumen</h2>
        <div style="margin-top:12px">
          ${items
            .map(
              (i) => `
            <div class="summary-row">
              <span>${i.name} × ${i.quantity}</span>
              <span>${formatCOP(i.unitPriceCents * i.quantity)}</span>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="display:flex; gap:8px; margin-top:14px">
          <input id="promo-code" placeholder="Código de promoción" style="text-transform:uppercase" />
          <button id="apply-promo" class="btn-outline" style="white-space:nowrap">Aplicar</button>
        </div>
        <div id="promo-feedback"></div>

        <div style="margin-top:14px">
          <div class="summary-row"><span>Subtotal</span><span id="subtotal-value">${formatCOP(subtotal)}</span></div>
          <div id="discount-row" class="summary-row" style="display:none; color:var(--sage)">
            <span>Descuento</span><span id="discount-value"></span>
          </div>
          <div class="summary-row total"><span>Total</span><span id="total-value">${formatCOP(subtotal)}</span></div>
        </div>

        <div style="margin-top:20px">
          <button id="pay-button" class="btn btn-block">Continuar al pago</button>
          <div id="order-feedback"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("apply-promo").addEventListener("click", applyPromo);
  document.getElementById("pay-button").addEventListener("click", startPayment);
}

function updateTotals() {
  const subtotal = getCartSubtotalCents();
  const discount = appliedPromo ? appliedPromo.discountCents : 0;
  const total = Math.max(subtotal - discount, 0);

  document.getElementById("subtotal-value").textContent = formatCOP(subtotal);
  document.getElementById("total-value").textContent = formatCOP(total);
  const discountRow = document.getElementById("discount-row");
  if (discount > 0) {
    discountRow.style.display = "flex";
    document.getElementById("discount-value").textContent = `-${formatCOP(discount)}`;
  } else {
    discountRow.style.display = "none";
  }
}

async function applyPromo() {
  const code = document.getElementById("promo-code").value.trim();
  const feedback = document.getElementById("promo-feedback");
  if (!code) return;

  feedback.innerHTML = `<p class="muted">Validando…</p>`;
  try {
    const response = await fetch("/api/validate-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotalCents: getCartSubtotalCents() }),
    });
    const data = await response.json();
    if (data.valid) {
      appliedPromo = { code: data.code, discountCents: data.discountCents };
      feedback.innerHTML = `<p class="success-text">Código ${data.code} aplicado: -${formatCOP(data.discountCents)}</p>`;
    } else {
      appliedPromo = null;
      feedback.innerHTML = `<p class="error-text">${data.reason}</p>`;
    }
  } catch {
    feedback.innerHTML = `<p class="error-text">No se pudo validar el código.</p>`;
  }
  updateTotals();
}

function readForm() {
  return {
    customerName: document.getElementById("f-name").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    phone: document.getElementById("f-phone").value.trim(),
    address: document.getElementById("f-address").value.trim(),
    city: document.getElementById("f-city").value.trim(),
  };
}

async function startPayment() {
  if (orderInFlight) return;
  const form = readForm();
  const feedback = document.getElementById("order-feedback");

  if (Object.values(form).some((v) => !v)) {
    feedback.innerHTML = `<p class="error-text">Completa todos los datos de envío.</p>`;
    return;
  }

  orderInFlight = true;
  const button = document.getElementById("pay-button");
  button.disabled = true;
  button.textContent = "Preparando pedido…";
  feedback.innerHTML = "";

  try {
    const items = getCart().map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, promotionCode: appliedPromo ? appliedPromo.code : null, items }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo crear el pedido.");

    button.textContent = "Abriendo pasarela de pago…";

    const wompiCheckout = new WidgetCheckout({
      currency: data.currency,
      amountInCents: data.amountInCents,
      reference: data.reference,
      publicKey: data.publicKey,
      signature: { integrity: data.signature },
    });

    wompiCheckout.open((result) => {
      const status = result?.transaction?.status;
      if (status === "APPROVED") clearCart();
      window.location.href = `/confirmacion.html?ref=${encodeURIComponent(data.reference)}`;
    });
  } catch (err) {
    feedback.innerHTML = `<p class="error-text">${err.message}</p>`;
    button.disabled = false;
    button.textContent = "Continuar al pago";
    orderInFlight = false;
  }
}

renderCheckout();
