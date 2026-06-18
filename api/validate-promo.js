const { queryOne } = require("../lib/db");
const { evaluatePromotion } = require("../lib/promotions");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const subtotalCents = Number(req.body?.subtotalCents);

  if (!code || !Number.isFinite(subtotalCents) || subtotalCents < 0) {
    return res.status(400).json({ valid: false, reason: "Datos de la solicitud inválidos." });
  }

  try {
    const promotion = await queryOne("SELECT * FROM promotions WHERE code = $1", [code]);
    const result = evaluatePromotion(promotion, subtotalCents);
    if (!result.valid) {
      return res.status(200).json({ valid: false, reason: result.reason });
    }
    return res.status(200).json({ valid: true, discountCents: result.discountCents, code });
  } catch (error) {
    console.error("Error validando promoción:", error);
    return res.status(500).json({ valid: false, reason: "Error interno." });
  }
};
