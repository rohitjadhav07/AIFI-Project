// Script to deploy AIFiToken and add it to AIFi contracts
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  try {
    // Load deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-testnet.json', 'utf8'));
    console.log("Loaded deployment information from Rootstock Testnet");
    
    // Get contract addresses
    const lendingPoolAddress = deploymentInfo.contracts.AIFiLendingPool;
    const remittanceAddress = deploymentInfo.contracts.AIFiRemittance;
    
    console.log("Setting up AIFi Token for contracts...");
    
    // Get signer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    console.log(`Account balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} RBTC`);
    
    // Deploy the AIFi token
    console.log("\n--- Deploying AIFiToken ---");
    const AIFiToken = await hre.ethers.getContractFactory("AIFiToken");
    
    // Use higher gas limit and lower gas price for Rootstock
    const deploymentOptions = {
      gasLimit: 4000000,
      gasPrice: (await hre.ethers.provider.getGasPrice()).mul(110).div(100) // 90% of current gas price
    };
    
    console.log(`Using gas price: ${hre.ethers.utils.formatUnits(deploymentOptions.gasPrice, "gwei")} gwei`);
    console.log(`Using gas limit: ${deploymentOptions.gasLimit}`);
    
    const token = await AIFiToken.deploy(deploymentOptions);
    console.log("Waiting for deployment transaction confirmation...");
    await token.deployed();
    console.log(`AIFiToken deployed to: ${token.address}`);
    
    // Check token details
    const tokenName = await token.name();
    const tokenSymbol = await token.symbol();
    const tokenDecimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    
    console.log(`Token Name: ${tokenName}`);
    console.log(`Token Symbol: ${tokenSymbol}`);
    console.log(`Token Decimals: ${tokenDecimals}`);
    console.log(`Total Supply: ${hre.ethers.utils.formatUnits(totalSupply, tokenDecimals)} ${tokenSymbol}`);
    
    // Get contract instances
    const AIFiLendingPool = await hre.ethers.getContractFactory("AIFiLendingPool");
    const AIFiRemittance = await hre.ethers.getContractFactory("AIFiRemittance");
    
    const lendingPool = AIFiLendingPool.attach(lendingPoolAddress);
    const remittance = AIFiRemittance.attach(remittanceAddress);
    
    // Add token to lending pool
    console.log("\n--- Adding token to AIFiLendingPool ---");
    const addTx1 = await lendingPool.addSupportedToken(
      token.address,
      { gasLimit: 200000 }
    );
    console.log(`Transaction submitted: ${addTx1.hash}`);
    console.log("Waiting for transaction confirmation...");
    await addTx1.wait();
    console.log(`Token added to AIFiLendingPool`);
    
    // Add token to remittance
    console.log("\n--- Adding token to AIFiRemittance ---");
    const addTx2 = await remittance.addSupportedToken(
      token.address,
      { gasLimit: 200000 }
    );
    console.log(`Transaction submitted: ${addTx2.hash}`);
    console.log("Waiting for transaction confirmation...");
    await addTx2.wait();
    console.log(`Token added to AIFiRemittance`);
    
    // Approve spending for contracts
    console.log("\n--- Approving contracts to spend tokens ---");
    const approveTx1 = await token.approve(
      lendingPoolAddress, 
      hre.ethers.utils.parseUnits("1000000", tokenDecimals),
      { gasLimit: 100000 }
    );
    console.log(`Approval transaction submitted: ${approveTx1.hash}`);
    console.log("Waiting for transaction confirmation...");
    await approveTx1.wait();
    console.log(`LendingPool approval completed`);
    
    const approveTx2 = await token.approve(
      remittanceAddress,
      hre.ethers.utils.parseUnits("1000000", tokenDecimals),
      { gasLimit: 100000 }
    );
    console.log(`Approval transaction submitted: ${approveTx2.hash}`);
    console.log("Waiting for transaction confirmation...");
    await approveTx2.wait();
    console.log(`Remittance approval completed`);
    
    console.log("\n--- AIFi Token Setup Complete ---");
    console.log(`Token Address: ${token.address}`);
    console.log(`Token Symbol: ${tokenSymbol}`);
    console.log("The token has been added to both the lending pool and remittance contracts");
    console.log("You can now test deposits, borrowing, and remittances with this token");
    
    // Save token information
    const tokenInfo = {
      address: token.address,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals.toString(),
      totalSupply: totalSupply.toString(),
      deployedBy: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      './token-info.json',
      JSON.stringify(tokenInfo, null, 2)
    );
    console.log("\nToken information saved to token-info.json");
    
    return token.address;
  } catch (error) {
    console.error("Setup failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main; 