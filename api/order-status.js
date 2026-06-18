const { queryOne } = require("../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const reference = req.query.reference;
  if (!reference) {
    return res.status(400).json({ error: "Falta la referencia." });
  }

  try {
    const order = await queryOne("SELECT * FROM orders WHERE reference = $1", [reference]);
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }
    // Solo exponemos lo necesario para la página de confirmación.
    return res.status(200).json({
      order: {
        reference: order.reference,
        status: order.status,
        total_cents: order.total_cents,
      },
    });
  } catch (error) {
    console.error("Error consultando pedido:", error);
    return res.status(500).json({ error: "Error interno." });
  }
};
