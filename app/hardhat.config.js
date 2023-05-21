require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

const mnemonic = process.env["MNEMONIC"];
const infuraProjectId = process.env["INFURA_PROJECT_ID"];
const pkey = process.env["PRIVATE_KEY"];

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

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// 0x0198Ad341DB1b4aa530c18434d17eECEb5751968
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
      // url: '',
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${infuraProjectId}`,
      from: '0xb88Fa59fFE4a75578393b64Ad1005987B25D0b8f',
      chainId: 11155111,
      accounts: [pkey]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 300
      }
    }
  },
};
