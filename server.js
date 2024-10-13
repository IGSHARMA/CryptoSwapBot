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
const forkId = '7932e8e6-a9aa-45d7-a74b-9a7ee30b3a3d'
//Created a hashmap for different erc 20 tokens so I can link them to the output message instead of having a big ah address 
const tokenAddressToSymbol = {
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
    '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'LINK',
    '0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eb48': 'USDC'
};

// Simulate a swap transaction on Uniswap
const simulateSwapTransaction = async () => {
    try {
        const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        const uniswapRouterAbi = ["function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)"];

        const iface = new ethers.utils.Interface(uniswapRouterAbi);

        const data = iface.encodeFunctionData("swapExactETHForTokens", [
            ethers.BigNumber.from('0'), // amountOutMin
            ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
            "0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e",
            Math.floor(Date.now() / 1000) + 60 * 10
        ]);

        const txRequest = {
            from: '0xF2C9729E0FEf5dd486753dc02aFE93BC0c06801e',
            to: uniswapRouterAddress,
            data: data,
            value: ethers.utils.parseEther('1'),
            gasLimit: ethers.BigNumber.from('300000'),
            gasPrice: ethers.BigNumber.from('1000000000')
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

//Have to make sure that the fromToken and toToken are sent dynamically from the frontend! 
const simulateTransactionOnFork = async (transactionRequest, fromToken, toToken) => {
    try {
        console.log("Transaction Request:", transactionRequest);

        if (!transactionRequest.to || !transactionRequest.data) {
            throw new Error("Missing required transaction fields");
        }

        // Use the provided Tenderly RPC endpoint
        const provider = new ethers.JsonRpcProvider(TENDERLY_RPC_URL);
        const privateKey = process.env.PRIVATE_KEY;
        const wallet = new ethers.Wallet(privateKey, provider);

        // Make sure the token addresses are valid
        const fromTokenAddress = fromToken//ethers.utils.getAddress(`${fromToken}`);
        const toTokenAddress = toToken//ethers.utils.getAddress(`${toToken}`);

        // Define ERC20 ABI to interact with balanceOf function
        const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];
        const fromTokenContract = new ethers.Contract(fromTokenAddress, erc20Abi, provider);
        const toTokenContract = new ethers.Contract(toTokenAddress, erc20Abi, provider);

        // Get the balances before the transaction
        const initialFromBalance = await fromTokenContract.balanceOf(wallet.address);
        const initialToBalance = await toTokenContract.balanceOf(wallet.address);

        // Send the transaction and wait for it to be mined
        const txResponse = await wallet.sendTransaction(transactionRequest);
        const receipt = await txResponse.wait();
        console.log('Transaction Simulated Successfully:', receipt);

        const finalFromBalance = await fromTokenContract.balanceOf(wallet.address);
        const finalToBalance = await toTokenContract.balanceOf(wallet.address);

        const fromTokenDelta = (initialFromBalance - finalFromBalance) / BigInt(10 ** 18);
        const toTokenDelta = (finalToBalance - initialToBalance) / BigInt(10 ** 18);

        // Prepare the balanceChanges array for the frontend
        const balanceChanges = [
            {
                delta: `-${fromTokenDelta.toString()}`,
                token_symbol: tokenAddressToSymbol[fromToken],
                address: wallet.address
            },
            {
                delta: `+${toTokenDelta.toString()}`,
                token_symbol: tokenAddressToSymbol[toToken],
                address: wallet.address
            }
        ];

        // Return this to the frontend
        return { balanceChanges };

    } catch (error) {
        console.error('Error simulating transaction via API:', error.response?.data || error.message);
        throw error;
    }
};

app.post('/api/simulate', async (req, res) => {
    try {
        const { transactionRequest, fromToken, toToken } = req.body;

        console.log('Received simulation request:', transactionRequest);

        if (!transactionRequest || !fromToken || !toToken) {
            return res.status(400).json({ error: 'Transaction request or token addresses are missing' });
        }

        // Simulate the transaction using the modified transaction request and dynamic token addresses
        const simulationResult = await simulateTransactionOnFork(transactionRequest, fromToken, toToken);

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


//AAVE Extensions:

const simulateSupplyOnAave = async () => {
    try {
        const provider = new ethers.JsonRpcProvider(TENDERLY_RPC_URL);
        const privateKey = process.env.PRIVATE_KEY;
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`Signer wallet obtained for address: ${wallet.address}`);

        // Aave V3 Wrapper contract for ETH deposits
        const wethGatewayAddress = '0xC09e69E79106861dF5d289dA88349f10e2dc6b5C';

        const aaveWethGatewayAbi = [
            "function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode) external payable"
        ];

        // Create the contract instance
        const aaveWethGatewayContract = new ethers.Contract(wethGatewayAddress, aaveWethGatewayAbi, wallet);

        // Aave V3 Pool address
        const poolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
        const amount = ethers.parseEther("1");  // 1 ETH
        const referralCode = 0;

        console.log('TENDERLY_RPC_URL:', TENDERLY_RPC_URL);
        console.log('Wallet address:', wallet.address);
        console.log('WETH Gateway address:', wethGatewayAddress);
        console.log('Pool address:', poolAddress);
        console.log('Amount:', amount.toString());

        // Create the transaction request
        const tx = await aaveWethGatewayContract.depositETH.populateTransaction(
            poolAddress,
            wallet.address,
            referralCode,
            { value: amount }
        );

        // Add gas limit and price
        tx.gasLimit = '300000';
        tx.gasPrice = '10000000000'; // 10 gwei in wei

        // Send the transaction and wait for the response
        const txResponse = await wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();
        console.log("Transaction Simulated Successfully:", receipt);

        return receipt;

    } catch (error) {
        console.error('Error simulating supply transaction:', error);
        throw error;
    }
};

app.post('/api/deposit', async (req, res) => {
    try {
        // Simulate the supply transaction to Aave
        const receipt = await simulateSupplyOnAave();

        // Return the receipt or a success message to the frontend
        res.json({
            success: true,
            message: 'Supply simulated successfully',
            receipt: receipt
        });
    } catch (error) {
        console.error('Error simulating supply:', error);
        res.status(500).json({ success: false, message: 'Failed to simulate supply', error: error.message });
    }
});

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