// Simple deployment script to test if contract deployment works
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // Deploy AIRiskOracle with the deployer as the AI oracle updater initially
  const AIRiskOracle = await hre.ethers.getContractFactory("AIRiskOracle");
  const aiRiskOracle = await AIRiskOracle.deploy(deployer.address);
  await aiRiskOracle.deployed();
  console.log("AIRiskOracle deployed to:", aiRiskOracle.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 