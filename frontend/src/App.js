import React, { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

function App() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async () => {
    setMessages(prev => [...prev, { sender: 'user', text: userInput }]);

    try {
      // Parse the input
      const parts = userInput.toLowerCase().split(' ');
      const action = parts[0];
      const amount = parts[1];
      const tokenSymbol = parts[2];  // This change ensures we get 'eth' instead of 'aave'

      if (action !== 'deposit' && action !== 'withdraw') {
        throw new Error('Invalid action. Use "deposit" or "withdraw".');
      }

      // Get the connected wallet address
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Prepare the request body
      const requestBody = {
        action,
        tokenSymbol: tokenSymbol.toUpperCase(),
        amount,
        userAddress
      };

      // Send request to backend
      const response = await axios.post('http://localhost:5001/api/aave', requestBody);

      if (response.data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.message }]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${error.message}` }]);
    }

    setUserInput('');
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.sender === 'user' ? styles.userMessage : styles.botMessage}>
            <strong>{msg.sender}: </strong>{msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message... (e.g., 'deposit 1 ETH into aave' or 'withdraw 0.5 DAI from aave')"
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'scroll',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    margin: '10px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  },
  inputContainer: {
    display: 'flex',
    padding: '20px',
    borderTop: '1px solid #ccc',
    backgroundColor: '#f1f1f1',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  userMessage: {
    textAlign: 'right',
    backgroundColor: '#d4edda',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    maxWidth: '60%',
    marginLeft: 'auto',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
  },
  botMessage: {
    textAlign: 'left',
    backgroundColor: '#d1ecf1',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    maxWidth: '60%',
    marginRight: 'auto',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
  },
};

export default App;
