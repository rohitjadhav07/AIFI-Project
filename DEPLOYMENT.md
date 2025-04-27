# AIFi Deployment Guide

This guide outlines the steps to deploy the AIFi contracts to both local development environments and the Rootstock testnet.

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Git

## Setup

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/aifi-rootstock.git
cd aifi-rootstock
npm install --legacy-peer-deps
```

2. Create a `.env` file in the root directory:

```bash
cp .env-example .env
```

3. Edit the `.env` file and add your private key (for testnet deployment):

```
PRIVATE_KEY=your_private_key_here
```

## Local Deployment

To deploy to a local Hardhat network:

1. Start a local blockchain node in a separate terminal:

```bash
npx hardhat node
```

2. Deploy the contracts:

```bash
npx hardhat run scripts/deploy-all.js --network localhost
```

3. Test the deployed contracts:

```bash
npx hardhat run scripts/test-interaction.js --network localhost
```

## Rootstock Testnet Deployment

To deploy to the Rootstock testnet:

1. Ensure you have RBTC in your account for gas fees
   - Get testnet RBTC from https://faucet.rsk.co/

2. Update your `.env` file with your private key (without the 0x prefix)

3. Deploy the contracts:

```bash
npx hardhat run scripts/deploy-testnet.js --network testnet
```

4. The deployment script will automatically save the contract addresses to `deployment-testnet.json`. Update your `.env` file with these addresses.

## Contract Verification

To verify your contracts on the RSK Explorer:

1. Obtain an API key from the RSK Explorer

2. Add it to your `.env` file:

```
EXPLORER_API_KEY=your_explorer_api_key
```

3. Verify each contract:

```bash
npx hardhat verify --network testnet CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

For example:

```bash
# Verify the oracle
npx hardhat verify --network testnet 0xYourOracleAddress "0xYourDeployerAddress"

# Verify the lending pool
npx hardhat verify --network testnet 0xYourLendingPoolAddress "0xYourOracleAddress"

# Verify the remittance contract
npx hardhat verify --network testnet 0xYourRemittanceAddress "0xYourTreasuryAddress"

# Verify the voice interface
npx hardhat verify --network testnet 0xYourVoiceInterfaceAddress
```

## AI Model Deployment

The AI models in the `ai/` directory need to be deployed separately:

1. Set up a Python environment:

```bash
pip install -r ai/requirements.txt
```

2. Train and prepare the models:

```bash
python ai/risk_assessment_model.py
python ai/remittance_optimizer.py
python ai/voice_recognition.py
```

3. Configure your backend to connect these models with the deployed contracts.

## Troubleshooting

### Transaction Errors

If you encounter "transaction underpriced" errors on Rootstock, try increasing the `GAS_MULTIPLIER` value in your `.env` file.

### Dependency Issues

If you encounter dependency conflicts, use the `--legacy-peer-deps` flag when installing packages:

```bash
npm install --save-dev package-name --legacy-peer-deps
```

### Contract Size Errors

If you encounter "contract code size exceeds maximum" errors, make sure the optimizer is enabled in `hardhat.config.js`:

```javascript
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  // ...
};
``` 