import { ethers } from "hardhat";
import { addresses } from "./addresses";

async function main() {

  const [signer_deployer, signer_mom, signer_dad, signer_staking, signer_vesting, signer_nft] = await ethers.getSigners();

  const mom = await ethers.getContractAt("MOMToken", addresses.contracts.mom);
  const dad = await ethers.getContractAt("DADToken", addresses.contracts.dad);
  const staking = await ethers.getContractAt("Staking", addresses.contracts.staking);
  const vesting = await ethers.getContractAt("Vesting", addresses.contracts.vesting);
  const nft = await ethers.getContractAt("OdysseyNFT",addresses.contracts.nft);
  
  await mom.revokeRole(await mom.MINTER_ROLE(), signer_deployer.address);
  await mom.revokeRole(await mom.BURNER_ROLE(), signer_deployer.address);
  await mom.grantRole(await mom.DEFAULT_ADMIN_ROLE(), signer_mom.address);
  await mom.connect(signer_mom).revokeRole(await mom.DEFAULT_ADMIN_ROLE(), signer_deployer.address);
  console.log("MOM roles updated");

  await dad.revokeRole(await dad.MINTER_ROLE(), signer_deployer.address);
  await dad.revokeRole(await dad.BURNER_ROLE(), signer_deployer.address);
  await dad.revokeRole(await dad.TRANSFER_ROLE(), signer_deployer.address);
  await dad.grantRole(await dad.DEFAULT_ADMIN_ROLE(), signer_dad.address);
  await dad.connect(signer_dad).revokeRole(await dad.DEFAULT_ADMIN_ROLE(), signer_deployer.address);
  console.log("DAD roles updated");
  
  await staking.revokeRole(await staking.MANAGER_ROLE(), signer_deployer.address);
  await staking.grantRole(await staking.DEFAULT_ADMIN_ROLE(), signer_staking.address);
  await staking.connect(signer_staking).revokeRole(await staking.DEFAULT_ADMIN_ROLE(), signer_deployer.address);
  console.log("Staking roles updated");

  await vesting.revokeRole(await vesting.UPDATER_ROLE(), signer_deployer.address);
  await vesting.grantRole(await vesting.DEFAULT_ADMIN_ROLE(), signer_vesting.address);
  await vesting.connect(signer_vesting).revokeRole(await vesting.DEFAULT_ADMIN_ROLE(), signer_deployer.address);
  console.log("Vesting roles updated");

  await nft.transferOwnership(signer_nft.address);
  console.log("NFT Ownership updated");

}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
