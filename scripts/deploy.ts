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

  const Nft = await ethers.getContractFactory('OdysseyNFT');
  const nft = await Nft.deploy(
    "OdysseyNFT", 
    "ODS",
    21000,
    "http://IPFS/url"
  );


  await momToken.deployed();
  await dadToken.deployed();
  await staking.deployed();
  await nft.deployed();
  
  
  
  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`DAD Token deployed to ${dadToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`Staking deployed to ${staking.address}`);
  console.log(`NFT deployed to ${nft.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
