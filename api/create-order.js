const { getPool, queryOne } = require("../lib/db");
const { evaluatePromotion } = require("../lib/promotions");
const { buildIntegritySignature, generateOrderReference } = require("../lib/wompi");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const body = req.body || {};
  const { customerName, email, phone, address, city, promotionCode, items } = body;

  if (
    !isNonEmptyString(customerName) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(address) ||
    !isNonEmptyString(city)
  ) {
    return res.status(400).json({ error: "Faltan datos de envío." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "El carrito está vacío." });
  }
  for (const item of items) {
    if (!Number.isInteger(item.productId) || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: "Carrito inválido." });
    }
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    // Nunca confiamos en los precios del navegador: los volvemos a leer de la BD.
    const productIds = items.map((i) => i.productId);
    const { rows: products } = await client.query(
      "SELECT * FROM products WHERE id = ANY($1) AND active = true FOR UPDATE",
      [productIds]
    );
    const productsById = new Map(products.map((p) => [p.id, p]));

    const lineItems = [];
    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Uno de los productos ya no está disponible. Actualiza tu carrito." });
      }
      if (product.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `Solo quedan ${product.stock} unidades de "${product.name}".` });
      }
      lineItems.push({ product, quantity: item.quantity });
    }

    const subtotalCents = lineItems.reduce((sum, l) => sum + l.product.price_cents * l.quantity, 0);

    let discountCents = 0;
    let appliedPromotionCode = null;
    if (promotionCode) {
      const promotion = await queryOne("SELECT * FROM promotions WHERE code = $1", [
        String(promotionCode).trim().toUpperCase(),
      ]);
      const result = evaluatePromotion(promotion, subtotalCents);
      if (!result.valid) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: result.reason });
      }
      discountCents = result.discountCents;
      appliedPromotionCode = promotion.code;
    }

    const totalCents = subtotalCents - discountCents;
    const reference = generateOrderReference();

    const orderResult = await client.query(
      `INSERT INTO orders
         (reference, customer_name, email, phone, address, city, subtotal_cents, discount_cents, total_cents, promotion_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING *`,
      [reference, customerName, email, phone, address, city, subtotalCents, discountCents, totalCents, appliedPromotionCode]
    );
    const order = orderResult.rows[0];

    for (const line of lineItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, line.product.id, line.product.name, line.product.price_cents, line.quantity]
      );
    }

    await client.query("COMMIT");

    const signature = buildIntegritySignature({
      reference: order.reference,
      amountInCents: order.total_cents,
      currency: "COP",
    });

    return res.status(201).json({
      reference: order.reference,
      amountInCents: order.total_cents,
      currency: "COP",
      signature,
      publicKey: process.env.WOMPI_PUBLIC_KEY,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando pedido:", error);
    return res.status(500).json({ error: "No se pudo crear el pedido. Intenta de nuevo." });
  } finally {
    client.release();
  }
};
