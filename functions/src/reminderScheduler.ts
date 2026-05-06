import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendWhatsApp } from "./whatsappService";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Runs every day at 9:00 AM America/Bogota
export const reminderScheduler = functions.pubsub.schedule("0 9 * * *")
  .timeZone("America/Bogota")
  .onRun(async (context) => {
    try {
      // Get tomorrow's date adjusted to Bogota time
      const tomorrow = new Date();
      // Add 24 hours
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format as YYYY-MM-DD
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const day = String(tomorrow.getDate()).padStart(2, "0");
      const tomorrowString = `${year}-${month}-${day}`;

      console.log(`Checking for bookings on ${tomorrowString} to send reminders...`);

      const bookingsSnap = await db.collection("bookings")
        .where("date", "==", tomorrowString)
        .where("status", "==", "confirmada")
        .where("reminderSent", "!=", true)
        .get();

      if (bookingsSnap.empty) {
        console.log("No bookings found for tomorrow that need reminders.");
        return null;
      }

      console.log(`Found ${bookingsSnap.size} bookings for reminders.`);

      for (const doc of bookingsSnap.docs) {
        const bookingData = doc.data();
        const bookingId = doc.id;
        
        // Skip if reminder was already sent (Firestore != works but doesn't include missing fields sometimes)
        // so double checking here just in case.
        if (bookingData.reminderSent === true) {
            continue;
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

        if (userPhone) {
          const message = `¡Hola ${userName}! Te recordamos que mañana tienes cita con nosotras en YuliedPlay 💅
⏰ ${bookingData.time} — ${serviceName}
¡Te esperamos con todo el amor! 🌸`;

          const sent = await sendWhatsApp(userPhone, message);
          
          if (sent) {
            await db.collection("bookings").doc(bookingId).update({
              reminderSent: true
            });
            console.log(`Reminder marked as sent for booking ${bookingId}`);
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error in reminderScheduler:", error);
      return null;
    }
});
