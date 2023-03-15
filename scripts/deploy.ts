import { ethers } from "hardhat";

async function main() {

  const initialSupply = ethers.utils.parseEther("1000000");

  const MOMToken = await ethers.getContractFactory("MOMToken");
  const momToken = await MOMToken.deploy(initialSupply);

  const DADToken = await ethers.getContractFactory("DADToken");
  const dadToken = await DADToken.deploy();

  await momToken.deployed();
  await dadToken.deployed();

  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`DAD Token deployed to ${dadToken.address} with Initial Supply of ${initialSupply}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
