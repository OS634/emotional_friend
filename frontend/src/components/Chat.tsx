import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
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
import ChatSidebar from './ChatSidebar';
import EmotionDetection from './EmotionDetection';
import LoginScreen from './LoginScreen';

// Define interfaces for better type safety
interface Message {
  id: string;
  text: string;
  uid: string;
  photoURL: string | null;
  createdAt: Timestamp;
  isChatbot?: boolean;
}

interface Chat {
  id: string;
  name?: string;
  createdAt: Timestamp;
}

const Chat: React.FC = () => {
  // State with proper typing
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        initializeChats(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const initializeChats = async (userId: string) => {
    try {
      const userChats = await getUserChats(userId);
      setChats(userChats);

      if (userChats.length > 0) {
        setCurrentChatId(userChats[0].id);
        await loadMessages(userId, userChats[0].id);
      }
    } catch (error) {
      console.error('Error initializing chats:', error);
    }
  };

  const loadMessages = async (userId: string, chatId: string) => {
    try {
      const chatMessages = await getChatMessages(userId, chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

// Inside Chat.tsx, update the handleSendMessage function:

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentChatId || !messageText.trim()) {
      return;
    }

    setLoading(true);

    try {
      // Send user message
      await sendMessageToFirebase(
        messageText,
        user.uid,
        currentChatId,
        false,
        user.photoURL
      );

      // Get chatbot response from backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: messageText,
          emotion: 'neutral', // This will be updated when emotion detection is working
          messageHistory: messages.slice(-5).map(msg => ({
            isUser: msg.uid === user.uid,
            text: msg.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chatbot response');
      }

      const data = await response.json();
      
      // Send chatbot response
      const chatbotPhotoURL = '/assets/images/chatbot_image.png';
      await sendMessageToFirebase(
        data.response,
        user.uid,
        currentChatId,
        true,
        chatbotPhotoURL
      );

      // Reset input and reload messages
      setMessageText('');
      await loadMessages(user.uid, currentChatId);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add user feedback for error
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || !currentChatId) return;

    try {
      await deleteMessageFromFirebase(user.uid, currentChatId, messageId);
      await loadMessages(user.uid, currentChatId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleCreateNewChat = async () => {
    if (!user) return;

    try {
      const newChatId = await createNewChat(user.uid);
      const newChat: Chat = {
        id: newChatId,
        name: `Chat ${new Date().toLocaleString()}`,
        createdAt: Timestamp.now()
      };
      setChats([newChat, ...chats]);
      setCurrentChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      await deleteChatSession(user.uid, chatId);
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);

      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
        await loadMessages(user.uid, updatedChats[0].id);
      } else {
        setCurrentChatId('');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newName: string) => {
    if (!user) return;

    try {
      await renameChatSession(user.uid, chatId, newName);
      setChats(chats.map((chat) =>
        chat.id === chatId ? { ...chat, name: newName } : chat
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleSignInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .catch((error) => {
        console.error('Error signing in with Google:', error);
      });
  };

  if (!user) {
    return <LoginScreen onLogin={handleSignInWithGoogle} />;
  }

  return (
    <div className="app-container">
      <ChatSidebar
        userId={user.uid}
        onSelectChat={(chatId) => {
          setCurrentChatId(chatId);
          loadMessages(user.uid, chatId);
        }}
        chats={chats}
        onCreateNewChat={handleCreateNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        currentChatId={currentChatId}
        sidebarVisible={sidebarVisible}
      />
      <div className="chat-container">
        <div className="header">
          <button onClick={toggleSidebar} className="sidebar-toggle-button">
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <span className="username">{user.displayName}</span>
          <div className='emotion-status'>
            Current Emotion: {currentEmotion}
          </div>
          <button onClick={() => auth.signOut()} className="signout-button">
            Sign Out
          </button>
        </div>
        <EmotionDetection onEmotionDetected={setCurrentEmotion} />
        <div className="chat-box">
          {!currentChatId ? (
            <p>No chats available. Click "+ New Chat" to start a conversation.</p>
          ) : messages.length === 0 ? (
            <p>No messages yet. Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <Message
                key={msg.id}
                messageId={msg.id}
                messageText={msg.text}
                photoURL={msg.photoURL}
                isUser={msg.uid === user.uid}
                onDelete={handleDeleteMessage}
              />
            ))
          )}
        </div>
        {currentChatId && (
          <form onSubmit={handleSendMessage} className="input-message-container">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message"
              disabled={loading}
            />
            <input
              type="submit"
              value={loading ? 'Sending...' : 'Send'}
              disabled={loading || !messageText.trim()}
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;