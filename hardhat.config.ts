import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import 'solidity-docgen';

const config: HardhatUserConfig = {
  solidity:  {
    version: "0.8.17",
    settings: { 
      optimizer: { 
        enabled: true,
        runs: 2
      }
    },
  },
  docgen: {
    pages: 'files',
  }
};

export default config;
