require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Rootstock testnet
    testnet: {
      url: "https://public-node.testnet.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31,
      gasMultiplier: 1.25
    },
    // Rootstock mainnet
    mainnet: {
      url: "https://public-node.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 30,
      gasMultiplier: 1.25
    },
    // Local development
    localhost: {
      url: "http://localhost:8545",
      gasPrice: 20000000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    // RSK Explorer API
    apiKey: {
      testnet: process.env.EXPLORER_API_KEY || "",
      mainnet: process.env.EXPLORER_API_KEY || ""
    },
    customChains: [
      {
        network: "testnet",
        chainId: 31,
        urls: {
          apiURL: "https://explorer.testnet.rsk.co/api",
          browserURL: "https://explorer.testnet.rsk.co"
        }
      },
      {
        network: "mainnet",
        chainId: 30,
        urls: {
          apiURL: "https://explorer.rsk.co/api",
          browserURL: "https://explorer.rsk.co"
        }
      }
    ]
  }
}; 