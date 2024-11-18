import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  emotion?: string;
}

interface EmotionalChatbotProps {
  userId: string;
}

const EmotionalChatbot: React.FC<EmotionalChatbotProps> = ({ userId }) => {
  // State management
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [cameraError, setCameraError] = useState<string>('');
  const [isEmotionDetecting, setIsEmotionDetecting] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const emotionDetectionInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera and emotion detection
  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
      if (emotionDetectionInterval.current) {
        clearInterval(emotionDetectionInterval.current);
      }
    };
  }, []);

  // Initialize chats
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
        setChats([
          {
            id: newChatId,
            createdAt: new Date(),
            name: `Chat ${new Date().toLocaleString()}`,
          },
        ]);
      }
    };

    fetchChats();
  }, [userId]);

  // Camera initialization
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start periodic emotion detection
      startEmotionDetection();
      setCameraError('');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Emotion detection
  const startEmotionDetection = () => {
    emotionDetectionInterval.current = setInterval(async () => {
      await detectEmotion();
    }, 5000); // Detect emotion every 5 seconds
  };

  const detectEmotion = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth || isEmotionDetecting) {
      return;
    }

    setIsEmotionDetecting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Capture current frame
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8)
      );

      // Create form data
      const formData = new FormData();
      formData.append('image', blob);

      // Send to backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-emotion`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to detect emotion');
      }

      const data = await response.json();
      setCurrentEmotion(data.emotion);

    } catch (error) {
      console.error('Error in emotion detection:', error);
      // Don't update the emotion state on error to keep the last valid emotion
    } finally {
      setIsEmotionDetecting(false);
    }
  };

  // Message handling
  const fetchMessages = async (chatId: string) => {
    const chatMessages = await getChatMessages(userId, chatId);
    setMessages(chatMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !currentChatId) return;
    
    setLoading(true);

    try {
      const userPhotoURL = auth.currentUser?.photoURL || null;

      // First, add user's message
      await sendMessageToFirebase(
        messageText,
        userId,
        currentChatId,
        false,
        userPhotoURL
      );

      // Get chatbot response with emotion context
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: messageText,
          emotion: currentEmotion,
          messageHistory: messages.slice(-5)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chatbot response');
      }

      const data = await response.json();
      
      // Add chatbot's response
      const chatbotPhotoURL = '/assets/images/chatbot_image.png';
      await sendMessageToFirebase(
        data.response,
        userId,
        currentChatId,
        true,
        chatbotPhotoURL
      );

      // Refresh messages
      await fetchMessages(currentChatId);
      setMessageText('');
    } catch (error) {
      console.error('Error in chat interaction:', error);
      // Show error to user (you could add a toast notification here)
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageFromFirebase(userId, currentChatId, messageId);
      await fetchMessages(currentChatId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Chat management
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
      <ChatSidebar
        userId={userId}
        chats={chats}
        onSelectChat={handleSelectChat}
        onCreateNewChat={handleCreateNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        currentChatId={currentChatId}
        sidebarVisible={sidebarVisible}
      />
      <div className={`chat-container ${!sidebarVisible ? 'expanded' : ''}`}>
        <div className="header">
          <button onClick={toggleSidebar} className="sidebar-toggle-button">
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <span className="username">{auth.currentUser?.displayName}</span>
          <div className="emotion-status">
            Current Emotion: {currentEmotion}
          </div>
        </div>

        <div className="video-container">
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="emotion-detection-video"
            />
          )}
        </div>

        <div className="chat-box">
          {messages.length === 0 ? (
            <p className="no-messages">
              No messages yet. Start a conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <Message
                key={msg.id}
                messageId={msg.id}
                messageText={msg.text}
                photoURL={msg.photoURL}
                isUser={!msg.isChatbot}
                onDelete={handleDeleteMessage}
              />
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="input-message-container">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="message-input"
          />
          <button
            type="submit"
            disabled={loading || !messageText.trim()}
            className="send-button"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmotionalChatbot;