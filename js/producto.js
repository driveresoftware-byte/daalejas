let currentProduct = null;
let currentQuantity = 1;

function renderProduct(product) {
  const image = product.image_url
    ? `<img src="${product.image_url}" alt="${product.name}" />`
    : "Sin imagen";
  const oldPrice = product.compare_at_price_cents
    ? `<span class="old">${formatCOP(product.compare_at_price_cents)}</span>`
    : "";
  const outOfStock = product.stock <= 0;

  document.getElementById("product-detail").innerHTML = `
    <div class="product-detail">
      <div class="thumb">${image}</div>
      <div>
        <p class="category">${product.category}</p>
        <h1 style="font-size:1.5rem">${product.name}</h1>
        <div class="price-row">
          <span style="font-size:1.1rem">${formatCOP(product.price_cents)}</span>
          ${oldPrice}
        </div>
        <p class="muted" style="margin-top:14px">${product.description}</p>
        ${
          outOfStock
            ? `<p class="muted" style="margin-top:20px">Agotado por el momento.</p>`
            : `
          <div style="margin-top:20px; display:flex; gap:12px; align-items:center">
            <div class="qty-control">
              <button id="qty-minus">−</button>
              <span id="qty-value">1</span>
              <button id="qty-plus">+</button>
            </div>
            <button id="add-button" class="btn" style="flex:1">Agregar al carrito</button>
          </div>
        `
        }
      </div>
    </div>
  `;

  if (outOfStock) return;

  document.getElementById("qty-minus").addEventListener("click", () => {
    currentQuantity = Math.max(1, currentQuantity - 1);
    document.getElementById("qty-value").textContent = currentQuantity;
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    currentQuantity = Math.min(product.stock, currentQuantity + 1);
    document.getElementById("qty-value").textContent = currentQuantity;
  });
  document.getElementById("add-button").addEventListener("click", () => {
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      unitPriceCents: product.price_cents,
      quantity: currentQuantity,
      imageUrl: product.image_url,
      stock: product.stock,
    });
    const btn = document.getElementById("add-button");
    btn.textContent = "Agregado ✓";
    setTimeout(() => (btn.textContent = "Agregar al carrito"), 1200);
  });
}

async function loadProduct() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const container = document.getElementById("product-detail");
  if (!slug) {
    container.innerHTML = `<p class="error-text">Producto no especificado.</p>`;
    return;
  }

  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    container.innerHTML = `<p class="error-text">No encontramos este producto.</p>`;
    return;
  }

  currentProduct = data;
  renderProduct(data);
}

loadProduct();
