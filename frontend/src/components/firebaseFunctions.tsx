import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { format } from 'date-fns';

interface MessageType {
  id: string;
  text: string;
  uid: string;
  photoURL: string | null;
  createdAt: Timestamp;
  isChatbot?: boolean;
}

interface ChatType {
  id: string;
  name?: string;
  createdAt: Timestamp;
}

// Function to get a list of user's chat sessions
export const getUserChats = async (userId: string): Promise<ChatType[]> => {
  try {
    const chatsCollection = collection(db, `users/${userId}/chats`);
    const chatsQuery = query(chatsCollection, orderBy('createdAt', 'desc'));

    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(chatsQuery);
    const chats: ChatType[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        createdAt: data.createdAt || Timestamp.now(),
      };
    });

    return chats;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
};

// Function to create a new chat session
export const createNewChat = async (userId: string): Promise<string> => {
  try {
    const chatsCollection = collection(db, `users/${userId}/chats`);
    const now = new Date();
    const formattedDate = format(now, 'dd/MM/yyyy HH:mm');
    const chatName = `Chat ${formattedDate}`;

    const chatDoc = await addDoc(chatsCollection, {
      name: chatName,
      createdAt: Timestamp.now(),
    });
    return chatDoc.id;
  } catch (error) {
    console.error('Error creating new chat:', error);
    throw error;
  }
};

// Function to get messages from a specific chat session
export const getChatMessages = async (
  userId: string,
  chatId: string
): Promise<MessageType[]> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const messagesQuery = query(messagesCollection, orderBy('createdAt'));

    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(messagesQuery);
    const messages: MessageType[] = querySnapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          uid: data.uid || '',
          photoURL: data.photoURL || null,
          createdAt: data.createdAt || Timestamp.now(),
          isChatbot: data.isChatbot || false,
        };
      }
    );

    return messages;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

// Function to send a message in a chat session
export const sendMessage = async (
  text: string,
  userId: string,
  chatId: string,
  isChatbot: boolean = false,
  photoURL: string | null = null
): Promise<void> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/chats/${chatId}/messages`);
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

// Function to delete a single message in a chat session
export const deleteMessage = async (
  userId: string,
  chatId: string,
  messageId: string
): Promise<void> => {
  try {
    const messageDocRef = doc(db, `users/${userId}/chats/${chatId}/messages`, messageId);
    await deleteDoc(messageDocRef);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
};

// Function to clear chat history for a chat session
export const clearChatHistory = async (userId: string, chatId: string): Promise<void> => {
  try {
    const messagesCollection = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const messagesQuery = query(messagesCollection);

    const querySnapshot = await getDocs(messagesQuery);

    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};

// Function to delete an entire chat session
export const deleteChatSession = async (userId: string, chatId: string): Promise<void> => {
  try {
    // First delete all messages in the chat
    await clearChatHistory(userId, chatId);

    // Then delete the chat document itself
    const chatDocRef = doc(db, `users/${userId}/chats`, chatId);
    await deleteDoc(chatDocRef);
  } catch (error) {
    console.error('Error deleting chat session:', error);
  }
};