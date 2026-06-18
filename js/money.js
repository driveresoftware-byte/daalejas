// Todos los montos se guardan como "price_cents": el valor en pesos x 100.
// Coincide exactamente con el formato "amount_in_cents" que exige Wompi.
function formatCOP(cents) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function pesosToCents(pesos) {
  return Math.round(Number(pesos) * 100);
}

function centsToPesos(cents) {
  return cents / 100;
}
