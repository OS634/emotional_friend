import React, { useState, useEffect } from 'react';
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirebase,
  clearChatHistory,
  deleteMessage as deleteMessageFromFirebase,
  createNewChat,
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

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getUserChats(userId);
      setChats(userChats);

      if (userChats.length > 0) {
        // If chats exist, select the first one
        setCurrentChatId(userChats[0].id);
        fetchMessages(userChats[0].id);
      } else {
        // Create a new chat if none exist
        const newChatId = await createNewChat(userId);
        setCurrentChatId(newChatId);
        setChats([{ id: newChatId, createdAt: new Date() }]);
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

      // Send the user's message
      await sendMessageToFirebase(messageText, userId, currentChatId, false, userPhotoURL);

      // Send the user's message to the chatbot API with emotion
      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      // Chatbot's photoURL
      const chatbotPhotoURL = '/assets/chatbot_image.png'; // Ensure this path is correct

      // Save the chatbot's response to Firestore
      await sendMessageToFirebase(botResponse, userId, currentChatId, true, chatbotPhotoURL);

      // Fetch updated messages
      fetchMessages(currentChatId);

      setMessageText(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteMessageFromFirebase(userId, currentChatId, messageId);
      // Fetch updated messages after deletion
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
      setChats([{ id: newChatId, createdAt: new Date() }, ...chats]);
      setCurrentChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className="app-container">
      <ChatSidebar
        userId={userId}
        chats={chats}
        onSelectChat={handleSelectChat}
        onCreateNewChat={handleCreateNewChat}
        currentChatId={currentChatId} 
      />
      <div className="chat-container">
        <div className="chat-header">
          <button onClick={handleClearChat} className="clear-chat-button">
            Clear Chat History
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