// Complete deployment script for AIFi contracts
const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

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
    const aifiRemittance = await AIFiRemittance.deploy(deployer.address); // Treasury is deployer address
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
    
    // English commands
    const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
    await aifiVoiceInterface.registerAction(
      sendCommandHash,
      aifiRemittance.address,
      sendSelector,
      "Send money to a recipient"
    );
    console.log("Registered 'send money' command (EN)");

    const depositCommandHash = await aifiVoiceInterface.generateCommandHash("en", "deposit {amount} {token}");
    await aifiVoiceInterface.registerAction(
      depositCommandHash,
      aifiLendingPool.address,
      depositSelector,
      "Deposit tokens to the lending pool"
    );
    console.log("Registered 'deposit' command (EN)");

    // Spanish commands
    const sendCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "enviar dinero a {recipient}");
    await aifiVoiceInterface.registerAction(
      sendCommandHashES,
      aifiRemittance.address,
      sendSelector,
      "Enviar dinero a un destinatario"
    );
    console.log("Registered 'enviar dinero' command (ES)");

    const depositCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "depositar {amount} {token}");
    await aifiVoiceInterface.registerAction(
      depositCommandHashES,
      aifiLendingPool.address,
      depositSelector,
      "Depositar tokens en el pool de préstamos"
    );
    console.log("Registered 'depositar' command (ES)");

    // 7. Summary
    console.log("\n--- Deployment Summary ---");
    console.log("AIRiskOracle:        ", aiRiskOracle.address);
    console.log("AIFiLendingPool:     ", aifiLendingPool.address);
    console.log("AIFiRemittance:      ", aifiRemittance.address);
    console.log("AIFiVoiceInterface:  ", aifiVoiceInterface.address);
    console.log("\nAll contracts deployed successfully!");
    
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