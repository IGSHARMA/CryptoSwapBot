// // import React, { useState } from 'react';
// // import { ethers, Contract } from 'ethers';
// // import axios from 'axios'; // Make sure axios is imported

// // function App() {
// //   const [inputAmount, setInputAmount] = useState('');
// //   const [fromToken, setFromToken] = useState('');  // From token address
// //   const [toToken, setToToken] = useState('');      // To token address
// //   const [messages, setMessages] = useState([]);

// //   const handleSendMessage = async () => {
// //     setMessages((prevMessages) => [
// //       ...prevMessages,
// //       { sender: 'user', text: `Swapping ${inputAmount} ${fromToken} to ${toToken}` }
// //     ]);

// //     try {
// //       const provider = new ethers.BrowserProvider(window.ethereum);
// //       const signer = await provider.getSigner();
// //       const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// //       const fromTokenChecksum = ethers.getAddress(fromToken);
// //       const toTokenChecksum = ethers.getAddress(toToken);

// //       const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
// //       const tokenContract = new Contract(fromTokenChecksum, erc20Abi, signer);
// //       const approvalAmount = ethers.parseUnits(inputAmount, 18);
// //       const approveTx = await tokenContract.approve(uniswapRouterAddress, approvalAmount);
// //       await approveTx.wait();

// //       const uniswapRouterABI = [
// //         "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)"
// //       ];
// //       const uniswapContract = new Contract(uniswapRouterAddress, uniswapRouterABI, signer);

// //       const path = [fromTokenChecksum, toTokenChecksum];
// //       const amountIn = ethers.parseUnits(inputAmount, 18);
// //       const amountOutMin = 0;
// //       const toAddress = await signer.getAddress();
// //       const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

// //       const calldata = uniswapContract.interface.encodeFunctionData(
// //         'swapExactTokensForTokens',
// //         [amountIn, amountOutMin, path, toAddress, deadline]
// //       );

// //       const transactionRequest = {
// //         from: toAddress,
// //         to: uniswapRouterAddress,
// //         data: calldata,
// //         value: '0',
// //         gasLimit: '300000',
// //         gasPrice: '1000000000',
// //       };

// //       const response = await axios.post('http://localhost:5001/api/simulate', {
// //         transactionRequest,
// //         fromToken: fromTokenChecksum,  // Send dynamic fromToken
// //         toToken: toTokenChecksum       // Send dynamic toToken
// //       });

// //       const balanceChanges = response.data.balanceChanges;

// //       if (balanceChanges && Array.isArray(balanceChanges)) {
// //         let formattedMessage = "Balance changes:\n";
// //         balanceChanges.forEach((change) => {
// //           formattedMessage += `${change.delta} ${change.token_symbol} in ${change.address}\n`;
// //         });

// //         setMessages((prevMessages) => [
// //           ...prevMessages,
// //           { sender: 'bot', text: formattedMessage }
// //         ]);
// //       } else {
// //         throw new Error("Invalid balance changes response");
// //       }

// //     } catch (error) {
// //       console.error('Error processing transaction:', error);
// //       if (error.response) {
// //         setMessages((prevMessages) => [
// //           ...prevMessages,
// //           { sender: 'bot', text: `Error: ${error.response.data.error || 'Server error'}` }
// //         ]);
// //       } else if (error.request) {
// //         setMessages((prevMessages) => [
// //           ...prevMessages,
// //           { sender: 'bot', text: 'Error: No response received from server' }
// //         ]);
// //       } else {
// //         setMessages((prevMessages) => [
// //           ...prevMessages,
// //           { sender: 'bot', text: `Error: ${error.message}` }
// //         ]);
// //       }
// //     }

// //     setInputAmount('');
// //     setFromToken('');
// //     setToToken('');
// //   };


// //   return (
// //     <div style={styles.chatContainer}>
// //       <div style={styles.messagesContainer}>
// //         {messages.map((message, index) => (
// //           <div key={index} style={message.sender === 'user' ? styles.userMessage : styles.botMessage}>
// //             <strong>{message.sender === 'user' ? 'You: ' : 'Bot: '}</strong>{message.text}
// //           </div>
// //         ))}
// //       </div>
// //       <div style={styles.inputContainer}>
// //         <input
// //           type="text"
// //           value={inputAmount}
// //           onChange={(e) => setInputAmount(e.target.value)}
// //           placeholder="Enter amount..."
// //           style={styles.input}
// //         />
// //         <input
// //           type="text"
// //           value={fromToken}
// //           onChange={(e) => setFromToken(e.target.value)}
// //           placeholder="From Token (ERC-20 address)..."
// //           style={styles.input}
// //         />
// //         <input
// //           type="text"
// //           value={toToken}
// //           onChange={(e) => setToToken(e.target.value)}
// //           placeholder="To Token (ERC-20 address)..."
// //           style={styles.input}
// //         />
// //         <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
// //       </div>
// //     </div>
// //   );
// // }
// import React, { useState } from 'react';
// import { ethers, Contract } from 'ethers';
// import axios from 'axios';

// function App() {
//   const [inputAmount, setInputAmount] = useState('');
//   const [fromToken, setFromToken] = useState('');
//   const [toToken, setToToken] = useState('');
//   const [action, setAction] = useState('swap'); // New state for action
//   const [messages, setMessages] = useState([]);

//   const handleSendMessage = async () => {
//     let userMessage = '';
//     if (action === 'swap') {
//       userMessage = `Swapping ${inputAmount} ${fromToken} to ${toToken}`;
//     } else if (action === 'deposit' || action === 'withdraw') {
//       userMessage = `${action === 'deposit' ? 'Depositing' : 'Withdrawing'} ${inputAmount} ${fromToken} ${action === 'deposit' ? 'into' : 'from'} AAVE`;
//     }

//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { sender: 'user', text: userMessage }
//     ]);

//     try {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       const userAddress = await signer.getAddress();

//       let response;

//       if (action === 'swap') {
//         // Existing swap logic
//         const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
//         const fromTokenChecksum = ethers.getAddress(fromToken);
//         const toTokenChecksum = ethers.getAddress(toToken);

//         const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
//         const tokenContract = new Contract(fromTokenChecksum, erc20Abi, signer);
//         const approvalAmount = ethers.parseUnits(inputAmount, 18);
//         const approveTx = await tokenContract.approve(uniswapRouterAddress, approvalAmount);
//         await approveTx.wait();

//         const uniswapRouterABI = [
//           "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)"
//         ];
//         const uniswapContract = new Contract(uniswapRouterAddress, uniswapRouterABI, signer);

//         const path = [fromTokenChecksum, toTokenChecksum];
//         const amountIn = ethers.parseUnits(inputAmount, 18);
//         const amountOutMin = 0;
//         const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

//         const calldata = uniswapContract.interface.encodeFunctionData(
//           'swapExactTokensForTokens',
//           [amountIn, amountOutMin, path, userAddress, deadline]
//         );

//         const transactionRequest = {
//           from: userAddress,
//           to: uniswapRouterAddress,
//           data: calldata,
//           value: '0',
//           gasLimit: '300000',
//           gasPrice: '1000000000',
//         };

//         response = await axios.post('http://localhost:5001/api/simulate', {
//           transactionRequest,
//           fromToken: fromTokenChecksum,
//           toToken: toTokenChecksum
//         });
//       } else if (action === 'deposit' || action === 'withdraw') {
//         // AAVE deposit/withdraw logic
//         response = await axios.post('http://localhost:5001/api/aave', {
//           action,
//           amount: inputAmount,
//           asset: fromToken === 'ETH' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : fromToken,
//           userAddress
//         });
//       }

//       const balanceChanges = response.data.balanceChanges;

//       if (balanceChanges && Array.isArray(balanceChanges)) {
//         let formattedMessage = "Balance changes:\n";
//         balanceChanges.forEach((change) => {
//           formattedMessage += `${change.delta} ${change.token_symbol} in ${change.address}\n`;
//         });

//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { sender: 'bot', text: formattedMessage }
//         ]);
//       } else {
//         throw new Error("Invalid balance changes response");
//       }

//     } catch (error) {
//       console.error('Error processing transaction:', error);
//       if (error.response) {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { sender: 'bot', text: `Error: ${error.response.data.error || 'Server error'}` }
//         ]);
//       } else if (error.request) {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { sender: 'bot', text: 'Error: No response received from server' }
//         ]);
//       } else {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           { sender: 'bot', text: `Error: ${error.message}` }
//         ]);
//       }
//     }

//     setInputAmount('');
//     setFromToken('');
//     setToToken('');
//   };

//   return (
//     <div style={styles.chatContainer}>
//       <div style={styles.messagesContainer}>
//         {messages.map((message, index) => (
//           <div key={index} style={message.sender === 'user' ? styles.userMessage : styles.botMessage}>
//             <strong>{message.sender === 'user' ? 'You: ' : 'Bot: '}</strong>{message.text}
//           </div>
//         ))}
//       </div>
//       <div style={styles.inputContainer}>
//         <select
//           value={action}
//           onChange={(e) => setAction(e.target.value)}
//           style={styles.input}
//         >
//           <option value="swap">Swap</option>
//           <option value="deposit">Deposit to AAVE</option>
//           <option value="withdraw">Withdraw from AAVE</option>
//         </select>
//         <input
//           type="text"
//           value={inputAmount}
//           onChange={(e) => setInputAmount(e.target.value)}
//           placeholder="Enter amount..."
//           style={styles.input}
//         />
//         <input
//           type="text"
//           value={fromToken}
//           onChange={(e) => setFromToken(e.target.value)}
//           placeholder={action === 'swap' ? "From Token (ERC-20 address)..." : "Token (ERC-20 address or ETH)..."}
//           style={styles.input}
//         />
//         {action === 'swap' && (
//           <input
//             type="text"
//             value={toToken}
//             onChange={(e) => setToToken(e.target.value)}
//             placeholder="To Token (ERC-20 address)..."
//             style={styles.input}
//           />
//         )}
//         <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
//       </div>
//     </div>
//   );
// }

// // ... (keep the styles object as it was)

// // export default App;
// const styles = {
//   chatContainer: {
//     display: 'flex',
//     flexDirection: 'column',
//     height: '100vh',
//     width: '100%',
//     justifyContent: 'space-between',
//     backgroundColor: '#f8f9fa',
//     fontFamily: 'Arial, sans-serif'
//   },
//   messagesContainer: {
//     flex: 1,
//     padding: '20px',
//     overflowY: 'scroll',
//     backgroundColor: '#ffffff',
//     borderRadius: '8px',
//     margin: '10px',
//     boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
//   },
//   inputContainer: {
//     display: 'flex',
//     padding: '20px',
//     borderTop: '1px solid #ccc',
//     backgroundColor: '#f1f1f1',
//   },
//   input: {
//     flex: 1,
//     padding: '10px',
//     fontSize: '16px',
//     borderRadius: '4px',
//     border: '1px solid #ccc',
//     outline: 'none',
//   },
//   sendButton: {
//     padding: '10px 20px',
//     fontSize: '16px',
//     backgroundColor: '#007bff',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '4px',
//     cursor: 'pointer',
//     marginLeft: '10px',
//   },
//   userMessage: {
//     textAlign: 'right',
//     backgroundColor: '#d4edda',
//     padding: '10px',
//     borderRadius: '8px',
//     marginBottom: '10px',
//     maxWidth: '60%',
//     marginLeft: 'auto',
//     boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
//   },
//   botMessage: {
//     textAlign: 'left',
//     backgroundColor: '#d1ecf1',
//     padding: '10px',
//     borderRadius: '8px',
//     marginBottom: '10px',
//     maxWidth: '60%',
//     marginRight: 'auto',
//     boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
//   },
// };

// export default App;
import React, { useState } from 'react';
import { ethers, Contract } from 'ethers';
import axios from 'axios';

function App() {
  const [inputAmount, setInputAmount] = useState('');
  const [assetAddress, setAssetAddress] = useState('');  // Token they want to supply
  const [messages, setMessages] = useState([]);

  // Function to handle the supply action
  const handleSupply = async () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: `Supplying ${inputAmount} of asset ${assetAddress} to Aave` }
    ]);

    try {
      // Prepare the transaction data to be sent to the backend
      const supplyDetails = {
        assetAddress: assetAddress,
        amount: inputAmount
      };

      // Send the request to the backend
      const response = await axios.post('http://localhost:5001/api/deposit', supplyDetails);

      // Handle the response from the backend
      if (response.data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Supply simulated successfully!' }
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: `Error: ${response.data.message}` }
        ]);
      }
    } catch (error) {
      console.error('Error in supply operation:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `Error: ${error.message}` }
      ]);
    }

    setInputAmount('');  // Reset input fields
    setAssetAddress('');
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
          placeholder="Enter amount to supply..."
          style={styles.input}
        />
        <input
          type="text"
          value={assetAddress}
          onChange={(e) => setAssetAddress(e.target.value)}
          placeholder="Asset Address (ERC-20)..."
          style={styles.input}
        />
        <button onClick={handleSupply} style={styles.sendButton}>Supply</button>
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
