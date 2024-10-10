const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ethers = require('ethers');
require('dotenv').config();
const app = express();
const port = 5001;

app.use(express.json());
app.use(cors());


const TENDERLY_API_KEY = process.env.TENDERLY_API_KEY;
const TENDERLY_ACCOUNT_SLUG = process.env.TENDERLY_ACCOUNT_SLUG;
const TENDERLY_PROJECT_SLUG = process.env.TENDERLY_PROJECT_SLUG;
const TENDERLY_RPC_URL = 'https://rpc.tenderly.co/fork/7932e8e6-a9aa-45d7-a74b-9a7ee30b3a3d'; // Static Tenderly Fork RPC URL
const DEFAULT_FROM_ADDRESS = '0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e'; // Static address for transactions

// Simulate a swap transaction on Uniswap
const simulateSwapTransaction = async () => {
    try {
        const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        const uniswapRouterAbi = ["function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)"];

        const iface = new ethers.utils.Interface(uniswapRouterAbi);

        const data = iface.encodeFunctionData("swapExactETHForTokens", [
            ethers.BigNumber.from('0'), // amountOutMin
            ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'], // ETH to USDC path
            "0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e", // recipient address
            Math.floor(Date.now() / 1000) + 60 * 10 // deadline (10 minutes from now)
        ]);

        const txRequest = {
            from: '0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e',
            to: uniswapRouterAddress,
            data: data,
            value: ethers.utils.parseEther('1'), // Send 1 ETH for the swap
            gasLimit: ethers.BigNumber.from('300000'), // Adjust if necessary
            gasPrice: ethers.BigNumber.from('1000000000') // 1 gwei
        };

        const txResponse = await wallet.sendTransaction(txRequest);

        // Wait for the transaction to be mined
        const receipt = await txResponse.wait();
        console.log('Transaction Simulated Successfully:', receipt);
        return receipt;
    } catch (error) {
        console.log('Error simulating swap transaction:', error);
        throw error;
    }
};

const simulateTransactionOnFork = async (transactionRequest) => {
    try {
        console.log("Transaction Request:", transactionRequest);
        if (!transactionRequest.to || !transactionRequest.data) {
            throw new Error("Missing required transaction fields");
        }

        // Use the provided Tenderly RPC endpoint
        const provider = new ethers.JsonRpcProvider(TENDERLY_RPC_URL);

        // Use the predefined address for all transactions
        const fromAddress = DEFAULT_FROM_ADDRESS;
        console.log("Using from address:", fromAddress);

        // Use a signer wallet for signing transactions instead of provider.getSigner
        const privateKey = process.env.PRIVATE_KEY; // Add the private key of the account (e.g., from Tenderly forked accounts)
        const wallet = new ethers.Wallet(privateKey, provider);

        console.log("Signer wallet obtained for address:", wallet.address);
        const txResponse = await wallet.sendTransaction({
            to: transactionRequest.to,
            data: transactionRequest.data,
            value: transactionRequest.value || '0',
            gasLimit: '300000',
            gasPrice: '1000000000',
        });

        // Wait for the transaction to be mined
        const receipt = await txResponse.wait();
        console.log('Transaction Simulated Successfully:', receipt);
        return receipt;
    } catch (error) {
        console.log('Error simulating transaction via RPC:', error);
        throw error;
    }
};

// API endpoint to get available accounts from the fork
app.get('/api/accounts', async (req, res) => {
    try {
        const provider = new ethers.JsonRpcProvider(TENDERLY_RPC_URL);
        const accounts = await provider.listAccounts();
        res.json({ accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Error fetching accounts' });
    }
});

// app.post('/api/simulate', async (req, res) => {
//     try {
//         const { transactionRequest, type, swapDetails } = req.body;

//         console.log('Received simulation request:', transactionRequest);

//         if (!transactionRequest) {
//             return res.status(400).json({ error: 'Transaction request is missing' });
//         }

//         let txRequest = transactionRequest;

//         // Check if this is a swap request
//         if (type === 'swap' && swapDetails) {
//             const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router Address

//             // Define the Uniswap ABI
//             const uniswapRouterAbi = [
//                 "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)"
//             ];
//             const iface = new ethers.utils.Interface(uniswapRouterAbi);

//             // Update the path to use WETH instead of ETH
//             const path = [
//                 '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',  // WETH
//                 '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'   // USDC
//             ];

//             // Encode the function data for Uniswap swap
//             const data = iface.encodeFunctionData("swapExactETHForTokens", [
//                 0, // Minimum amount of tokens expected (can be 0)ethers.BigNumber.from(swapDetails.amountOutMin)
//                 path, // Updated path from WETH to USDC
//                 swapDetails.recipient, // Address to receive the output tokens
//                 Math.floor(Date.now() / 1000) + swapDetails.deadline // Deadline for the swap
//             ]);

//             // Update the transaction request with encoded data and Uniswap router as the destination
//             txRequest = {
//                 from: transactionRequest.from,
//                 to: uniswapRouterAddress, // Uniswap router address
//                 data: data,
//                 value: ethers.utils.parseEther(swapDetails.inputAmount), // ETH amount for the swap
//                 gasLimit: ethers.BigNumber.from(transactionRequest.gasLimit || '300000'), // Adjust gas limit for swap
//                 gasPrice: ethers.BigNumber.from(transactionRequest.gasPrice || '1000000000') // 1 gwei
//             };
//         }

//         // Simulate the transaction using the modified transaction request
//         const simulationResult = await simulateTransactionOnFork(txRequest);

//         // Send the simulation result back to the client
//         res.json(simulationResult);
//     } catch (error) {
//         console.error('Error simulating transaction:', error);
//         res.status(500).json({ error: 'Error simulating transaction' });
//     }
// });

app.post('/api/simulate', async (req, res) => {
    try {
        const { transactionRequest, type, swapDetails } = req.body;

        console.log('Received simulation request:', transactionRequest);

        if (!transactionRequest) {
            return res.status(400).json({ error: 'Transaction request is missing' });
        }

        let txRequest = transactionRequest;

        // Check if this is a swap request for token-to-token
        if (type === 'swap' && swapDetails) {
            const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router Address

            // Define the Uniswap ABI for token-to-token swaps
            const uniswapRouterAbi = [
                "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)"
            ];

            const iface = new ethers.utils.Interface(uniswapRouterAbi);

            // Define the path for token-to-token swaps (e.g., DAI -> USDC)
            const path = [swapDetails.inputToken, swapDetails.outputToken];

            // Encode the function data for Uniswap token-to-token swap
            const data = iface.encodeFunctionData("swapExactTokensForTokens", [
                ethers.BigNumber.from(swapDetails.inputAmount), // Amount of input tokens
                ethers.BigNumber.from(swapDetails.amountOutMin), // Minimum amount of output tokens expected
                path, // Swap path (input -> output token addresses)
                swapDetails.recipient, // Address to receive the output tokens
                Math.floor(Date.now() / 1000) + swapDetails.deadline // Deadline for the swap
            ]);

            // Update the transaction request with encoded data and Uniswap router as the destination
            txRequest = {
                from: transactionRequest.from,
                to: uniswapRouterAddress, // Uniswap router address
                data: data,
                gasLimit: ethers.BigNumber.from(transactionRequest.gasLimit || '300000'), // Adjust gas limit for swap
                gasPrice: ethers.BigNumber.from(transactionRequest.gasPrice || '1000000000') // 1 gwei
            };
        }

        // Simulate the transaction using the modified transaction request
        const simulationResult = await simulateTransactionOnFork(txRequest);

        // Send the simulation result back to the client
        res.json(simulationResult);
    } catch (error) {
        console.error('Error simulating transaction:', error);
        res.status(500).json({ error: 'Error simulating transaction' });
    }
});

// SWAP endpoint
app.post('/api/swap', async (req, res) => {
    // const { inputAmount, inputToken, outputToken } = req.body;
    const { name, args } = req.body;
    if (name != 'swap') {
        return res.status(400).json({ error: 'Invalid Action' });
    }

    if (isNaN(args.inputAmount)) {
        return res.status(400).json({ error: 'Invalid input amount. Please provide a valid number.' });
    }
    // LI.FI API call for a swap quote
    const inputAmount = args.inputAmount * 10 ** 18;
    const inputToken = args.inputToken.toUpperCase();
    const outputToken = args.outputToken.toUpperCase();
    const fromChain = 'ETH';  // Ethereum chain ID
    const toChain = 'ETH';    // Same chain (Ethereum for now)
    const fromAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489';

    try {
        const result = await axios.get('https://li.quest/v1/quote', {
            params: {
                fromChain,
                toChain,
                fromToken: inputToken,
                toToken: outputToken,
                fromAmount: inputAmount,
                fromAddress
            }
        });

        // Send the LI.FI quote result back
        console.log("Backend fetched properly")
        res.json(result.data);
    } catch (error) {
        console.error('Error fetching quote:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

app.post('/api/bridge', async (req, res) => {
    const { name, args } = req.body;

    if (name != 'bridge') {
        return res.status(400).json({ error: "Invalid action" });
    }

    if (isNaN(args.inputAmount)) {
        return res.status(400).json({ error: 'Invalid input amount. Please provide a valid number.' });
    }
    // Extract dynamic data from frontend
    const inputAmount = `${BigInt(args.inputAmount) * BigInt(10 ** 18)}`;
    const fromToken = args.inputToken.toUpperCase();
    const fromChain = args.fromChain.toUpperCase();
    const toChain = args.toChain.toUpperCase();

    const fromAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489';
    const toAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489'; // Example receiving address (can be dynamic)

    try {
        // Send request to LI.FI API for bridging
        const result = await axios.get('https://li.quest/v1/quote', {
            params: {
                fromChain,
                toChain,
                fromToken,
                toToken: fromToken,
                fromAmount: inputAmount,
                fromAddress,
                toAddress
            }
        });

        // Send the LI.FI bridge quote result back
        res.json(result.data);
    } catch (error) {
        console.error('Error fetching bridge quote:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch bridge quote' });
    }
})

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});

// create Tenderly fork
// const createTenderlyFork = async (chainId) => {
//     try {
//         const response = await axios.post(
//             `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT_SLUG}/project/${TENDERLY_PROJECT_SLUG}/fork`,
//             {
//                 network_id: chainId.toString()
//             },
//             {
//                 headers: {
//                     'X-Access-Key': TENDERLY_API_KEY,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
//         console.log('Fork Created Successfully');
//         const forkId = response.data.simulation_fork.id;  // Extract the fork ID correctly
//         console.log(`This is the fork id: ${forkId}`);

//         // Adding delay to ensure fork readiness
//         await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

//         return forkId;  // Return the fork ID
//     } catch (error) {
//         console.error('Error creating Tenderly fork:', error);
//         throw error;
//     }
// };