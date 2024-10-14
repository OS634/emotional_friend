import React, { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup } from '../firebase';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirebase,
  deleteMessage as deleteMessageFromFirebase,
  createNewChat,
} from './firebaseFunctions';
import Message from './Message';
import { chatbot } from './emotionalChatbot';
import ChatSidebar from './ChatSidebar';

const Chat = () => {
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await initializeChats(user.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const initializeChats = async (userId: string) => {
    // Fetch the user's chat sessions
    const userChats = await getUserChats(userId);
    setChats(userChats);

    if (userChats.length > 0) {
      // If chats exist, select the first one
      setCurrentChatId(userChats[0].id);
      loadMessages(userId, userChats[0].id);
    } else {
      // Create a new chat session if none exist
      const newChatId = await createNewChat(userId);
      setCurrentChatId(newChatId);
      setChats([{ id: newChatId, createdAt: new Date() }]);
    }
  };

  const loadMessages = async (userId: string, chatId: string) => {
    const chatMessages = await getChatMessages(userId, chatId);
    setMessages(chatMessages);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentChatId) {
      console.error('User is not authenticated or chat not initialized');
      return;
    }

    const userId = user.uid;
    setLoading(true);

    try {
      const userPhotoURL = user.photoURL || null;

      // Send the user's message
      await sendMessageToFirebase(messageText, userId, currentChatId, false, userPhotoURL);

      // Send the message to the chatbot API
      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      // Chatbot's photoURL
      const chatbotPhotoURL = '/assets/chatbot_image.png'; // Ensure this image exists

      // Save the chatbot's response
      await sendMessageToFirebase(botResponse, userId, currentChatId, true, chatbotPhotoURL);

      setMessageText(''); // Clear the input
      loadMessages(userId, currentChatId); // Reload messages
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user || !currentChatId) {
      console.error('User is not authenticated or chat not initialized');
      return;
    }

    const userId = user.uid;

    try {
      await deleteMessageFromFirebase(userId, currentChatId, messageId);
      loadMessages(userId, currentChatId); // Reload messages
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    setCurrentChatId(chatId);
    loadMessages(user.uid, chatId);
  };

  const signOut = () => {
    auth.signOut();
  };
  const handleCreateNewChat = async () => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    const userId = user.uid;

    try {
      const newChatId = await createNewChat(userId);
      setChats([{ id: newChatId, createdAt: new Date() }, ...chats]);
      setCurrentChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log('User signed in:', result.user);
      })
      .catch((error) => {
        console.error('Error signing in with Google:', error);
      });
  };

  if (!user) {
    return (
      <div className="login-screen">
        <h2>Welcome to Emotional Friend Chat!</h2>
        <button onClick={signInWithGoogle}>Login with Google</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ChatSidebar
        userId={user.uid}
        onSelectChat={handleSelectChat}
        chats={chats}
        onCreateNewChat={handleCreateNewChat}
        currentChatId={currentChatId}
      />
      <div className="chat-container">
        <div className="header">
          <button onClick={toggleSidebar} className="sidebar-toggle-button">
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <span className="username">{user.displayName}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
        <div className="chat-box">
          {messages.length === 0 ? (
            <p>No messages yet. Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <Message
                key={msg.id}
                messageId={msg.id}
                messageText={msg.text}
                photoURL={msg.photoURL}
                isUser={msg.uid === user.uid}
                onDelete={deleteMessage}
              />
            ))
          )}
        </div>
        <form onSubmit={sendMessage} className="input-message-container">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message"
          />
          <input type="submit" value={loading ? 'Sending...' : 'Send'} disabled={loading} />
        </form>
      </div>
    </div>
  );
};

export default Chat;