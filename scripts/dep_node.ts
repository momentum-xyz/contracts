import { ethers, upgrades } from "hardhat";
import { addresses } from "./addresses";
import { time } from "@nomicfoundation/hardhat-network-helpers";
// import {} from "../contracts/node/lib";

async function main() {

    const NodeManagement = await ethers.getContractFactory("NodeManagement");


    // const nodeManagement = await upgrades.deployProxy(NodeManagement,["0xbc48cb82903f537614E0309CaF6fe8cEeBa3d174", "0x83FfD8c86e7cC10544403220d857c66bF6CdF8B8", 10, 20, "0x457fd0Ee3Ce35113ee414994f37eE38518d6E7Ee"],
    //     { initializer: "initialize", kind: "uups"});
    // await nodeManagement.deployed();
    // console.log(`Node Mgmt deployed to ${nodeManagement.address}`);

    const nodeManagement = await upgrades.upgradeProxy("0x5178df50BE2021A00C285637b6e78Ae51D1C50a5",NodeManagement);
    await nodeManagement.deployed();
    console.log(`Node Mgmt upgraded at ${nodeManagement.address}`);

}



main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
