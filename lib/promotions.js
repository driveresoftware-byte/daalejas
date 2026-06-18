function evaluatePromotion(promotion, subtotalCents) {
  if (!promotion) return { valid: false, reason: "El código no existe." };
  if (!promotion.active) return { valid: false, reason: "Este código ya no está activo." };

  const now = new Date();
  if (promotion.starts_at && now < new Date(promotion.starts_at)) {
    return { valid: false, reason: "Este código todavía no está vigente." };
  }
  if (promotion.ends_at && now > new Date(promotion.ends_at)) {
    return { valid: false, reason: "Este código ya venció." };
  }
  if (promotion.max_uses != null && promotion.used_count >= promotion.max_uses) {
    return { valid: false, reason: "Este código alcanzó su límite de usos." };
  }
  if (subtotalCents < promotion.min_order_cents) {
    return {
      valid: false,
      reason: `El pedido mínimo para este código es ${(promotion.min_order_cents / 100).toLocaleString("es-CO")} COP.`,
    };
  }

  const discountCents =
    promotion.type === "percentage"
      ? Math.round((subtotalCents * promotion.value) / 100)
      : Math.min(promotion.value, subtotalCents);

  return { valid: true, discountCents };
}

module.exports = { evaluatePromotion };
