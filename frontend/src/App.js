import React, { useState } from 'react';
import { ethers, Contract } from 'ethers';
import axios from 'axios'; // Make sure axios is imported

function App() {
  const [inputAmount, setInputAmount] = useState('');
  const [fromToken, setFromToken] = useState('');  // From token address
  const [toToken, setToToken] = useState('');      // To token address
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: `Swapping ${inputAmount} ${fromToken} to ${toToken}` }
    ]);

    try {
      // Connect to the user's Ethereum wallet (MetaMask or similar)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

      // Ensure token addresses have correct checksums
      const fromTokenChecksum = ethers.getAddress(fromToken);
      const toTokenChecksum = ethers.getAddress(toToken);

      // Approve Uniswap router to spend tokens
      const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
      const tokenContract = new Contract(fromTokenChecksum, erc20Abi, signer);
      const approvalAmount = ethers.parseUnits(inputAmount, 18);
      const approveTx = await tokenContract.approve(uniswapRouterAddress, approvalAmount);
      await approveTx.wait();

      // Build the calldata for the swap function
      const uniswapRouterABI = [
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)"
      ];
      const uniswapContract = new Contract(uniswapRouterAddress, uniswapRouterABI, signer);

      const path = [fromTokenChecksum, toTokenChecksum];
      const amountIn = ethers.parseUnits(inputAmount, 18);
      const amountOutMin = 0;
      const toAddress = await signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      const calldata = uniswapContract.interface.encodeFunctionData(
        'swapExactTokensForTokens',
        [amountIn, amountOutMin, path, toAddress, deadline]
      );

      // Prepare the transaction request to send to the backend
      const transactionRequest = {
        from: toAddress,
        to: uniswapRouterAddress,
        data: calldata,
        value: '0',  // For token-to-token swaps, value is 0
        gasLimit: '300000',  // Adjust as needed
        gasPrice: '1000000000',  // 1 gwei
      };

      // Send the transaction request to the backend for simulation
      const response = await axios.post('http://localhost:5001/api/simulate', { transactionRequest });

      const balanceChanges = response.data.balanceChanges;

      // Format and display the balance changes
      let formattedMessage = "Balance changes:\n";
      balanceChanges.forEach((change) => {
        formattedMessage += `${change.delta} ${change.token_symbol} in ${change.address}\n`;
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: formattedMessage }
      ]);

    } catch (error) {
      console.error('Error processing transaction:', error);
      if (error.response) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: `Error: ${error.response.data.error || 'Server error'}` }
        ]);
      } else if (error.request) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Error: No response received from server' }
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: `Error: ${error.message}` }
        ]);
      }
    }

    setInputAmount('');
    setFromToken('');
    setToToken('');
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
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder="Enter amount..."
          style={styles.input}
        />
        <input
          type="text"
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          placeholder="From Token (ERC-20 address)..."
          style={styles.input}
        />
        <input
          type="text"
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          placeholder="To Token (ERC-20 address)..."
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