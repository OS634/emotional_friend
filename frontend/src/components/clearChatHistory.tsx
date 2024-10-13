// clearChatHistory.tsx
import React from 'react';
import { clearChatHistory } from './firebaseFunctions';

interface ClearChatProps {
  userId: string;
  onClear: () => void;
}

const ClearChat: React.FC<ClearChatProps> = ({ userId, onClear }) => {
  const handleClearChat = async () => {
    try {
      await clearChatHistory(userId);
      onClear();
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return <button onClick={handleClearChat}>Clear Chat History</button>;
};

export default ClearChat;