const { getPool } = require("../lib/db");
const { verifyEventChecksum } = require("../lib/wompi");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const event = req.body;
  if (!event || event.event !== "transaction.updated" || !event.data?.transaction) {
    // Respondemos 200 a eventos que no nos interesan, para que Wompi no reintente innecesariamente.
    return res.status(200).json({ ok: true, ignored: true });
  }

  let checksumOk = false;
  try {
    checksumOk = verifyEventChecksum(event);
  } catch (error) {
    console.error("No se pudo verificar el checksum del webhook de Wompi:", error);
  }
  if (!checksumOk) {
    return res.status(401).json({ error: "Checksum inválido." });
  }

  const transaction = event.data.transaction;
  const reference = transaction.reference;
  const wompiStatus = transaction.status; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  const transactionId = transaction.id;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query("SELECT * FROM orders WHERE reference = $1 FOR UPDATE", [reference]);
    const order = rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return res.status(200).json({ ok: true, warning: "Pedido no encontrado." });
    }

    // Idempotencia: si ya estaba pagado, no lo procesamos otra vez (ni descontamos stock dos veces).
    if (order.status === "paid") {
      await client.query("ROLLBACK");
      return res.status(200).json({ ok: true, alreadyProcessed: true });
    }

    if (wompiStatus === "APPROVED") {
      await client.query(
        "UPDATE orders SET status = 'paid', wompi_transaction_id = $1, updated_at = now() WHERE id = $2",
        [transactionId, order.id]
      );

      const { rows: orderItems } = await client.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [order.id]
      );
      for (const item of orderItems) {
        if (item.product_id) {
          await client.query("UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2", [
            item.quantity,
            item.product_id,
          ]);
        }
      }

      if (order.promotion_code) {
        await client.query("UPDATE promotions SET used_count = used_count + 1 WHERE code = $1", [
          order.promotion_code,
        ]);
      }
    } else if (["DECLINED", "VOIDED", "ERROR"].includes(wompiStatus)) {
      await client.query(
        "UPDATE orders SET status = 'failed', wompi_transaction_id = $1, updated_at = now() WHERE id = $2",
        [transactionId, order.id]
      );
    }
    // Si el estado es PENDING no hacemos nada todavía; esperamos el próximo evento.

    await client.query("COMMIT");
    return res.status(200).json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error procesando webhook de Wompi:", error);
    return res.status(500).json({ error: "Error interno." });
  } finally {
    client.release();
  }
};
