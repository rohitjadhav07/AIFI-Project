// Script to test our simulated deployment
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  try {
    console.log("Testing simulated Rootstock deployment...");
    
    // Load deployment information
    const deploymentData = JSON.parse(fs.readFileSync('./deployment-simulated.json', 'utf8'));
    console.log(`Testing deployment from: ${deploymentData.timestamp}`);
    
    const addresses = deploymentData.contracts;
    
    // Get signers for testing
    const [deployer, user1] = await hre.ethers.getSigners();
    console.log(`Testing with accounts:\n- Deployer: ${deployer.address}\n- User1: ${user1.address}`);
    
    // Get contract instances
    const aiRiskOracle = await hre.ethers.getContractAt("AIRiskOracle", addresses.AIRiskOracle);
    const aifiLendingPool = await hre.ethers.getContractAt("AIFiLendingPool", addresses.AIFiLendingPool);
    const aifiRemittance = await hre.ethers.getContractAt("AIFiRemittance", addresses.AIFiRemittance);
    const aifiVoiceInterface = await hre.ethers.getContractAt("AIFiVoiceInterface", addresses.AIFiVoiceInterface);
    
    // ---------- Test AIRiskOracle ----------
    console.log("\n----- Testing AIRiskOracle -----");
    
    // Check owner
    const oracleOwner = await aiRiskOracle.owner();
    console.log(`Oracle owner: ${oracleOwner}`);
    console.log(`Owner is deployer: ${oracleOwner === deployer.address}`);
    
    // Check default risk tier for a user
    const userRiskTier = await aiRiskOracle.checkRiskTierPublic(user1.address);
    console.log(`Default risk tier for user: ${userRiskTier}`);
    
    // Check if lending pool is authorized
    const isAuthorized = await aiRiskOracle.authorizedCallers(addresses.AIFiLendingPool);
    console.log(`Lending pool is authorized caller: ${isAuthorized}`);
    
    // ---------- Test AIFiVoiceInterface ----------
    console.log("\n----- Testing AIFiVoiceInterface -----");
    
    // Check supported languages
    const englishSupported = await aifiVoiceInterface.supportedLanguages("en");
    const spanishSupported = await aifiVoiceInterface.supportedLanguages("es");
    console.log(`English supported: ${englishSupported}`);
    console.log(`Spanish supported: ${spanishSupported}`);
    
    // Test registered commands
    const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
    const commandInfo = await aifiVoiceInterface.getAction(sendCommandHash);
    
    console.log("Send money command info:");
    console.log(`- Target contract: ${commandInfo.targetContract}`);
    console.log(`- Target is remittance contract: ${commandInfo.targetContract === addresses.AIFiRemittance}`);
    console.log(`- Command is active: ${commandInfo.active}`);
    
    // ---------- Test AIFiRemittance ----------
    console.log("\n----- Testing AIFiRemittance -----");
    
    // Check default fee
    const defaultFee = await aifiRemittance.defaultFee();
    console.log(`Default remittance fee: ${defaultFee} basis points (${defaultFee/100}%)`);
    
    // Check treasury address
    const treasury = await aifiRemittance.treasury();
    console.log(`Treasury address: ${treasury}`);
    console.log(`Treasury is deployer: ${treasury === deployer.address}`);
    
    // ---------- Test AIFiLendingPool ----------
    console.log("\n----- Testing AIFiLendingPool -----");
    
    // Check risk oracle connection
    const riskOracle = await aifiLendingPool.riskAssessmentOracle();
    console.log(`Risk oracle address: ${riskOracle}`);
    console.log(`Oracle address matches deployment: ${riskOracle === addresses.AIRiskOracle}`);
    
    // Check interest rates
    const lowRiskRate = await aifiLendingPool.interestRates(0); // LOW = 0
    const mediumRiskRate = await aifiLendingPool.interestRates(1); // MEDIUM = 1
    const highRiskRate = await aifiLendingPool.interestRates(2); // HIGH = 2
    
    console.log(`Interest rates:`);
    console.log(`- Low risk: ${lowRiskRate} basis points (${lowRiskRate/100}%)`);
    console.log(`- Medium risk: ${mediumRiskRate} basis points (${mediumRiskRate/100}%)`);
    console.log(`- High risk: ${highRiskRate} basis points (${highRiskRate/100}%)`);
    
    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the tests
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main; 