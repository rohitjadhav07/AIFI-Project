import { ethers } from 'ethers';

// ABI imports (will need to be copied from artifacts)
const AIFiLendingPoolABI = [
  // Sample ABI - replace with actual ABI from artifacts
  "function deposit(address _token, uint256 _amount) external",
  "function withdraw(address _token, uint256 _amount) external",
  "function borrow(address _token, uint256 _amount) external",
  "function repay(address _token) external",
  "function getUserDeposits(address user, address token) external view returns (uint256)",
  "function supportedTokens(address) public view returns (bool)"
];

const AIFiRemittanceABI = [
  // Sample ABI - replace with actual ABI from artifacts
  "function initiateTransfer(address _tokenAddress, uint256 _amount, string _recipientId, string _originCountry, string _destinationCountry) external returns (uint256)",
  "function cancelTransfer(uint256 _transferId) external",
  "function getTransfer(uint256 _transferId) external view returns (uint256, address, string, address, uint256, uint256, string, string, uint256, uint8)",
  "function getUserTransfers(address _user) external view returns (uint256[])",
  "function supportedTokens(address) public view returns (bool)"
];

const AIFiVoiceInterfaceABI = [
  // Sample ABI - replace with actual ABI from artifacts
  "function generateCommandHash(string _language, string _command) external pure returns (bytes32)",
  "function getAction(bytes32 _commandHash) external view returns (address, bytes4, string, bool)",
  "function supportedLanguages(string) public view returns (bool)"
];

const TokenABI = [
  // ERC20 interface functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Contract addresses (replace with actual deployed addresses)
const CONTRACT_ADDRESSES = {
  lendingPool: "0xa0FA99EBB7dA508dFBB6e7DEe5aA02F7789D6aD3",
  remittance: "0x2255bC87E8D6E56125793ab7Efd1D6b34023C92a",
  voiceInterface: "0xfb2Ee92e5C8AFA67d39c1A98D8ee89Faeae92EE2",
  // Add token address with a valid value
  token: "0x1234567890123456789012345678901234567890"
};

// Connection persistence
const isAutoConnectEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('wallet_autoconnect') === 'true';
};

const setAutoConnect = (enable) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wallet_autoconnect', enable ? 'true' : 'false');
};

// Save last connected account
const saveConnectedAccount = (address) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('last_connected_account', address);
  setAutoConnect(true);
};

// Clear connected account
const clearConnectedAccount = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('last_connected_account');
  setAutoConnect(false);
};

// Get last connected account
const getLastConnectedAccount = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('last_connected_account');
};

// Get provider and signer
const getProviderAndSigner = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask to use this application');
  }
  
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  // Save the connected account
  const address = await signer.getAddress();
  saveConnectedAccount(address);
  
  return { provider, signer };
};

// Disconnect wallet
const disconnectWallet = async () => {
  // For MetaMask, there's no direct disconnect method
  // We can only remove our app's knowledge of the connection
  clearConnectedAccount();
  
  // Force reload to clear any in-memory state
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
  
  return true;
};

// Auto connect on app load
const autoConnect = async () => {
  if (!isAutoConnectEnabled() || typeof window.ethereum === 'undefined') {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0) {
      const lastAccount = getLastConnectedAccount();
      // If the current account matches the last saved one, return it
      if (lastAccount && accounts.includes(lastAccount)) {
        return lastAccount;
      } else if (accounts[0]) {
        // Save the new account
        saveConnectedAccount(accounts[0]);
        return accounts[0];
      }
    }
  } catch (error) {
    console.error('Auto-connect error:', error);
    clearConnectedAccount();
  }
  
  return null;
};

// Check if connected to Rootstock testnet
const checkNetwork = async (provider) => {
  const network = await provider.getNetwork();
  if (network.chainId !== 31) {
    throw new Error('Please connect to Rootstock Testnet');
  }
  return true;
};

// Get contract instances
const getContracts = async () => {
  const { provider, signer } = await getProviderAndSigner();
  await checkNetwork(provider);
  
  const lendingPool = new ethers.Contract(
    CONTRACT_ADDRESSES.lendingPool,
    AIFiLendingPoolABI,
    signer
  );
  
  const remittance = new ethers.Contract(
    CONTRACT_ADDRESSES.remittance,
    AIFiRemittanceABI,
    signer
  );
  
  const voiceInterface = new ethers.Contract(
    CONTRACT_ADDRESSES.voiceInterface,
    AIFiVoiceInterfaceABI,
    signer
  );
  
  const token = CONTRACT_ADDRESSES.token ? 
    new ethers.Contract(CONTRACT_ADDRESSES.token, TokenABI, signer) : 
    null;
  
  return { lendingPool, remittance, voiceInterface, token, signer };
};

// Utility functions for common contract interactions

// Lending Pool Functions
export const deposit = async (tokenAddress, amount) => {
  const { lendingPool } = await getContracts();
  const tx = await lendingPool.deposit(tokenAddress, amount);
  return await tx.wait();
};

export const withdraw = async (tokenAddress, amount) => {
  const { lendingPool } = await getContracts();
  const tx = await lendingPool.withdraw(tokenAddress, amount);
  return await tx.wait();
};

export const borrow = async (tokenAddress, amount) => {
  const { lendingPool } = await getContracts();
  const tx = await lendingPool.borrow(tokenAddress, amount);
  return await tx.wait();
};

export const repay = async (tokenAddress) => {
  const { lendingPool } = await getContracts();
  const tx = await lendingPool.repay(tokenAddress);
  return await tx.wait();
};

// Remittance Functions
export const sendMoney = async (tokenAddress, amount, recipientId, originCountry, destinationCountry) => {
  const { remittance } = await getContracts();
  const tx = await remittance.initiateTransfer(
    tokenAddress, 
    amount, 
    recipientId, 
    originCountry, 
    destinationCountry
  );
  return await tx.wait();
};

export const getTransferDetails = async (transferId) => {
  const { remittance } = await getContracts();
  return await remittance.getTransfer(transferId);
};

export const getUserTransfers = async () => {
  const { remittance, signer } = await getContracts();
  const address = await signer.getAddress();
  return await remittance.getUserTransfers(address);
};

// Voice Interface Functions
export const generateCommandHash = async (language, command) => {
  const { voiceInterface } = await getContracts();
  return await voiceInterface.generateCommandHash(language, command);
};

export const getCommandAction = async (commandHash) => {
  const { voiceInterface } = await getContracts();
  return await voiceInterface.getAction(commandHash);
};

// Token Functions
export const getTokenBalance = async (address) => {
  const { token, signer } = await getContracts();
  if (!token) throw new Error('Token not configured');
  
  const userAddress = address || await signer.getAddress();
  return await token.balanceOf(userAddress);
};

export const approveToken = async (spenderAddress, amount) => {
  const { token } = await getContracts();
  if (!token) throw new Error('Token not configured');
  
  const tx = await token.approve(spenderAddress, amount);
  return await tx.wait();
};

// Export all functions and contract addresses
export default {
  CONTRACT_ADDRESSES,
  getContracts,
  getProviderAndSigner,
  disconnectWallet,
  autoConnect,
  isAutoConnectEnabled,
  deposit,
  withdraw,
  borrow,
  repay,
  sendMoney,
  getTransferDetails,
  getUserTransfers,
  generateCommandHash,
  getCommandAction,
  getTokenBalance,
  approveToken
}; 