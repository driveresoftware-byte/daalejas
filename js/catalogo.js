function productCardHTML(product) {
  const outOfStock = product.stock <= 0;
  const image = product.image_url
    ? `<img src="${product.image_url}" alt="${product.name}" />`
    : "Sin imagen";
  const oldPrice = product.compare_at_price_cents
    ? `<span class="old">${formatCOP(product.compare_at_price_cents)}</span>`
    : "";

  return `
    <div class="product-card">
      <a href="/producto.html?slug=${encodeURIComponent(product.slug)}">
        <div class="thumb">${image}</div>
        <p class="category">${product.category}</p>
        <h3>${product.name}</h3>
      </a>
      <div class="price-row">
        <span>${formatCOP(product.price_cents)}</span>
        ${oldPrice}
      </div>
      <button class="btn" data-add="${product.id}" ${outOfStock ? "disabled" : ""}>
        ${outOfStock ? "Agotado" : "Agregar al carrito"}
      </button>
    </div>
  `;
}

async function loadProducts() {
  const grid = document.getElementById("product-grid");
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="error-text">No se pudo cargar el catálogo: ${error.message}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    grid.innerHTML = `<p class="muted">Todavía no hay productos publicados.</p>`;
    return;
  }

  grid.innerHTML = data.map(productCardHTML).join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = data.find((p) => String(p.id) === button.dataset.add);
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        unitPriceCents: product.price_cents,
        quantity: 1,
        imageUrl: product.image_url,
        stock: product.stock,
      });
      const original = button.textContent;
      button.textContent = "Agregado ✓";
      setTimeout(() => (button.textContent = original), 1200);
    });
  });
}

loadProducts();
