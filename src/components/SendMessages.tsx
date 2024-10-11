// src/components/SendMessages.tsx

import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';

const SendMessages = () => {
    const [message, setMessage] = useState('');

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth.currentUser) {
            console.error('User is not authenticated');
            return;
        }

        const { uid, photoURL } = auth.currentUser;

        // Add a new message document to the 'messages' collection
        await addDoc(collection(db, 'messages'), {
            text: message,
            uid,
            photoURL,
            createdAt: new Date(),
        });

        setMessage('');
    };

    return (
        <form onSubmit={sendMessage}>
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
            />
            <button type="submit">Send</button>
        </form>
    );
};

export default SendMessages;