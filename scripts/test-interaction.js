// Script to test interactions with deployed contracts
const hre = require("hardhat");

async function main() {
  try {
    const [deployer, user1] = await hre.ethers.getSigners();
    console.log("Testing with accounts:");
    console.log("- Deployer:", deployer.address);
    console.log("- User1:", user1.address);
    
    // Contract addresses - replace with your deployed addresses
    const addresses = {
      aiRiskOracle: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      aifiLendingPool: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
      aifiRemittance: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
      aifiVoiceInterface: "0x9A676e781A523b5d0C0e43731313A708CB607508"
    };
    
    // Get contract instances
    const aiRiskOracle = await hre.ethers.getContractAt("AIRiskOracle", addresses.aiRiskOracle);
    const aifiLendingPool = await hre.ethers.getContractAt("AIFiLendingPool", addresses.aifiLendingPool);
    const aifiRemittance = await hre.ethers.getContractAt("AIFiRemittance", addresses.aifiRemittance);
    const aifiVoiceInterface = await hre.ethers.getContractAt("AIFiVoiceInterface", addresses.aifiVoiceInterface);
    
    console.log("\n--- Testing AIRiskOracle ---");
    // Check if user1 has a risk tier set (should return "MEDIUM" as default)
    const riskTier = await aiRiskOracle.checkRiskTierPublic(user1.address);
    console.log(`Risk tier for ${user1.address}: ${riskTier}`);
    
    console.log("\n--- Testing AIFiVoiceInterface ---");
    // Test retrieving a registered command
    const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
    const commandInfo = await aifiVoiceInterface.getAction(sendCommandHash);
    console.log("Command info:");
    console.log("- Target contract:", commandInfo.targetContract);
    console.log("- Function selector:", commandInfo.functionSelector);
    console.log("- Description:", commandInfo.description);
    console.log("- Active:", commandInfo.active);
    
    // Verify the target contract is correct
    console.log(`Target matches AIFiRemittance? ${commandInfo.targetContract === addresses.aifiRemittance}`);
    
    // Test supported languages
    const isEnglishSupported = await aifiVoiceInterface.supportedLanguages("en");
    const isSpanishSupported = await aifiVoiceInterface.supportedLanguages("es");
    console.log(`English supported: ${isEnglishSupported}`);
    console.log(`Spanish supported: ${isSpanishSupported}`);
    
    console.log("\n--- Testing AIFiRemittance ---");
    // Check default fee
    const defaultFee = await aifiRemittance.defaultFee();
    console.log(`Default remittance fee: ${defaultFee} basis points (${defaultFee/100}%)`);
    
    // Add a test token
    const tx = await aifiRemittance.addSupportedToken(deployer.address); // Using deployer address as mock token
    await tx.wait();
    
    // Verify token was added
    const isTokenSupported = await aifiRemittance.supportedTokens(deployer.address);
    console.log(`Test token added: ${isTokenSupported}`);
    
    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Testing failed with error:");
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