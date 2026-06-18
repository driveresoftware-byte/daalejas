const crypto = require("crypto");

// Orden exacto exigido por Wompi: referencia + monto_en_centavos + moneda + secreto.
// https://docs.wompi.co/docs/colombia/widget-checkout-web/
function buildIntegritySignature({ reference, amountInCents, currency }) {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("Falta WOMPI_INTEGRITY_SECRET.");
  const raw = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

// Verifica el checksum que Wompi envía en cada webhook.
// https://docs.wompi.co/docs/colombia/eventos/
function verifyEventChecksum(event) {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) throw new Error("Falta WOMPI_EVENTS_SECRET.");
  const concatenatedValues = event.signature.properties
    .map((path) => getByPath(event.data, path))
    .join("");
  const raw = `${concatenatedValues}${event.timestamp}${secret}`;
  const expected = crypto.createHash("sha256").update(raw).digest("hex");
  return expected === event.signature.checksum;
}

function generateOrderReference() {
  return `TIENDA-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

module.exports = { buildIntegritySignature, verifyEventChecksum, generateOrderReference };
