import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

async function main() {

  const initialSupply = ethers.utils.parseEther("1000000");

  const MOMToken = await ethers.getContractFactory("MOMToken");
  const momToken = await MOMToken.deploy(initialSupply);

  const DADToken = await ethers.getContractFactory("DADToken");
  const dadToken = await DADToken.deploy();
  
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await upgrades.deployProxy(Staking, [momToken.address, dadToken.address],
     { initializer: "initialize", kind: "uups"});

  await momToken.deployed();
  await dadToken.deployed();
  await staking.deployed();
  
  
  
  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`DAD Token deployed to ${dadToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`Staking deployed to ${staking.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
