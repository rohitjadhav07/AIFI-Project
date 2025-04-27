// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy AIRiskOracle with the deployer as the AI oracle updater initially
  const AIRiskOracle = await hre.ethers.getContractFactory("AIRiskOracle");
  const aiRiskOracle = await AIRiskOracle.deploy(deployer.address);
  await aiRiskOracle.deployed();
  console.log("AIRiskOracle deployed to:", aiRiskOracle.address);

  // Deploy AIFiLendingPool with the AIRiskOracle address
  const AIFiLendingPool = await hre.ethers.getContractFactory("AIFiLendingPool");
  const aifiLendingPool = await AIFiLendingPool.deploy(aiRiskOracle.address);
  await aifiLendingPool.deployed();
  console.log("AIFiLendingPool deployed to:", aifiLendingPool.address);

  // Authorize the AIFiLendingPool to call the AIRiskOracle
  const authTx = await aiRiskOracle.authorizeCaller(aifiLendingPool.address);
  await authTx.wait();
  console.log("AIFiLendingPool authorized to call AIRiskOracle");

  // Deploy AIFiRemittance with the deployer as the treasury initially
  const AIFiRemittance = await hre.ethers.getContractFactory("AIFiRemittance");
  const aifiRemittance = await AIFiRemittance.deploy(deployer.address);
  await aifiRemittance.deployed();
  console.log("AIFiRemittance deployed to:", aifiRemittance.address);

  // Deploy AIFiVoiceInterface
  const AIFiVoiceInterface = await hre.ethers.getContractFactory("AIFiVoiceInterface");
  const aifiVoiceInterface = await AIFiVoiceInterface.deploy();
  await aifiVoiceInterface.deployed();
  console.log("AIFiVoiceInterface deployed to:", aifiVoiceInterface.address);

  // Register some example voice commands in AIFiVoiceInterface
  // These would be processed by the NLP service and mapped to function calls

  // Example: "Send money to [recipient]"
  const sendCommandHash = await aifiVoiceInterface.generateCommandHash("en", "send money to {recipient}");
  const sendSelector = "0x" + Buffer.from("initiateTransfer(address,uint256,string,string,string)").slice(0, 4).toString("hex");
  await aifiVoiceInterface.registerAction(
    sendCommandHash,
    aifiRemittance.address,
    sendSelector,
    "Send money to a recipient"
  );
  console.log("Registered 'send money' command");

  // Example: "Deposit [amount] [token]"
  const depositCommandHash = await aifiVoiceInterface.generateCommandHash("en", "deposit {amount} {token}");
  const depositSelector = "0x" + Buffer.from("deposit(address,uint256)").slice(0, 4).toString("hex");
  await aifiVoiceInterface.registerAction(
    depositCommandHash,
    aifiLendingPool.address,
    depositSelector,
    "Deposit tokens to the lending pool"
  );
  console.log("Registered 'deposit' command");

  // Deploy the same commands in Spanish
  const sendCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "enviar dinero a {recipient}");
  await aifiVoiceInterface.registerAction(
    sendCommandHashES,
    aifiRemittance.address,
    sendSelector,
    "Enviar dinero a un destinatario"
  );
  console.log("Registered 'enviar dinero' command");

  const depositCommandHashES = await aifiVoiceInterface.generateCommandHash("es", "depositar {amount} {token}");
  await aifiVoiceInterface.registerAction(
    depositCommandHashES,
    aifiLendingPool.address,
    depositSelector,
    "Depositar tokens en el pool de préstamos"
  );
  console.log("Registered 'depositar' command");

  console.log("All contracts deployed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 