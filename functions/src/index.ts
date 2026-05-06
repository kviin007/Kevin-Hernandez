export { wompiWebhook } from "./wompiWebhook";
export { reminderScheduler } from "./reminderScheduler";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { redeemPointsInternal } from "./pointsService";
import { sendWhatsApp } from "./whatsappService";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const redeemPoints = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  const userId = context.auth.uid;
  const { pointsToRedeem, orderId } = data;

  if (typeof pointsToRedeem !== "number" || pointsToRedeem < 100) {
    throw new functions.https.HttpsError("invalid-argument", "At least 100 points required.");
  }

  try {
    const discount = await db.runTransaction(async (t) => {
      return await redeemPointsInternal(t, userId, pointsToRedeem, "Canjeado en compra", orderId);
    });
    return { success: true, discount };
  } catch (error: any) {
    throw new functions.https.HttpsError("failed-precondition", error.message || "Error redeeming points.");
  }
});

export const resendReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in as admin to do this.");
  }

  // Optionally check admin role here
  
  const { bookingId } = data;
  if (!bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "bookingId is required.");
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();
  
  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Booking not found.");
  }

  const bookingData = bookingDoc.data();
  if (bookingData?.status !== "confirmada") {
    throw new functions.https.HttpsError("failed-precondition", "Booking must be confirmed to send a reminder.");
  }

  let userName = bookingData.userName || "Hermosa";
  let userPhone = bookingData.phone || bookingData.userPhone || "";
  let serviceName = "tu servicio";

  if (bookingData.userId && !userPhone) {
    const userDoc = await db.collection("users").doc(bookingData.userId).get();
    if (userDoc.exists) {
       userName = userDoc.data()?.displayName || userDoc.data()?.name || userName;
       userPhone = userDoc.data()?.phone || "";
    }
  }

  if (bookingData.serviceId) {
    const serviceDoc = await db.collection("services").doc(bookingData.serviceId).get();
    if (serviceDoc.exists) {
      serviceName = serviceDoc.data()?.name || serviceName;
    }
  }

  if (!userPhone) {
    throw new functions.https.HttpsError("failed-precondition", "No phone number available for this booking.");
  }

  const message = `¡Hola ${userName}! Te recordamos que tienes cita con nosotras en YuliedPlay 💅
⏰ ${bookingData.time} — ${serviceName}
¡Te esperamos con todo el amor! 🌸`;

  const sent = await sendWhatsApp(userPhone, message);
  if (sent) {
    await bookingRef.update({ reminderSent: true });
    return { success: true };
  } else {
    throw new functions.https.HttpsError("internal", "Failed to send WhatsApp message.");
  }
});

