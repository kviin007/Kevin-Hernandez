import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const addPoints = async (
  t: admin.firestore.Transaction,
  userId: string,
  points: number,
  reason: string,
  relatedDocId: string | null = null,
  type: 'earned' | 'redeemed' = 'earned'
) => {
  if (!userId || points <= 0) return;

  const userRef = db.collection('users').doc(userId);
  t.update(userRef, {
    points: admin.firestore.FieldValue.increment(type === 'earned' ? points : -points)
  });

  const logRef = db.collection('points_logs').doc();
  t.set(logRef, {
    userId,
    points,
    type,
    reason,
    relatedDocId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

export const redeemPointsInternal = async (
  t: admin.firestore.Transaction,
  userId: string,
  pointsToRedeem: number,
  reason: string,
  relatedDocId: string | null = null
) => {
  if (!userId || pointsToRedeem < 100) {
    throw new Error('Minimum 100 points required to redeem.');
  }

  const userRef = db.collection('users').doc(userId);
  const userDoc = await t.get(userRef);

  if (!userDoc.exists) {
    throw new Error('User not found.');
  }

  const currentPoints = userDoc.data()?.points || 0;
  if (currentPoints < pointsToRedeem) {
    throw new Error('Insufficient points.');
  }

  const discountCOP = (pointsToRedeem / 100) * 1000;
  addPoints(t, userId, pointsToRedeem, reason, relatedDocId, 'redeemed');

  return discountCOP;
};
