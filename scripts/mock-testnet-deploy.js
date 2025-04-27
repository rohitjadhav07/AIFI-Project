// Script for simulating deployment to Rootstock testnet (using local hardhat network)
const hre = require("hardhat");

async function main() {
  try {
    console.log("Simulating Rootstock Testnet deployment using local Hardhat network");
    console.log("This will use Hardhat's built-in accounts instead of requiring real RBTC");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balanceWei = await deployer.getBalance();
    const balance = hre.ethers.utils.formatEther(balanceWei);
    console.log(`Account balance: ${balance} ETH (simulated RBTC)`);
    
    // 1. Deploy AIRiskOracle
    console.log("\n--- Deploying AIRiskOracle ---");
    const AIRiskOracle = await hre.ethers.getContractFactory("AIRiskOracle");
    const aiRiskOracle = await AIRiskOracle.deploy(deployer.address);
    await aiRiskOracle.deployed();
    console.log("AIRiskOracle deployed to:", aiRiskOracle.address);
    
    // 2. Deploy AIFiLendingPool
    console.log("\n--- Deploying AIFiLendingPool ---");
    const AIFiLendingPool = await hre.ethers.getContractFactory("AIFiLendingPool");
    const aifiLendingPool = await AIFiLendingPool.deploy(aiRiskOracle.address);
    await aifiLendingPool.deployed();
    console.log("AIFiLendingPool deployed to:", aifiLendingPool.address);
    
    // 3. Authorize the AIFiLendingPool to call the AIRiskOracle
    console.log("\n--- Setting up permissions ---");
    const authTx = await aiRiskOracle.authorizeCaller(aifiLendingPool.address);
    await authTx.wait();
    console.log("AIFiLendingPool authorized to call AIRiskOracle");
    
    // 4. Deploy AIFiRemittance
    console.log("\n--- Deploying AIFiRemittance ---");
    const AIFiRemittance = await hre.ethers.getContractFactory("AIFiRemittance");
    const aifiRemittance = await AIFiRemittance.deploy(deployer.address);
    await aifiRemittance.deployed();
    console.log("AIFiRemittance deployed to:", aifiRemittance.address);
    
    // 5. Deploy AIFiVoiceInterface
    console.log("\n--- Deploying AIFiVoiceInterface ---");
    const AIFiVoiceInterface = await hre.ethers.getContractFactory("AIFiVoiceInterface");
    const aifiVoiceInterface = await AIFiVoiceInterface.deploy();
    await aifiVoiceInterface.deployed();
    console.log("AIFiVoiceInterface deployed to:", aifiVoiceInterface.address);
    
    // 6. Register voice commands
    console.log("\n--- Registering voice commands ---");
    
    // Function selectors
    const sendSelector = "0x" + Buffer.from("initiateTransfer(address,uint256,string,string,string)").slice(0, 4).toString("hex");
    const depositSelector = "0x" + Buffer.from("deposit(address,uint256)").slice(0, 4).toString("hex");
    
    // Register commands and wait for confirmations
    console.log("Registering English and Spanish commands...");
    
    // English commands
    const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
    await (await aifiVoiceInterface.registerAction(
      sendCommandHash,
      aifiRemittance.address,
      sendSelector,
      "Send money to a recipient"
    )).wait();
    
    const depositCommandHash = await aifiVoiceInterface.generateCommandHash("en", "deposit {amount} {token}");
    await (await aifiVoiceInterface.registerAction(
      depositCommandHash,
      aifiLendingPool.address,
      depositSelector,
      "Deposit tokens to the lending pool"
    )).wait();
    
    // Spanish commands
    const sendCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "enviar dinero a {recipient}");
    await (await aifiVoiceInterface.registerAction(
      sendCommandHashES,
      aifiRemittance.address,
      sendSelector,
      "Enviar dinero a un destinatario"
    )).wait();
    
    const depositCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "depositar {amount} {token}");
    await (await aifiVoiceInterface.registerAction(
      depositCommandHashES,
      aifiLendingPool.address,
      depositSelector,
      "Depositar tokens en el pool de préstamos"
    )).wait();
    
    // 7. Save deployment info
    console.log("\n--- Creating Deployment Summary ---");
    const fs = require('fs');
    const deploymentInfo = {
      network: "simulated_testnet",
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
      './deployment-simulated.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    // 8. Summary
    console.log("\n--- Deployment Summary ---");
    console.log("Network:             Simulated Rootstock Testnet");
    console.log("AIRiskOracle:        ", aiRiskOracle.address);
    console.log("AIFiLendingPool:     ", aifiLendingPool.address);
    console.log("AIFiRemittance:      ", aifiRemittance.address);
    console.log("AIFiVoiceInterface:  ", aifiVoiceInterface.address);
    console.log("\nDeployment information saved to deployment-simulated.json");
    console.log("\nSimulated testnet deployment completed successfully!");
    console.log("\nIMPORTANT: This was a simulation. For actual Rootstock testnet deployment:");
    console.log("1. Get testnet RBTC from https://faucet.rsk.co/");
    console.log("2. Add your private key to .env file");
    console.log("3. Run: npx hardhat run scripts/deploy-testnet.js --network testnet");
    
    return deploymentInfo;
  } catch (error) {
    console.error("Deployment simulation failed with error:");
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