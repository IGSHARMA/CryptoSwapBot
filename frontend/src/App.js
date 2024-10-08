import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user input as a message in the chat
    setMessages((prevMessages) => [...prevMessages, { from: 'user', text: input }]);

    try {
      let response;

      // Check if it's a bridge request
      if (input.startsWith('bridge')) {
        response = await axios.post('http://localhost:5001/api/bridge', {
          name: 'bridge',
          args: {
            inputAmount: input.split(' ')[1],   // extract amount from user input (e.g., "1")
            inputToken: input.split(' ')[2],    // extract input token (e.g., "eth")
            fromChain: input.split(' ')[4],     // extract fromChain (e.g., "ETH")
            toChain: input.split(' ')[6]        // extract toChain (e.g., "ARB")
          }
        });
      } else if (input.startsWith('swap')) {
        // Handle swap request
        response = await axios.post('http://localhost:5001/api/swap', {
          name: 'swap',
          args: {
            inputAmount: input.split(' ')[1],  // extract amount from user input (e.g., "1")
            inputToken: input.split(' ')[2],   // extract input token (e.g., "eth")
            outputToken: input.split(' ')[4]   // extract output token (e.g., "usdc")
          }
        });
      }

      // Extract transactionRequest from LI.FI response
      const transactionRequest = response.data.transactionRequest;

      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'bot', text: `Transaction Request: ${JSON.stringify(transactionRequest, null, 2)}` }
      ]);
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'bot', text: 'Error fetching transaction details.' }
      ]);
    }

    // Clear the input field
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.from === 'user' ? styles.userMessage : styles.botMessage}>
            <strong>{msg.from === 'user' ? 'You: ' : 'Bot: '}</strong>{msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          style={styles.input}
          placeholder="Type your swap request (e.g., swap 1 eth for usdc)..."
        />
        <button onClick={sendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
};

// Some basic inline styles
const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    justifyContent: 'space-between',
  },
  messagesContainer: {
    flex: 1,
    padding: '10px',
    overflowY: 'scroll',
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #ccc',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '16px',
    marginLeft: '10px',
  },
  userMessage: {
    textAlign: 'right',
    backgroundColor: '#d4edda',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  botMessage: {
    textAlign: 'left',
    backgroundColor: '#d1ecf1',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
};

export default App;

//swap 1 eth for usdc