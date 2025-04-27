// Generate a new wallet for testnet use
const { ethers } = require("ethers");

async function main() {
  // Create a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("New wallet generated for testnet use:");
  console.log("===========================================");
  console.log(`Address: ${wallet.address}`);
  console.log(`Private key (with 0x): ${wallet.privateKey}`);
  console.log(`Private key (without 0x): ${wallet.privateKey.slice(2)}`);
  console.log("===========================================");
  console.log("IMPORTANT: Save this information securely!");
  console.log("1. Add the private key WITHOUT 0x to your .env file");
  console.log("2. Get testnet RBTC from https://faucet.rsk.co/");
  console.log("3. NEVER use this wallet for real funds");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 