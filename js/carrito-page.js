function renderCart() {
  const container = document.getElementById("cart-content");
  const items = getCart();

  if (items.length === 0) {
    container.innerHTML = `
      <p class="muted">Tu carrito está vacío.</p>
      <a href="/index.html" class="btn" style="margin-top:16px; display:inline-block">Ver catálogo</a>
    `;
    return;
  }

  const rows = items
    .map(
      (item) => `
      <div class="cart-row">
        <div class="thumb">${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" />` : "Sin imagen"}</div>
        <div class="info">
          <div class="name">${item.name}</div>
          <div class="unit">${formatCOP(item.unitPriceCents)} c/u</div>
        </div>
        <div class="qty-control">
          <button data-minus="${item.productId}">−</button>
          <span>${item.quantity}</span>
          <button data-plus="${item.productId}" ${item.quantity >= item.stock ? "disabled" : ""}>+</button>
        </div>
        <div class="line-total">${formatCOP(item.unitPriceCents * item.quantity)}</div>
        <button class="btn-text" data-remove="${item.productId}">Quitar</button>
      </div>
    `
    )
    .join("");

  container.innerHTML = `
    ${rows}
    <div style="margin-top:18px">
      <div class="summary-row total">
        <span>Subtotal</span>
        <span>${formatCOP(getCartSubtotalCents())}</span>
      </div>
    </div>
    <a href="/checkout.html" class="btn btn-block" style="margin-top:18px; text-align:center">Continuar al pago</a>
  `;

  container.querySelectorAll("[data-minus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.minus);
      const item = getCart().find((i) => i.productId === id);
      setCartQuantity(id, item.quantity - 1);
      renderCart();
    })
  );
  container.querySelectorAll("[data-plus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.plus);
      const item = getCart().find((i) => i.productId === id);
      setCartQuantity(id, item.quantity + 1);
      renderCart();
    })
  );
  container.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      removeFromCart(Number(btn.dataset.remove));
      renderCart();
    })
  );
}

renderCart();
