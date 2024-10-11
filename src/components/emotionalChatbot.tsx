async function chatbot(userInput: string, emotion: string): Promise<string> {
    try {
        const response = await fetch('http://localhost:5000/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput, emotion }),
        });
        const data = await response.json();
        return data.response || "No response from chatbot.";
    } catch (error: any) {
        console.error("Error with chatbot:", error);
        return `Error: ${error.message}`;
    }
}

export default chatbot;