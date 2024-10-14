import React from 'react';

interface ChatSidebarProps {
  userId: string;
  chats: any[];
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
  currentChatId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  userId,
  chats,
  onSelectChat,
  onCreateNewChat,
  currentChatId,
}) => {
  return (
    <div className="chat-sidebar">
      <h3>Your Chats</h3>
      <button onClick={onCreateNewChat}>+ New Chat</button>
      <ul>
        {chats.map((chat) => (
          <li
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`chat-list-item ${chat.id === currentChatId ? 'active' : ''}`}
          >
            {chat.name || `Chat ${new Date(chat.createdAt?.seconds * 1000).toLocaleString()}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatSidebar;