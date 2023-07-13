import { ethers, upgrades } from "hardhat";
import { addresses } from "./addresses";

async function main() {

  //Initial supply to be minted.
  const initialSupply = ethers.utils.parseEther("0");

  const DADToken = await ethers.getContractFactory("DADToken");
  const dadToken = await DADToken.deploy();
  await dadToken.deployed();
  console.log(`DAD Token deployed to ${dadToken.address}`);

  const starting_date = 0;//TBD (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + DAYS;
  const Vesting = await ethers.getContractFactory("Vesting");
  const vesting = await Vesting.deploy(dadToken.address, starting_date);
  await vesting.deployed();
  console.log(`Vesting deployed to ${vesting.address}`);

  const MOMToken = await ethers.getContractFactory("MOMToken");
  const momToken = await MOMToken.deploy(initialSupply, vesting.address, dadToken.address);
  await momToken.deployed();
  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  
  const Nft = await ethers.getContractFactory('OdysseyNFT');
  const nft = await Nft.deploy(
    "Odysseys", 
    "ONFT",
    "http://IPFS/url"
    );
    await nft.deployed();
  console.log(`NFT deployed to ${nft.address}`);
  
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await upgrades.deployProxy(Staking, [momToken.address, dadToken.address, nft.address, addresses.wallets.treasury],
     { initializer: "initialize", kind: "uups"});
  await staking.deployed();
  console.log(`Staking deployed to ${staking.address}`);

  // Vesting can burn DAD and mint MOM
  await dadToken.grantRole(dadToken.BURNER_ROLE(), vesting.address);
  await momToken.grantRole(momToken.MINTER_ROLE(), vesting.address);
  console.log("Vesting roles set");

  // MOM can mint DAD and update the vesting contract structures
  await dadToken.grantRole(dadToken.MINTER_ROLE(), momToken.address);
  await vesting.grantRole(vesting.UPDATER_ROLE(), momToken.address);
  console.log("MOM roles set");

  // Staking can transfer DADs
  await dadToken.grantRole(dadToken.TRANSFER_ROLE(), staking.address);
  console.log("Staking roles set");

  await vesting.set_mom_address(momToken.address);
  console.log("MOM address set on vesting contract");

}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
