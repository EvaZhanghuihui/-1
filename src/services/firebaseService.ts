import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QuestionRecord } from '../types';

const COLLECTION_NAME = 'questions';

export const firebaseService = {
  async saveRecord(record: Omit<QuestionRecord, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...record,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getRecords(userId: string): Promise<QuestionRecord[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as QuestionRecord[];
  },

  async deleteRecord(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  async updateRecord(id: string, updates: Partial<QuestionRecord>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  }
};
