import {ethers, upgrades} from "hardhat";
import {addresses} from "./addresses";
import {time} from "@nomicfoundation/hardhat-network-helpers";


async function main() {

    //Initial supply to be minted.
    const initialSupply = ethers.utils.parseEther("0");

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();
    await dadToken.deployed();
    console.log(`DAD Token deployed to ${dadToken.address}`);

    const starting_date = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + time.duration.days(365);
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
        "https://play.odyssey.org/api/v4/nft/"
    );
    await nft.deployed();
    console.log(`NFT deployed to ${nft.address}`);

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await upgrades.deployProxy(Staking, [momToken.address, dadToken.address, nft.address, addresses.wallets.treasury],
        {initializer: "initialize", kind: "uups"});
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
    await momToken.grantRole(momToken.MINTER_ROLE(), staking.address);
    console.log("Staking roles set");

    await vesting.set_mom_address(momToken.address);
    console.log("MOM address set on vesting contract");

    const staking_ = await ethers.getContractAt("Staking", staking.address);
    console.log(staking_.address);
    console.log("1");
    await staking_.grantRole(await staking_.MANAGER_ROLE(), "0x297c363A95e8ac2EbD7e98f004e0fc9Ba33cF81c");
  console.log("2");
    const NodeManagement = await ethers.getContractFactory("NodeManagement");
  console.log("3");

    const nodeManagement = await upgrades.deployProxy(NodeManagement, [ nft.address, addresses.wallets.treasury, 10, 20, momToken.address],
        {initializer: "initialize", kind: "uups"});

  console.log("4");
    await nodeManagement.deployed();
  console.log("5");
    console.log(`Node Mgmt deployed to ${nodeManagement.address}`);

    // const nodeManagement = await upgrades.upgradeProxy("0x5178df50BE2021A00C285637b6e78Ae51D1C50a5",NodeManagement);
    // await nodeManagement.deployed();
    // console.log(`Node Mgmt upgraded at ${nodeManagement.address}`);
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(momToken.address, dadToken.address, 10000);
  await faucet.deployed();

  console.log(`MOM Token deployed to ${momToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`DAD Token deployed to ${dadToken.address} with Initial Supply of ${initialSupply}`);
  console.log(`Staking deployed to ${staking.address}`);
  console.log(`NFT deployed to ${nft.address}`);
  console.log(`Faucet deployed to ${faucet.address}`);
  console.log(`Node Mgmt deployed to ${nodeManagement.address}`);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
