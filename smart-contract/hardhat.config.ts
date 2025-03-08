import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      chainId: 80001,
      url: process.env.RPC_URL,
      accounts: [process.env.MUMBAI_PRIVATE_KEY as string],
    },
    polygon: {
      chainId: 137,
      url: "https://polygon-rpc.com/",
      accounts: [process.env.POLYGON_PRIVATE_KEY as string],
    },
  },
  namedAccounts: {
    // Names for accounts slots for each network
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGON_SCAN_API_KEY as string,
      polygon: process.env.POLYGON_SCAN_API_KEY as string,
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

export default config;
