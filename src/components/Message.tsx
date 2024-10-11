// src/components/Message.tsx

import React, { useState, useEffect } from 'react';
import { db, auth, provider, signInWithPopup } from '../firebase'; // Import Firebase
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore'; // Import Firestore functions
import chatbot from './emotionalChatbot';

const Message = () => {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                loadMessages();
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const loadMessages = async () => {
        // Reference to the 'messages' collection
        const messagesCollection = collection(db, 'messages');
        const messagesQuery = query(messagesCollection, orderBy('createdAt'));

        // Fetch the messages
        const messagesSnapshot = await getDocs(messagesQuery);
        setMessages(messagesSnapshot.docs.map((doc) => doc.data()));
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            console.error('User is not authenticated');
            return;
        }

        const { uid, photoURL } = user;

        // Save the user's message to the 'messages' collection
        await addDoc(collection(db, 'messages'), {
            text: message,
            uid,
            photoURL,
            createdAt: new Date(),
        });

        // Send the user's message to the chatbot
        const emotion = "happy";  // Placeholder for emotion detection
        const botResponse = await chatbot(message, emotion);

        // Save the chatbot's response
        await addDoc(collection(db, 'messages'), {
            text: botResponse,
            uid: 'chatbot',
            photoURL: '../assets/images/chatbot_image.png',
            createdAt: new Date(),
        });

        setMessage('');
        loadMessages();
    };

    const signOut = () => {
        auth.signOut();
    };

    const signInWithGoogle = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("User signed in:", result.user);
            })
            .catch((error) => {
                console.error("Error signing in with Google:", error);
            });
    };

    if (!user) {
        return (
            <div className="login-screen">
                <h2>Welcome to Emotional Friend Chat!</h2>
                <button onClick={signInWithGoogle}>
                    Login with Google
                </button>
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
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message-row ${msg.uid === user.uid ? 'user' : 'chatbot'}`}
                    >
                        {msg.photoURL && <img src={msg.photoURL} alt="Avatar" />}
                        <div className={`message ${msg.uid === user.uid ? 'user' : 'chatbot'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="input-message-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <input type="submit" value="Send" />
            </form>
        </div>
    );
};

export default Message;