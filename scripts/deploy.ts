import { ethers, upgrades } from "hardhat";

async function main() {

  const initialSupply = ethers.utils.parseEther("1000000");

  const MOMToken = await ethers.getContractFactory("MOMToken");
  const momToken = await MOMToken.deploy(initialSupply);
  await momToken.deployed();

  const DADToken = await ethers.getContractFactory("DADToken");
  const dadToken = await DADToken.deploy();
  await dadToken.deployed();
  
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await upgrades.deployProxy(Staking, [momToken.address, dadToken.address],
     { initializer: "initialize", kind: "uups"});
    await staking.deployed();

  const Nft = await ethers.getContractFactory('OdysseyNFT');
  const nft = await Nft.deploy(
    "OdysseyNFT", 
    "ODS",
    21000,
    "http://IPFS/url"
  );
  await nft.deployed();

  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(momToken.address, dadToken.address, 10000);
  await faucet.deployed();

  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`DAD Token deployed to ${dadToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`Staking deployed to ${staking.address}`);
  console.log(`NFT deployed to ${nft.address}`);
  console.log(`Faucet deployed to ${faucet.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
