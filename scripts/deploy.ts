import { ethers } from 'hardhat';

async function main() {
  const MyContract = await ethers.getContractFactory('OdysseyNFT');
  const accounts = await ethers.getSigners();
  const account = accounts[0];


  const contractInstance = await MyContract.deploy(
    "OdysseyNFT", 
    "ODS",
    21000,
    21000,
    "http://IPFS/url"
  );

  await contractInstance.deployed();

  console.log(`Contract deployed at address: ${contractInstance}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
