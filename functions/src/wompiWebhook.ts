import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Secret from environment or functions config
const WOMPI_WEBHOOK_SECRET = process.env.WOMPI_WEBHOOK_SECRET || functions.config().wompi.webhook_secret;

export const wompiWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const payload = req.body;
  const event = payload.event;
  const signatureData = payload.signature;
  const timestamp = payload.timestamp;

  if (!signatureData || !event || !payload.data || !payload.data.transaction) {
    res.status(400).send("Invalid Payload");
    return;
  }

  // Verify Checksum
  if (WOMPI_WEBHOOK_SECRET) {
    const { properties, checksum } = signatureData;
    let concatenatedValues = "";

    properties.forEach((propPath: string) => {
      // propPath format: "transaction.id"
      const keys = propPath.split(".");
      let val: any = payload.data;
      keys.forEach((key) => {
        val = val[key];
      });
      concatenatedValues += val;
    });

    concatenatedValues += timestamp;
    concatenatedValues += WOMPI_WEBHOOK_SECRET;

    const generatedChecksum = crypto.createHash("sha256").update(concatenatedValues).digest("hex");

    if (generatedChecksum !== checksum) {
      console.error("Invalid checksum");
      res.status(401).send("Unauthorized Webhook");
      return;
    }
  }

  // Payload is valid
  const transaction = payload.data.transaction;
  const txId = transaction.id;
  const status = transaction.status; // APPROVED, DECLINED, VOIDED, PENDING
  const reference = transaction.reference; // e.g., YP-1234567890-abcdef
  const amount = transaction.amount_in_cents;
  const paymentMethod = transaction.payment_method?.type || "UNKNOWN";
  const customerEmail = transaction.customer_email;

  if (event === "transaction.updated") {
    const paymentRef = db.collection("payments").doc(txId);
    
    await db.runTransaction(async (t) => {
      const paymentDoc = await t.get(paymentRef);
      if (paymentDoc.exists && paymentDoc.data()?.status === status) {
        // Idempotency: Already processed this exact status
        return;
      }

      const parsedUserId = reference.split("-")[2]; // Assuming YP-timestamp-userId
      const userId = parsedUserId === 'guest' ? null : parsedUserId;
      let relatedDocInfo: { type: string, id: string | null } = { type: 'unknown', id: null };

      // Try to find if the booking exists
      let colToUpdate = "";
      let docIdToUpdate = "";
      
      const ordersSnap = await db.collection("orders").where("paymentReference", "==", reference).get();
      const bookingsSnap = await db.collection("bookings").where("paymentReference", "==", reference).get();

      if (!ordersSnap.empty) {
         colToUpdate = "orders";
         docIdToUpdate = ordersSnap.docs[0].id;
         relatedDocInfo = { type: 'order', id: docIdToUpdate };
      } else if (!bookingsSnap.empty) {
         colToUpdate = "bookings";
         docIdToUpdate = bookingsSnap.docs[0].id;
         relatedDocInfo = { type: 'booking', id: docIdToUpdate };
      }

      // Record transaction
      t.set(paymentRef, {
        userId: userId || null,
        transactionId: txId,
        reference: reference,
        amount: amount, // in cents
        status: status,
        method: paymentMethod,
        customerEmail: customerEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        relatedDoc: relatedDocInfo
      }, { merge: true });

      // Update related collection
      if (colToUpdate && docIdToUpdate) {
        if (status === "APPROVED") {
           t.update(db.collection(colToUpdate).doc(docIdToUpdate), {
             status: colToUpdate === 'orders' ? 'pagada' : 'confirmada',
             paymentId: txId
           });

           // Sum points
           if (userId) {
              const pointsEarned = Math.floor((amount / 100) * 0.05); // 5% of COP amount
              if (pointsEarned > 0) {
                 t.update(db.collection("users").doc(userId), {
                    points: admin.firestore.FieldValue.increment(pointsEarned)
                 });
                 // Log points
                 t.set(db.collection("points_logs").doc(), {
                    userId,
                    amount: pointsEarned,
                    type: "earn",
                    description: `Puntos por pago de ${colToUpdate === 'orders' ? 'pedido' : 'cita'} ${reference}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                 });
              }
           }
        } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
           t.update(db.collection(colToUpdate).doc(docIdToUpdate), {
             status: 'pago_fallido',
             paymentId: txId
           });
        }
      }
    });

    res.status(200).send("Webhook Processed");
  } else {
    res.status(200).send("Ignored Event");
  }
});
