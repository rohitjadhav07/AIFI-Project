# AIFi Frontend

This is the frontend application for the AIFi platform, an AI-powered DeFi solution on Rootstock.

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- NPM 7.x or higher
- MetaMask or another Web3 wallet

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Pages

### Home (`/`)
The main landing page that provides access to all features.

### Lending (`/lending`)
Interact with the AIFi lending pool:
- Deposit funds and earn interest
- Withdraw your deposits
- Borrow funds with AI-optimized interest rates
- Repay your loans

### Remittance (`/remittance`)
Send money across borders:
- Transfer funds with AI-optimized fees
- View your transfer history
- Track status of pending transfers

### Voice Interface (`/voice`)
Use voice commands to interact with AIFi:
- Speak commands in multiple languages (English, Spanish, Portuguese)
- View example commands
- See your command history

## Wallet Connection

The application requires a Web3 wallet connection (MetaMask recommended):
1. Install MetaMask from [metamask.io](https://metamask.io/)
2. Connect to Rootstock Testnet using these settings:
   - Network Name: `RSK Testnet`
   - RPC URL: `https://public-node.testnet.rsk.co`
   - Chain ID: `31`
   - Symbol: `tRBTC`
   - Block Explorer: `https://explorer.testnet.rsk.co`
3. Get testnet RBTC from the [RSK Faucet](https://faucet.rsk.co/)

## Development

### File Structure

- `/pages` - Next.js pages
- `/components` - Reusable React components
- `/styles` - CSS styling
- `/utils` - Utility functions including contract interactions
- `/public` - Static assets

### Contract Interactions

All blockchain interactions are handled through the functions in `/utils/contracts.js`. This file provides a clean interface for interacting with the AIFi smart contracts.

## License

MIT 