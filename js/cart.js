const CART_KEY = "carrito_v1";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function addToCart(item) {
  const items = getCart();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, existing.stock);
  } else {
    items.push(item);
  }
  saveCart(items);
}

function setCartQuantity(productId, quantity) {
  let items = getCart();
  items = items
    .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i))
    .filter((i) => i.quantity > 0);
  saveCart(items);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.productId !== productId));
}

function clearCart() {
  saveCart([]);
}

function getCartSubtotalCents() {
  return getCart().reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = String(count);
  badge.style.display = count > 0 ? "inline-flex" : "none";
}
