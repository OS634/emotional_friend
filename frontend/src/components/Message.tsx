import React from 'react';

interface MessageProps {
  messageId: string;
  messageText: string;
  photoURL: string | null;
  isUser: boolean;
  onDelete: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = ({
  messageId,
  messageText,
  photoURL,
  isUser,
  onDelete,
}) => {
  return (
    <div className={`message-row ${isUser ? 'user' : 'chatbot'}`}>
      {photoURL && (
        <img src={photoURL} alt="Avatar" className="avatar-image" />
      )}
      <div className={`message ${isUser ? 'user-message' : 'chatbot-message'}`}>
        {messageText}
      </div>
      <button onClick={() => onDelete(messageId)} className="delete-button">
        Delete
      </button>
    </div>
  );
};

export default Message;