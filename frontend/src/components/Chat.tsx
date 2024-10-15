import React, { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup } from '../firebase';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirebase,
  deleteMessage as deleteMessageFromFirebase,
  createNewChat,
  deleteChatSession,
  renameChatSession,
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

  const initializeChats = async (userId: string) => {
    const userChats = await getUserChats(userId);
    setChats(userChats);

    if (userChats.length > 0) {
      setCurrentChatId(userChats[0].id);
      loadMessages(userId, userChats[0].id);
    } else {
      const newChatId = await createNewChat(userId);
      setCurrentChatId(newChatId);
      setChats([
        {
          id: newChatId,
          createdAt: new Date(),
          name: `Chat ${new Date().toLocaleString()}`,
        },
      ]);
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

      await sendMessageToFirebase(
        messageText,
        userId,
        currentChatId,
        false,
        userPhotoURL
      );

      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      // Chatbot's photoURL
      const chatbotPhotoURL = '/assets/images/chatbot_image.png'; // Updated path

      await sendMessageToFirebase(
        botResponse,
        userId,
        currentChatId,
        true,
        chatbotPhotoURL
      );

      setMessageText('');
      loadMessages(userId, currentChatId);
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
      loadMessages(userId, currentChatId);
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

  const handleCreateNewChat = async () => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    const userId = user.uid;

    try {
      const newChatId = await createNewChat(userId);
      const newChat = {
        id: newChatId,
        createdAt: new Date(),
        name: `Chat ${new Date().toLocaleString()}`,
      };
      setChats([newChat, ...chats]);
      setCurrentChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    const userId = user.uid;

    try {
      await deleteChatSession(userId, chatId);
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);

      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
        loadMessages(userId, updatedChats[0].id);
      } else {
        await handleCreateNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newName: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    const userId = user.uid;

    try {
      await renameChatSession(userId, chatId, newName);
      const updatedChats = chats.map((chat) =>
        chat.id === chatId ? { ...chat, name: newName } : chat
      );
      setChats(updatedChats);
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const signOut = () => {
    auth.signOut();
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
      {sidebarVisible && (
        <ChatSidebar
          userId={user.uid}
          onSelectChat={handleSelectChat}
          chats={chats}
          onCreateNewChat={handleCreateNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          currentChatId={currentChatId}
        />
      )}
      <div className={`chat-container ${sidebarVisible ? '' : 'expanded'}`}>
        <div className="header">
          <button onClick={toggleSidebar} className="sidebar-toggle-button">
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <span className="username">{user.displayName}</span>
          <button onClick={signOut} className="signout-button">
            Sign Out
          </button>
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
          <input
            type="submit"
            value={loading ? 'Sending...' : 'Send'}
            disabled={loading}
          />
        </form>
      </div>
    </div>
  );
};

export default Chat;