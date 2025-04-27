# AIFi - AI-Powered DeFi Platform

AIFi is a decentralized finance platform enhanced with artificial intelligence capabilities, featuring lending, remittances, and a voice interface for intuitive interactions.

## Project Structure

The project consists of two main parts:

- **Smart Contracts**: Solidity contracts for lending, remittances, and token management
- **Frontend**: Next.js application that provides a user interface to interact with the smart contracts

```
AIFi/
├── contracts/       # Smart contracts
├── scripts/         # Deployment scripts
├── frontend/        # Next.js application
└── test/            # Contract tests
```

## Features

- **AI-Powered Lending**: Risk assessment and personalized interest rates based on user history
- **Smart Remittances**: Efficient cross-border money transfers with optimized fees
- **Voice Interface**: Interact with the platform using natural language commands

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python 3.9 or 3.10 (not 3.13, as there are compatibility issues)
- MetaMask or another Ethereum wallet

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/aifi.git
   cd aifi
   ```

2. Install dependencies for smart contracts
   ```
   npm install
   ```

3. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

### Smart Contract Deployment

1. Configure your `.env` file with private keys and network information
2. Deploy the token contract
   ```
   npx hardhat run scripts/deploy-token.js --network <network>
   ```
3. Deploy the lending contract
   ```
   npx hardhat run scripts/deploy-lending.js --network <network>
   ```
4. Deploy the remittance contract
   ```
   npx hardhat run scripts/deploy-remittance.js --network <network>
   ```

### Running the Frontend

1. Navigate to the frontend directory
   ```
   cd frontend
   ```
2. Start the development server
   ```
   npm run dev
   ```
3. Access the application at `http://localhost:3000`

## Wallet Connection

AIFi includes a wallet persistence mechanism that maintains your connection across different operations. Your wallet connection status is saved in local storage for a smoother user experience.

## Testing

Run smart contract tests with:
```
npx hardhat test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Key AI-Powered Features

### 1. AI Risk Assessment Engine
- **Personalized Interest Rates**: Machine learning models analyze alternative financial data to assess credit risk and set personalized interest rates
- **Credit Scoring Without Traditional Credit History**: Uses transaction patterns, wallet activity, and on-chain behavior
- **Risk Explanations**: Transparent AI explanations for lending decisions
- **Adaptive Learning**: Models continuously improve based on repayment behavior and market conditions

### 2. Smart Remittance Optimization
- **Optimal Route Finding**: AI algorithms find the most cost-effective routes for cross-border payments
- **Fee Prediction**: Gradient boosting models predict transfer fees across different corridors
- **Multi-hop Path Planning**: Graph-based algorithms discover efficient indirect routes when direct transfers are expensive
- **Reliability Scoring**: Assesses the reliability of different transfer paths

### 3. Voice-Controlled DeFi Interface
- **Natural Language Processing**: Enables voice command interaction with smart contracts
- **Multi-language Support**: Process commands in English, Spanish, and Portuguese
- **Intent Classification**: BERT-based model identifies user intentions from natural speech
- **Entity Extraction**: Named Entity Recognition to identify amounts, tokens, and recipients
- **Cross-border Command Recognition**: Identifies remittance-specific parameters in voice commands

## 🛠️ Technology Stack

### Blockchain
- **Smart Contracts**: Solidity on Rootstock
- **Development**: Hardhat, Ethers.js
- **Frontend**: Next.js, React

### AI & Machine Learning
- **Libraries**: PyTorch, TensorFlow, Scikit-learn, Hugging Face Transformers
- **NLP Models**: BERT, T5 for intent classification and entity extraction
- **ML Models**: RandomForest, GradientBoosting for risk assessment and fee prediction
- **Graph Algorithms**: NetworkX for optimizing remittance routes

## 🧠 AI Components

AIFi features three core AI components that work together to enhance the DeFi experience:

### Risk Assessment Model
The `ai/risk_assessment_model.py` module implements a machine learning system that:
- Evaluates borrower risk profiles
- Calculates personalized interest rates
- Provides explainable lending decisions
- Integrates with the `AIRiskOracle` smart contract

### Remittance Optimizer
The `ai/remittance_optimizer.py` module implements:
- Fee prediction across different corridors
- Optimal route discovery for cross-border transfers
- Multi-factor analysis of remittance paths
- Corridor statistics analysis

### Voice Recognition System
The `ai/voice_recognition.py` module implements:
- Intent classification for financial commands
- Named Entity Recognition for transaction details
- Smart contract integration via `AIFiVoiceInterface`
- Multilingual support with translation capabilities

For detailed AI documentation, see [AI_COMPONENTS.md](./AI_COMPONENTS.md).

## 📚 Documentation

- [Smart Contract Documentation](./docs/CONTRACTS.md)
- [AI Components Documentation](./AI_COMPONENTS.md)
- [API Documentation](./docs/API.md)
- [Frontend Documentation](./frontend/README.md)

## 🧪 Testing

```bash
# Run smart contract tests
npx hardhat test

# Test AI models
cd ai
python -m unittest discover -s tests

# Run frontend tests
cd frontend
npm test
```

## 📈 Roadmap

1. **Q2 2025**: Beta launch with AI risk assessment and voice interface
2. **Q3 2025**: Release of remittance optimization engine
3. **Q4 2025**: AI portfolio management features
4. **Q1 2026**: Advanced fraud detection system
5. **Q2 2026**: Decentralized AI governance model

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

For inquiries, please reach out to us at rohitjadhav45074507@gmail.com 