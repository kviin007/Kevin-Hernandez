import * as functions from "firebase-functions";
import twilio from "twilio";

// Twilio Sandbox setup for testing:
// 1. Enter to Twilio Console -> Messaging -> Try it out -> Send a WhatsApp message.
// 2. You will get a Sandbox number like "whatsapp:+14155238886" and a code (e.g. "join alarm-flower").
// 3. User must send the join code to that number from their WhatsApp to enable the sandbox.
// 4. Then we can send messages to them.
// Add the credentials in .env inside the functions folder, or use Firebase secrets.
// TWILIO_ACCOUNT_SID=your_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

export const sendWhatsApp = async (phone: string, message: string): Promise<boolean> => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio credentials not configured in environment.");
      return false;
    }

    const client = twilio(accountSid, authToken);

    // Format Colombian phone number to E.164
    let formattedPhone = phone.replace(/\D/g, ""); // Remove non-numeric characters
    
    // Valid Colombian number without country code is 10 digits
    if (formattedPhone.length === 10) {
      formattedPhone = `+57${formattedPhone}`;
    } else if (formattedPhone.startsWith("57") && formattedPhone.length === 12) {
      formattedPhone = `+${formattedPhone}`;
    } else {
      console.warn(`Phone number format seems invalid for Colombia: ${phone}`);
      // Send anyway as they might have provided international format
      if (!formattedPhone.startsWith("+")) {
         formattedPhone = `+${formattedPhone}`;
      }
    }

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: `whatsapp:${formattedPhone}`
    });

    console.log(`WhatsApp message sent to ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    // Return false instead of throwing to not break the main checkout flow
    return false;
  }
};
