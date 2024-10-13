import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendMessage } from './firebaseFunctions';

const SendMessages = () => {
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const userId = auth.currentUser.uid;

    try {
      await sendMessage(messageText, userId);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <form onSubmit={handleSendMessage}>
      <input
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Type your message"
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default SendMessages;