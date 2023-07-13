import { ethers } from "hardhat";
import { addresses } from "./addresses";

async function main() {
  const [signer_deployer, signer_mom] = await ethers.getSigners();
  
  const USERS = ethers.utils.parseEther("");
  const PARTNERS = ethers.utils.parseEther("");
  const EXCHANGES = ethers.utils.parseEther("");
  const FOUNDERS_TEAM = ethers.utils.parseEther("");
  const SEED_SALES = ethers.utils.parseEther("");
  const PRIVATE_SALES = ethers.utils.parseEther("");
 
  const mom = await ethers.getContractAt("MOMToken", addresses.contracts.mom);
  
  await mom.connect(signer_mom).mint(addresses.wallets.users, USERS);
  console.log(`Minted ${USERS} to Users cap, address ${addresses.wallets.users}`);

  await mom.connect(signer_mom).mint(addresses.wallets.partners, PARTNERS);
  console.log(`Minted ${PARTNERS} to Partners cap, address ${addresses.wallets.partners}`);

  await mom.connect(signer_mom).mint(addresses.wallets.exchanges, EXCHANGES);
  console.log(`Minted ${EXCHANGES} to Exchanges, address ${addresses.wallets.exchanges}`);

  await mom.connect(signer_mom).mint(addresses.wallets.seed_sales, SEED_SALES);
  console.log(`Minted ${SEED_SALES} to Seed Sales cap, address ${addresses.wallets.seed_sales}`);

  await mom.connect(signer_mom).mint(addresses.wallets.private_sales, PRIVATE_SALES);
  console.log(`Minted ${PRIVATE_SALES} to Private Sales cap, address ${addresses.wallets.private_sales}`);

}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
