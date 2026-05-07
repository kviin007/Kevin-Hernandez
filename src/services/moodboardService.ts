import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { NailDesign } from './geminiNailService';

export interface MoodboardItem extends NailDesign {
  id?: string;
  savedAt: any;
  type: string;
}

export const saveMoodboardItem = async (userId: string, design: NailDesign): Promise<string> => {
  try {
    const parentRef = collection(db, 'moodboards');
    // Empezamos guardando dentro de la subcollection del usuario
    const itemsRef = collection(db, `moodboards/${userId}/items`);
    
    const docRef = await addDoc(itemsRef, {
      ...design,
      savedAt: serverTimestamp(),
      type: 'ai_generated'
    });
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `moodboards/${userId}/items`);
    throw error;
  }
};

export const getAIGeneratedHistory = async (userId: string): Promise<MoodboardItem[]> => {
  try {
    const itemsRef = collection(db, `moodboards/${userId}/items`);
    const q = query(
      itemsRef,
      where('type', '==', 'ai_generated'),
      orderBy('savedAt', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MoodboardItem[];
  } catch (error) {
    console.error("Error fetching moodboard history:", error);
    return [];
  }
};
