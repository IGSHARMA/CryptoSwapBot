const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 5001;

app.use(express.json());
app.use(cors());


const TENDERLY_API_KEY = "USpb8tFuWi62G5U3wqtMpTRd3QNJ7Mjp";
const TENDERLY_ACCOUNT_SLUG = "pesharma";
const TENDERLY_PROJECT_SLUG = "cryptochatbot";

//create Tenderly fork
// const createTenderlyFork = async (chainId) => {
//     try {
//         const response = await axios.post(
//             `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT_SLUG}/project/${TENDERLY_PROJECT_SLUG}/fork`,
//             {
//                 network_id: chainId.toString()  // Example: "1" for Ethereum Mainnet
//             },
//             {
//                 headers: {
//                     'X-Access-Key': TENDERLY_API_KEY,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
//         return response.data.simulation_fork.id;  // Return the fork ID
//     } catch (error) {
//         console.error('Error creating Tenderly fork:', error);
//         throw error;
//     }
// };

const createFork = async () => {
    try {
        const response = await axios.post(
            `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT_SLUG}/project/${TENDERLY_PROJECT_SLUG}/fork`,
            {
                network_id: '1', // Specify the network (e.g., 1 for Ethereum Mainnet)
            },
            {
                headers: {
                    'X-Access-Key': TENDERLY_API_KEY,
                },
            }
        );

        // Check if the fork was created successfully
        if (response.data && response.data.simulation_fork) {
            console.log('Fork Created Successfully:');
            console.log(`Fork ID: ${response.data.simulation_fork.id}`);
        } else {
            console.error('Failed to create fork:', response.data);
        }
    } catch (error) {
        console.error('Error creating fork:', error);
    }
};

createFork();

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

    // Hardcoded values for testing
    const inputAmount = args.inputAmount * 10 ** 18;  // We are taking in 1 so we have to convert wei
    const inputToken = args.inputToken.toUpperCase(); // e.g., 'ETH'
    const outputToken = args.outputToken.toUpperCase(); // e.g., 'USDC'
    const fromChain = 'ETH';  // Ethereum chain ID
    const toChain = 'ETH';    // Same chain (Ethereum for now)
    const fromAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489';  // Example wallet address

    try {
        const result = await axios.get('https://li.quest/v1/quote', {
            params: {
                fromChain,          // Sending chain (Ethereum mainnet)
                toChain,            // Receiving chain (Ethereum mainnet)
                fromToken: inputToken,  // Native ETH
                toToken: outputToken,   // USDC
                fromAmount: inputAmount, // 1 ETH in wei (1000000000000000000)
                fromAddress          // Sender wallet address
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
    const inputAmount = `${BigInt(args.inputAmount) * BigInt(10 ** 18)}`;  // Convert inputAmount to wei
    const fromToken = args.inputToken.toUpperCase();  // e.g., 'ETH'
    const fromChain = args.fromChain.toUpperCase();   // e.g., 'ETH' (Ethereum Mainnet)
    const toChain = args.toChain.toUpperCase();       // e.g., 'ARB' (Arbitrum)

    const fromAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489';  // Example wallet address
    const toAddress = '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489';    // Example receiving address (can be dynamic)

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

// "swap 1 eth for usdc": [
//     [
//         {
//             "name": "swap",
//             "args": {
//                 "inputAmount": "1",
//                 "inputToken": "eth",
//                 "outputToken": "usdc"
//             }
//         }
//     ]
// ],

//ADRESS: 0x40b38765696e3d5d8d9d834d8aad4bb6e418e489

//implement a brige endpoint 
//bridge 1 ETH from ETH to ARB
//implement deposit and withdraw to AVE
//have to build functions on the smart contracts 
//Using tenderly.co 
//give them a transaction on the fork and it will give you an ouput of what transactions change