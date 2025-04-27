# AIFi Project Structure

This document provides an overview of the AIFi project structure to help understand the organization of the codebase.

```
aifi-rootstock/
├── README.md                # Project overview and setup instructions
├── SUBMISSION.md            # Hackathon submission details
├── AI_PROMPTS.md            # Documentation of AI prompts used in development
├── PROJECT_STRUCTURE.md     # This file
├── .env-example             # Example environment variables
├── package.json             # Node.js dependencies
├── hardhat.config.js        # Hardhat configuration for Rootstock
│
├── contracts/               # Smart contracts
│   ├── AIFiLendingPool.sol  # Lending pool with AI risk assessment
│   ├── AIFiRemittance.sol   # Cross-border remittance with optimized fees
│   ├── AIFiVoiceInterface.sol # Voice command registry
│   ├── AIRiskOracle.sol     # Oracle for AI risk assessment
│   └── interfaces/          # Contract interfaces
│       └── IAIRiskOracle.sol # Risk oracle interface
│
├── scripts/                 # Deployment and interaction scripts
│   └── deploy.js            # Main deployment script
│
├── test/                    # Contract tests
│   ├── AIFiLendingPool.test.js
│   ├── AIFiRemittance.test.js
│   ├── AIFiVoiceInterface.test.js
│   └── AIRiskOracle.test.js
│
├── ai/                      # AI models and services
│   ├── README.md            # AI components documentation
│   ├── risk_assessment_model.py  # Credit scoring model
│   ├── remittance_optimizer.py   # Remittance path optimization
│   └── voice_recognition.py      # Voice command processing
│
├── frontend/                # Web and mobile frontend (not included in this repo)
│   ├── src/                 # Frontend source code
│   ├── public/              # Static assets
│   └── ...
│
└── docs/                    # Additional documentation
    ├── architecture.md      # System architecture details
    ├── ai_models.md         # AI model technical specifications
    └── api.md               # API documentation
```

## Key Components

### Smart Contracts

- **AIFiLendingPool.sol**: Main lending protocol contract that integrates with the AI risk assessment oracle. Allows deposits, withdrawals, loans with dynamic interest rates based on risk tiers.

- **AIRiskOracle.sol**: Oracle contract that serves as the bridge between off-chain AI risk assessment and on-chain lending decisions. Stores and updates user risk tiers.

- **AIFiRemittance.sol**: Handles cross-border transfers with optimized routing between different stablecoins and corridors. Includes fee calculations based on corridor-specific rates.

- **AIFiVoiceInterface.sol**: Registry for voice commands that maps natural language instructions to contract function calls. Supports multiple languages and command patterns.

### AI Models

- **risk_assessment_model.py**: XGBoost-based machine learning model for credit risk assessment based on alternative financial data. Outputs risk tiers (LOW, MEDIUM, HIGH) and connects to the blockchain oracle.

- **remittance_optimizer.py**: Graph-based reinforcement learning model that finds optimal paths for remittances through various stablecoins to minimize fees and transaction times.

- **voice_recognition.py**: NLP pipeline for processing voice commands, including language detection, intent classification, and parameter extraction. Converts natural language to blockchain transactions.

### Deployment and Scripts

- **deploy.js**: Handles deployment of all contracts to Rootstock network with proper initialization and interconnections.

## Development Environment

The project uses:
- Hardhat for smart contract development, testing, and deployment
- Python with TensorFlow and PyTorch for AI models
- React and React Native for frontend (in a separate repository)

## Getting Started

1. Clone this repository
2. Copy `.env-example` to `.env` and fill in your credentials
3. Install dependencies with `npm install`
4. Run tests with `npx hardhat test`
5. Deploy to Rootstock testnet with `npx hardhat run scripts/deploy.js --network testnet` 