import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

interface MessageType {
  id: string;
  text: string;
  uid: string;
  photoURL: string | null;
  createdAt: Timestamp;
  isChatbot?: boolean;
}

// Function to get past chats for a specific user
export const getPastChats = async (userId: string): Promise<MessageType[]> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/messages`);
    const messagesQuery = query(messagesCollection, orderBy('createdAt'));

    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(messagesQuery);
    const messages: MessageType[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text || '',
        uid: data.uid || '',
        photoURL: data.photoURL || null,
        createdAt: data.createdAt || Timestamp.now(),
        isChatbot: data.isChatbot || false,
      };
    });

    return messages;
  } catch (error) {
    console.error('Error fetching past chats:', error);
    return [];
  }
};

// Function to send a message
export const sendMessage = async (
  text: string,
  userId: string,
  isChatbot: boolean = false,
  photoURL: string | null = null
): Promise<void> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/messages`);
    await addDoc(messagesCollection, {
      text,
      uid: isChatbot ? 'chatbot' : userId,
      photoURL,
      createdAt: Timestamp.now(),
      isChatbot,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};


// Function to delete a single message
export const deleteMessage = async (userId: string, messageId: string): Promise<void> => {
  try {
    const messageDocRef = doc(db, `users/${userId}/messages`, messageId);
    await deleteDoc(messageDocRef);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
};

// Function to clear chat history for a user
export const clearChatHistory = async (userId: string): Promise<void> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/messages`);
    const messagesQuery = query(messagesCollection);

    const querySnapshot = await getDocs(messagesQuery);

    const batch = writeBatch(db); // Use writeBatch instead of db.batch()

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};