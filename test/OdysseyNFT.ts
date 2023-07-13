import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers} from "hardhat";

const name = 'Odyssey_NFT';
const symbol = 'ODS';
const URI =  "ipfs://";
const odyssey_1_id = "604472133179351442128897";
const odyssey_2_id = "604472133179351442128898";

// Avoid duplicated warning on StateUpdated event. (gone on V6)
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

describe("deploy contract", function() {
  async function deployContract() {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("OdysseyNFT");
    const OdysseyNFT = await contract.deploy(name, symbol, URI);

    return { OdysseyNFT, name, symbol, owner, addr1, addr2, addr3, addr4, URI };
  };

  describe('constructor', () => {
    it('should set the name and symbol of the token', async () => {
      const { OdysseyNFT, name, symbol } = await loadFixture(deployContract);
      expect(await OdysseyNFT.name()).to.equal(name);
      expect(await OdysseyNFT.symbol()).to.equal(symbol);
    });
  });

  describe('pauseMinting and unpauseMinting', () => {
    it('should pause and unpause minting', async () => {
      const { OdysseyNFT } = await loadFixture(deployContract);

      expect (await OdysseyNFT.paused()).to.be.false;

      await OdysseyNFT.pause();
    
      expect (await OdysseyNFT.paused()).to.be.true;

      await OdysseyNFT.unpause();

      expect (await OdysseyNFT.paused()).to.be.false;
    });
  });

  describe('mintNFT', () => {
    it('should mint a new NFT', async () => {
      const { OdysseyNFT, owner, addr3 } = await loadFixture(deployContract);

      await expect(await OdysseyNFT.connect(owner).safeMint(addr3.address)).to.emit(OdysseyNFT, "Transfer").withArgs(ethers.constants.AddressZero, addr3.address, await OdysseyNFT.currentId());
    });

    it('should mint not a new NFT to addres 0', async () => {
      const { OdysseyNFT, owner } = await loadFixture(deployContract);

      await expect(OdysseyNFT.connect(owner).safeMint(ethers.constants.AddressZero)).to.revertedWith("Cannot mint to address 0");
    });

    it("Should mint an NFT and set the correct token URI", async function () {
      const { OdysseyNFT, owner, addr4 } = await loadFixture(deployContract);
      await expect(await OdysseyNFT.connect(owner).safeMint(addr4.address)).to.emit(OdysseyNFT, "Transfer").withArgs(ethers.constants.AddressZero, addr4.address, await OdysseyNFT.currentId());
      await expect(await OdysseyNFT.tokenURI(await OdysseyNFT.currentId())).to.equal("ipfs://604472133179351442128897");
    });

    it("Should not mint an NFT if minting is paused", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

      await OdysseyNFT.pause();
      await expect(OdysseyNFT.connect(owner).safeMint(addr1.address)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("transferOdyssey", async function () {
    it("should transfer an OdysseyNFT from the owner to the buyer", async function () {
      const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);
  
      await OdysseyNFT.connect(owner).safeMint(owner.address);
      await OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, "604472133179351442128897");
      expect(await OdysseyNFT.ownerOf("604472133179351442128897")).to.equal(addr1.address);
    });

    it("should not allow transfer of non-existent OdysseyNFT", async () => {
      const { OdysseyNFT, addr1, addr2 } = await loadFixture(deployContract);
      expect (OdysseyNFT["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1)).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("contract paused", async function () {
    it("should revert with Contract is paused", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
      
      await OdysseyNFT.connect(owner).pause();
      expect(OdysseyNFT.connect(owner).safeMint(addr1.address)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("token burn", async function () {
    it("should burn the token", async () => {
      const { OdysseyNFT, owner, addr4 } = await loadFixture(deployContract);
      await OdysseyNFT.connect(owner).safeMint(addr4.address);
      await OdysseyNFT.connect(addr4).burn(odyssey_1_id);
      expect(await OdysseyNFT.exists(odyssey_1_id)).to.be.false;
    });

    it("should revert with token does not exist", async () => {
      const { OdysseyNFT } = await loadFixture(deployContract);
      expect(OdysseyNFT.burn(2)).to.be.revertedWith('token does not exist');
    });

    it("should revert if not owner or approved", async () => {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
      await OdysseyNFT.connect(owner).safeMint(addr1.address);
      await expect(OdysseyNFT.connect(owner).burn(odyssey_1_id)).to.revertedWith("caller is not token owner or approved");
    });
  });

  describe("token URI", async function () {
    it("should set the correct base URI", async function () {
      const { OdysseyNFT, owner, addr3, addr4 } = await loadFixture(deployContract);
      const ipfs = "ipfs://";
      const http = "http://";
      const before = "ipfs://" + odyssey_1_id;
      const after = "http://" + odyssey_2_id;

      await OdysseyNFT.connect(owner).safeMint(addr3.address);
      await expect(await OdysseyNFT.tokenURI(odyssey_1_id)).to.equal(before);
      await expect(await OdysseyNFT.connect(owner).setbaseURI("http://")).to.emit(OdysseyNFT, "StateUpdated(string,string,string)")
            .withArgs("Base URI", ipfs, http);
      await OdysseyNFT.connect(owner).safeMint(addr4.address);
      await expect(await OdysseyNFT.tokenURI(odyssey_2_id)).to.equal(after);
    });
  });
});
