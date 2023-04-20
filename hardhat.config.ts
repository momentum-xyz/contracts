import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-docgen';

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  docgen: {
    pages: 'files',
  }
};

export default config;
