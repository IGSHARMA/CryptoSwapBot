import React, { useState } from 'react';
import axios from 'axios';
import { Contract } from 'ethers';  // Also import Contract to use for contract creation

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async () => {
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: input }]);

    try {
      let response;

      const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';  // Uniswap Router address

      const uniswapRouterABI = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)"
      ];

      const uniswapContract = new Contract(uniswapRouterAddress, uniswapRouterABI);

      const amountOutMin = 0;  // Use parseUnits to convert the amount
      const path = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48']; // Example token addresses (ETH -> USDC)
      const to = '0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e';  // Example user wallet address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;  // 20-minute deadline

      const calldata = await uniswapContract.interface.encodeFunctionData(
        'swapExactETHForTokens',
        [amountOutMin, path, to, deadline]
      );

      const transactionRequest = {
        from: '0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e',  // Sender address
        to: uniswapRouterAddress,
        data: calldata,
        value: '100000000000000000',  // Amount in wei (1 ETH in wei)
        gasLimit: '30000',  // Example gas limit
        gasPrice: '1000000000',  // Example gas price
      };

      const chainId = 1;  // Example chain ID for Ethereum mainnet

      response = await axios.post('http://localhost:5001/api/simulate', { transactionRequest, chainId });

      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: response.data.result }]);
    } catch (error) {
      console.error('Error processing transaction:', error);
      if (error.response) {
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: `Error: ${error.response.data.error || 'Server error'}` }]);
      } else if (error.request) {
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: 'Error: No response received from server' }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: `Error: ${error.message}` }]);
      }
    }

    setInput('');
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div key={index} style={message.sender === 'user' ? styles.userMessage : styles.botMessage}>
            <strong>{message.sender === 'user' ? 'You: ' : 'Bot: '}</strong>{message.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}

// Styles for the chat container, messages, and input area
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
