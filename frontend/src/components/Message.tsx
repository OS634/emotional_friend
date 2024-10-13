import React from 'react';

export interface MessageProps {
  messageId: string;
  messageText: string;
  photoURL: string | null;
  isUser: boolean;
  onDelete: (messageId: string) => void;
}

export const Message: React.FC<MessageProps> = ({ messageId, messageText, photoURL, isUser, onDelete }) => {
  return (
    <div className={`message-row ${isUser ? 'user' : 'chatbot'}`}>
      {photoURL && <img src={photoURL} alt="Avatar" />}
      <div className={`message ${isUser ? 'user' : 'chatbot'}`}>
        {messageText}
      </div>
      <button onClick={() => onDelete(messageId)}>Delete</button>
    </div>
  );
};

export default Message;