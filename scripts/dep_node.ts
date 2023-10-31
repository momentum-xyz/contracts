import { ethers, upgrades } from "hardhat";
import { addresses } from "./addresses";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// import {} from "../contracts/node/lib";

async function main() {

    const NodeManagement = await ethers.getContractFactory("NodeManagement");


    const nodeManagement = await upgrades.deployProxy(NodeManagement,["0x1F59C1db986897807d7c3eF295C3480a22FBa834", "0xE9ceA79CCA526C6847519D4263A56d4b03DcA7b9", "10000000000000000", "1000000000000000000", "0x0C270A47D5B00bb8db42ed39fa7D6152496944ca"],
        { initializer: "initialize", kind: "uups"});
    await nodeManagement.deployed();
    console.log(`Node Mgmt deployed to ${nodeManagement.address}`);

    // const nodeManagement = await upgrades.upgradeProxy("0x5178df50BE2021A00C285637b6e78Ae51D1C50a5",NodeManagement);
    // await nodeManagement.deployed();
    // console.log(`Node Mgmt upgraded at ${nodeManagement.address}`);

}



main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
