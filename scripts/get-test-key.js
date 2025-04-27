// Script to get a test account private key for local development
const { ethers } = require("ethers");

async function main() {
  // This is the first default Hardhat test account
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  
  // Derive the address from the private key
  const wallet = new ethers.Wallet(privateKey);
  const address = wallet.address;
  
  console.log("For testing in your .env file, you can use:");
  console.log("---------------------------------------------");
  console.log(`Address: ${address}`);
  console.log(`Private key (without 0x): ${privateKey.slice(2)}`);
  console.log("---------------------------------------------");
  console.log("IMPORTANT: NEVER USE THIS KEY FOR ANYTHING REAL. IT'S PUBLIC KNOWLEDGE!");
  console.log("Copy the private key (without 0x prefix) to your .env file");
}

// Execute and handle errors
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 