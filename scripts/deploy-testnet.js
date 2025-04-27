// Script for deploying AIFi contracts to Rootstock testnet
const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying to Rootstock Testnet with account:", deployer.address);
    
    const balanceWei = await deployer.getBalance();
    const balanceRBTC = hre.ethers.utils.formatEther(balanceWei);
    console.log(`Account balance: ${balanceRBTC} RBTC`);
    
    // Confirm proceeding with deployment
    console.log("\nDeploying contracts to Rootstock Testnet...");
    
    // Deployment settings for Rootstock
    const deploymentOptions = {
      gasLimit: 6000000,
      gasPrice: await hre.ethers.provider.getGasPrice()
    };
    
    console.log(`Using gas price: ${hre.ethers.utils.formatUnits(deploymentOptions.gasPrice, "gwei")} gwei`);
    
    // 1. Deploy AIRiskOracle
    console.log("\n--- Deploying AIRiskOracle ---");
    const AIRiskOracle = await hre.ethers.getContractFactory("AIRiskOracle");
    const aiRiskOracle = await AIRiskOracle.deploy(
      deployer.address, 
      { gasPrice: deploymentOptions.gasPrice }
    );
    console.log("Waiting for deployment transaction confirmation...");
    await aiRiskOracle.deployed();
    console.log("AIRiskOracle deployed to:", aiRiskOracle.address);
    
    // 2. Deploy AIFiLendingPool
    console.log("\n--- Deploying AIFiLendingPool ---");
    const AIFiLendingPool = await hre.ethers.getContractFactory("AIFiLendingPool");
    const aifiLendingPool = await AIFiLendingPool.deploy(
      aiRiskOracle.address,
      { gasPrice: deploymentOptions.gasPrice }
    );
    console.log("Waiting for deployment transaction confirmation...");
    await aifiLendingPool.deployed();
    console.log("AIFiLendingPool deployed to:", aifiLendingPool.address);
    
    // 3. Authorize the AIFiLendingPool to call the AIRiskOracle
    console.log("\n--- Setting up permissions ---");
    const authTx = await aiRiskOracle.authorizeCaller(
      aifiLendingPool.address,
      { gasPrice: deploymentOptions.gasPrice }
    );
    console.log("Authorization transaction submitted:", authTx.hash);
    console.log("Waiting for transaction confirmation...");
    await authTx.wait();
    console.log("AIFiLendingPool authorized to call AIRiskOracle");
    
    // 4. Deploy AIFiRemittance
    console.log("\n--- Deploying AIFiRemittance ---");
    const AIFiRemittance = await hre.ethers.getContractFactory("AIFiRemittance");
    const aifiRemittance = await AIFiRemittance.deploy(
      deployer.address, // Treasury is deployer address for now
      { gasPrice: deploymentOptions.gasPrice }
    );
    console.log("Waiting for deployment transaction confirmation...");
    await aifiRemittance.deployed();
    console.log("AIFiRemittance deployed to:", aifiRemittance.address);
    
    // 5. Deploy AIFiVoiceInterface
    console.log("\n--- Deploying AIFiVoiceInterface ---");
    const AIFiVoiceInterface = await hre.ethers.getContractFactory("AIFiVoiceInterface");
    const aifiVoiceInterface = await AIFiVoiceInterface.deploy(
      { gasPrice: deploymentOptions.gasPrice }
    );
    console.log("Waiting for deployment transaction confirmation...");
    await aifiVoiceInterface.deployed();
    console.log("AIFiVoiceInterface deployed to:", aifiVoiceInterface.address);
    
    // 6. Register voice commands
    console.log("\n--- Registering voice commands ---");
    
    // Function selectors
    const sendSelector = "0x" + Buffer.from("initiateTransfer(address,uint256,string,string,string)").slice(0, 4).toString("hex");
    const depositSelector = "0x" + Buffer.from("deposit(address,uint256)").slice(0, 4).toString("hex");
    
    // English commands
    console.log("Registering English commands...");
    const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
    await (await aifiVoiceInterface.registerAction(
      sendCommandHash,
      aifiRemittance.address,
      sendSelector,
      "Send money to a recipient",
      { gasPrice: deploymentOptions.gasPrice }
    )).wait();
    
    const depositCommandHash = await aifiVoiceInterface.generateCommandHash("en", "deposit {amount} {token}");
    await (await aifiVoiceInterface.registerAction(
      depositCommandHash,
      aifiLendingPool.address,
      depositSelector,
      "Deposit tokens to the lending pool",
      { gasPrice: deploymentOptions.gasPrice }
    )).wait();
    
    // Spanish commands
    console.log("Registering Spanish commands...");
    const sendCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "enviar dinero a {recipient}");
    await (await aifiVoiceInterface.registerAction(
      sendCommandHashES,
      aifiRemittance.address,
      sendSelector,
      "Enviar dinero a un destinatario",
      { gasPrice: deploymentOptions.gasPrice }
    )).wait();
    
    const depositCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "depositar {amount} {token}");
    await (await aifiVoiceInterface.registerAction(
      depositCommandHashES,
      aifiLendingPool.address,
      depositSelector,
      "Depositar tokens en el pool de préstamos",
      { gasPrice: deploymentOptions.gasPrice }
    )).wait();
    
    console.log("All voice commands registered successfully");
    
    // 7. Summary
    console.log("\n--- Deployment Summary ---");
    console.log("Network:             Rootstock Testnet");
    console.log("AIRiskOracle:        ", aiRiskOracle.address);
    console.log("AIFiLendingPool:     ", aifiLendingPool.address);
    console.log("AIFiRemittance:      ", aifiRemittance.address);
    console.log("AIFiVoiceInterface:  ", aifiVoiceInterface.address);
    console.log("\nDeployment to Rootstock Testnet completed successfully!");
    
    // Save contract addresses to a file for future reference
    const fs = require('fs');
    const deploymentInfo = {
      network: "rsk_testnet",
      chainId: 31,
      contracts: {
        AIRiskOracle: aiRiskOracle.address,
        AIFiLendingPool: aifiLendingPool.address,
        AIFiRemittance: aifiRemittance.address,
        AIFiVoiceInterface: aifiVoiceInterface.address
      },
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      './deployment-testnet.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\nDeployment information saved to deployment-testnet.json");
    
    // Return addresses for testing
    return {
      aiRiskOracle: aiRiskOracle.address,
      aifiLendingPool: aifiLendingPool.address,
      aifiRemittance: aifiRemittance.address,
      aifiVoiceInterface: aifiVoiceInterface.address
    };
  } catch (error) {
    console.error("Deployment failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main; 