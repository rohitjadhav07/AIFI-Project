// Script to interact with deployed AIFi contracts
const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  try {
    // Load deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-testnet.json', 'utf8'));
    console.log("Loaded deployment information from Rootstock Testnet");
    
    // Get contract addresses
    const riskOracleAddress = deploymentInfo.contracts.AIRiskOracle;
    const lendingPoolAddress = deploymentInfo.contracts.AIFiLendingPool;
    const remittanceAddress = deploymentInfo.contracts.AIFiRemittance;
    const voiceInterfaceAddress = deploymentInfo.contracts.AIFiVoiceInterface;
    
    console.log("Connecting to contracts on Rootstock Testnet...");
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`Using account: ${signer.address}`);
    
    // Get contract instances
    const AIRiskOracle = await ethers.getContractFactory("AIRiskOracle");
    const AIFiLendingPool = await ethers.getContractFactory("AIFiLendingPool");
    const AIFiRemittance = await ethers.getContractFactory("AIFiRemittance");
    const AIFiVoiceInterface = await ethers.getContractFactory("AIFiVoiceInterface");
    
    const riskOracle = AIRiskOracle.attach(riskOracleAddress);
    const lendingPool = AIFiLendingPool.attach(lendingPoolAddress);
    const remittance = AIFiRemittance.attach(remittanceAddress);
    const voiceInterface = AIFiVoiceInterface.attach(voiceInterfaceAddress);
    
    console.log("Contracts connected successfully");
    
    // Check if deployment was successful
    console.log("\n--- Basic Contract Information ---");
    
    // Check Risk Oracle
    console.log("\nAIRiskOracle:");
    const oracleUpdater = await riskOracle.aiOracleUpdater();
    console.log(`- Oracle Updater: ${oracleUpdater}`);
    
    // Check Lending Pool
    console.log("\nAIFiLendingPool:");
    const lendingPoolOracle = await lendingPool.riskAssessmentOracle();
    console.log(`- Risk Oracle: ${lendingPoolOracle}`);
    const lowRiskRate = await lendingPool.interestRates(0); // LOW risk tier
    console.log(`- Low Risk Interest Rate: ${lowRiskRate} basis points`);
    
    // Check Remittance
    console.log("\nAIFiRemittance:");
    const treasury = await remittance.treasury();
    console.log(`- Treasury: ${treasury}`);
    const defaultFee = await remittance.defaultFee();
    console.log(`- Default Fee: ${defaultFee} basis points`);
    
    // Check Voice Interface
    console.log("\nAIFiVoiceInterface:");
    const enSupported = await voiceInterface.supportedLanguages("en");
    const esSupported = await voiceInterface.supportedLanguages("es");
    console.log(`- Supports English: ${enSupported}`);
    console.log(`- Supports Spanish: ${esSupported}`);
    
    console.log("\n--- Contract Verification Complete ---");
    
    // Interacting with contracts
    console.log("\nWould you like to perform any of these actions?");
    console.log("1. Add a test token to the lending pool");
    console.log("2. Query a user's risk tier");
    console.log("3. Calculate a remittance fee");
    console.log("4. Get voice command information");
    console.log("\nTo perform these actions, run this script with arguments, e.g.:");
    console.log("npx hardhat run scripts/interact.js --network testnet -- action=1");
    
    // Add more interactive logic as needed
  } catch (error) {
    console.error("Interaction failed with error:");
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