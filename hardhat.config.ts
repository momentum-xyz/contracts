import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-docgen";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2
      }
    }
  },
  docgen: {
    pages: "files"
  },
  abiExporter: {
    runOnCompile: false,
    clear: true,
    format: "json",
    only: ["^contracts"],
    flat: true
  }
};

export default config;
