// Script to verify deployed contracts on Rootstock explorer
const { run } = require("hardhat");
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
    
    console.log("Starting contract verification on Rootstock Testnet...");
    
    // Verify AIRiskOracle
    console.log("\nVerifying AIRiskOracle...");
    try {
      await run("verify:verify", {
        address: riskOracleAddress,
        constructorArguments: [deploymentInfo.deployer],
        network: deploymentInfo.network
      });
      console.log("AIRiskOracle verified successfully!");
    } catch (error) {
      console.error("Error verifying AIRiskOracle:", error.message);
    }
    
    // Verify AIFiLendingPool
    console.log("\nVerifying AIFiLendingPool...");
    try {
      await run("verify:verify", {
        address: lendingPoolAddress,
        constructorArguments: [riskOracleAddress],
        network: deploymentInfo.network
      });
      console.log("AIFiLendingPool verified successfully!");
    } catch (error) {
      console.error("Error verifying AIFiLendingPool:", error.message);
    }
    
    // Verify AIFiRemittance
    console.log("\nVerifying AIFiRemittance...");
    try {
      await run("verify:verify", {
        address: remittanceAddress,
        constructorArguments: [deploymentInfo.deployer], // Treasury is deployer address
        network: deploymentInfo.network
      });
      console.log("AIFiRemittance verified successfully!");
    } catch (error) {
      console.error("Error verifying AIFiRemittance:", error.message);
    }
    
    // Verify AIFiVoiceInterface
    console.log("\nVerifying AIFiVoiceInterface...");
    try {
      await run("verify:verify", {
        address: voiceInterfaceAddress,
        constructorArguments: [],
        network: deploymentInfo.network
      });
      console.log("AIFiVoiceInterface verified successfully!");
    } catch (error) {
      console.error("Error verifying AIFiVoiceInterface:", error.message);
    }
    
    console.log("\nContract verification process completed.");
    console.log("You can now view your verified contracts on the Rootstock Explorer:");
    console.log(`https://explorer.testnet.rsk.co/address/${riskOracleAddress}`);
    console.log(`https://explorer.testnet.rsk.co/address/${lendingPoolAddress}`);
    console.log(`https://explorer.testnet.rsk.co/address/${remittanceAddress}`);
    console.log(`https://explorer.testnet.rsk.co/address/${voiceInterfaceAddress}`);
    
  } catch (error) {
    console.error("Verification failed with error:");
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