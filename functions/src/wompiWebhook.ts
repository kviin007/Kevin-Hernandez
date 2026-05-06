import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { addPoints } from "./pointsService";
import { sendWhatsApp } from "./whatsappService";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Secret from environment or functions config
const WOMPI_WEBHOOK_SECRET = process.env.WOMPI_WEBHOOK_SECRET || functions.config().wompi?.webhook_secret;

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
      const keys = propPath.split(".");
      let val: any = payload.data;
      keys.forEach((key) => {
        if (val) val = val[key];
      });
      concatenatedValues += (val || "");
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
    let notificationData: any = null;
    
    await db.runTransaction(async (t) => {
      const paymentDoc = await t.get(paymentRef);
      if (paymentDoc.exists && paymentDoc.data()?.status === status) {
        return;
      }

      const parsedUserId = reference.split("-")[2];
      const userId = parsedUserId === 'guest' ? null : parsedUserId;
      let relatedDocInfo: { type: string, id: string | null } = { type: 'unknown', id: null };

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
         
         // Fetch booking details for WhatsApp notification if APPROVED
         if (status === "APPROVED") {
            const bookingDoc = bookingsSnap.docs[0];
            const bookingData = bookingDoc.data();
            let userName = "Cliente";
            let userPhone = "";
            let serviceName = "tu servicio";

            if (userId) {
               const userRef = db.collection("users").doc(userId);
               const userDoc = await t.get(userRef);
               if (userDoc.exists) {
                   userName = userDoc.data()?.displayName || userDoc.data()?.name || "Cliente";
                   userPhone = userDoc.data()?.phone || "";
               }
            } else if (bookingData.phone) {
               userPhone = bookingData.phone;
               userName = bookingData.name || "Cliente";
            }

            if (bookingData.serviceId) {
               const serviceRef = db.collection("services").doc(bookingData.serviceId);
               const serviceDoc = await t.get(serviceRef);
               if (serviceDoc.exists) {
                   serviceName = serviceDoc.data()?.name || "Servicio YuliedPlay";
               }
            }

            if (userPhone) {
               notificationData = {
                  phone: userPhone,
                  name: userName,
                  date: bookingData.date, // string format normally
                  time: bookingData.time,
                  serviceName: serviceName
               };
            }
         }
      }

      // Record transaction
      t.set(paymentRef, {
        userId: userId || null,
        transactionId: txId,
        reference: reference,
        amount: amount,
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
              const amountCOP = amount / 100;
              let pointsEarned = 0;
              let description = "";

              if (colToUpdate === 'orders') {
                pointsEarned = Math.floor(amountCOP / 1000);
                description = `Puntos por compra #${reference}`;
              } else if (colToUpdate === 'bookings') {
                pointsEarned = 10 + Math.floor(amountCOP / 1000);
                description = `Puntos por cita #${reference}`;
              }

              if (pointsEarned > 0) {
                 await addPoints(t, userId, pointsEarned, description, docIdToUpdate, 'earned');
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

    // Send WhatsApp AFTER transaction completes
    if (notificationData) {
       try {
           const [year, month, day] = notificationData.date.split("-").map(Number);
           const dateObj = new Date(year, month - 1, day);
           const formattedDate = new Intl.DateTimeFormat('es-CO', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              timeZone: 'America/Bogota' 
           }).format(dateObj);

           const message = `Hola ${notificationData.name} 💅 Tu cita en YuliedPlay está confirmada.
📅 Fecha: ${formattedDate}
⏰ Hora: ${notificationData.time}
💆 Servicio: ${notificationData.serviceName}
📍 Dirección: Instalaciones YuliedPlay
¿Necesitas cancelar o cambiar tu cita? Escríbenos aquí.`;

           await sendWhatsApp(notificationData.phone, message);
       } catch (error) {
           console.error("Error formatting date or sending WhatsApp:", error);
       }
    }

    res.status(200).send("Webhook Processed");
  } else {
    res.status(200).send("Ignored Event");
  }
});
