import React, { useState } from 'react';

interface ChatSidebarProps {
  userId: string;
  chats: any[];
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newName: string) => void;
  currentChatId: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  userId,
  chats,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  onRenameChat,
  currentChatId,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState<string>('');

  const handleRename = (chatId: string, name: string) => {
    setEditingChatId(chatId);
    setNewChatName(name);
  };

  const handleRenameSubmit = (chatId: string) => {
    onRenameChat(chatId, newChatName);
    setEditingChatId(null);
    setNewChatName('');
  };

  return (
    <div className="chat-sidebar">
      <h3>Your Chats</h3>
      <button onClick={onCreateNewChat}>+ New Chat</button>
      <ul>
        {chats.map((chat) => (
          <li
            key={chat.id}
            className={`chat-list-item ${chat.id === currentChatId ? 'active' : ''}`}
          >
            <div onClick={() => onSelectChat(chat.id)} className="chat-name">
              {editingChatId === chat.id ? (
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  onBlur={() => handleRenameSubmit(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSubmit(chat.id);
                    }
                  }}
                  autoFocus
                />
              ) : (
                chat.name
              )}
            </div>
            <div className="chat-actions">
              <button onClick={() => handleRename(chat.id, chat.name)}>Rename</button>
              <button onClick={() => onDeleteChat(chat.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatSidebar;