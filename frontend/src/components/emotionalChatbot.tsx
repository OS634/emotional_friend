import React, { useState, useEffect } from 'react';
import {
  getPastChats,
  sendMessage as sendMessageToFirebase,
  clearChatHistory,
  deleteMessage as deleteMessageFromFirebase,
} from './firebaseFunctions';
import Message from './Message';
import ClearChat from './clearChatHistory';
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

  useEffect(() => {
    const fetchMessages = async () => {
      const userMessages = await getPastChats(userId);
      setMessages(userMessages);
    };

    fetchMessages();
  }, [userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userPhotoURL = auth.currentUser?.photoURL || null;

      // Send the user's message
      await sendMessageToFirebase(messageText, userId, false, userPhotoURL);

      // Send the user's message to the chatbot API with emotion
      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      // Chatbot's photoURL
      const chatbotPhotoURL = '/assets/chatbot_image.png'; // Ensure this path is correct and the image exists

      // Save the chatbot's response to Firestore
      await sendMessageToFirebase(botResponse, userId, true, chatbotPhotoURL);

      // Fetch updated messages
      const userMessages = await getPastChats(userId);
      setMessages(userMessages);

      setMessageText(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteMessageFromFirebase(userId, messageId);
      // Fetch updated messages after deletion
      const userMessages = await getPastChats(userId);
      setMessages(userMessages);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory(userId);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <div className="chat-container">
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

      {/* Form for sending a message */}
      <form onSubmit={handleSendMessage} className="input-message-container">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message"
        />
        <input type="submit" value={loading ? 'Sending...' : 'Send'} disabled={loading} />
      </form>

      {/* Button to clear the chat */}
      <ClearChat userId={userId} onClear={handleClearChat} />
    </div>
  );
};

// Function for communicating with the backend chatbot API
export async function chatbot(userInput: string, emotion: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:5000/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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