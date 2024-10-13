import React, { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup } from '../firebase';
import { getPastChats, sendMessage as sendMessageToFirebase, deleteMessage as deleteMessageFromFirebase } from './firebaseFunctions';
import { Message } from './Message';
import { chatbot } from './emotionalChatbot';

const Chat = () => {
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadMessages(user.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadMessages = async (userId: string) => {
    const userMessages = await getPastChats(userId);
    setMessages(userMessages);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    const userId = user.uid;
    setLoading(true);

    try {
      // First, send the user's message
      await sendMessageToFirebase(messageText, userId);

      // Send the user's message to the chatbot API with emotion
      const emotion = 'happy'; // Placeholder for emotion detection
      const botResponse = await chatbot(messageText, emotion);

      // Save the chatbot's response to Firestore
      await sendMessageToFirebase(botResponse, userId, true); // Pass true to indicate it's from the chatbot

      setMessageText(''); // Clear the message input
      loadMessages(userId); // Reload messages after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    const userId = user.uid;

    try {
      await deleteMessageFromFirebase(userId, messageId);
      loadMessages(userId); // Reload messages after deletion
    } catch (error) {
      console.error('Error deleting message:', error);
    }
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
    <div className="chat-container">
      <div className="header">
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
  );
};

export default Chat;