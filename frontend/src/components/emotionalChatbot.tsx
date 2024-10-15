import React, { useState, useEffect } from 'react';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirebase,
  clearChatHistory,
  deleteMessage as deleteMessageFromFirebase,
  createNewChat,
  deleteChatSession,
  renameChatSession,
} from './firebaseFunctions';
import Message from './Message';
import ChatSidebar from './ChatSidebar';
import { auth } from '../firebase';

interface MessageType {
  id: string;
  text: string;
  uid: string;
  photoURL: string | null;
  createdAt: any;
  isChatbot?: boolean;
}

interface EmotionalChatbotProps {
  userId: string;
}

const EmotionalChatbot: React.FC<EmotionalChatbotProps> = ({ userId }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getUserChats(userId);
      setChats(userChats);

      if (userChats.length > 0) {
        setCurrentChatId(userChats[0].id);
        fetchMessages(userChats[0].id);
      } else {
        const newChatId = await createNewChat(userId);
        setCurrentChatId(newChatId);
        setChats([{ id: newChatId, createdAt: new Date(), name: `Chat ${new Date().toLocaleString()}` }]);
      }
    };

    fetchChats();
  }, [userId]);

  const fetchMessages = async (chatId: string) => {
    const chatMessages = await getChatMessages(userId, chatId);
    setMessages(chatMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userPhotoURL = auth.currentUser?.photoURL || null;

      await sendMessageToFirebase(messageText, userId, currentChatId, false, userPhotoURL);

      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      const chatbotPhotoURL = '../assets/images/chatbot_image.png';

      await sendMessageToFirebase(botResponse, userId, currentChatId, true, chatbotPhotoURL);

      fetchMessages(currentChatId);

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteMessageFromFirebase(userId, currentChatId, messageId);
      fetchMessages(currentChatId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory(userId, currentChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    fetchMessages(chatId);
  };

  const handleCreateNewChat = async () => {
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
    try {
      await deleteChatSession(userId, chatId);
      const updatedChats = chats.filter((chat) => chat.id !== chatId);
      setChats(updatedChats);

      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
        fetchMessages(updatedChats[0].id);
      } else {
        await handleCreateNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newName: string) => {
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

  return (
    <div className="app-container">
      {sidebarVisible && (
        <ChatSidebar
          userId={userId}
          chats={chats}
          onSelectChat={handleSelectChat}
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
          <span className="username">{auth.currentUser?.displayName}</span>
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
                isUser={msg.uid === userId}
                onDelete={deleteMessage}
              />
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage} className="input-message-container">
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

// Function for communicating with the backend chatbot API
export async function chatbot(userInput: string, emotion: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:5001/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, emotion }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'No response from chatbot.';
  } catch (error: any) {
    console.error('Error with chatbot:', error);
    return `Error: ${error.message}`;
  }
}

export default EmotionalChatbot;