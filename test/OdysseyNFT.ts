import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers} from "hardhat";

const name = 'Odyssey_NFT';
const symbol = 'ODS';
const maxOdysseySupply = 21000;
const URI =  "ipfs://";

describe("deploy contract", function() {
  async function deployContract() {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("OdysseyNFT");
    const OdysseyNFT = await contract.deploy(name, symbol, maxOdysseySupply, URI);

    return { OdysseyNFT, name, symbol, maxOdysseySupply, owner, addr1, addr2, addr3, addr4, URI };
  };

  describe('constructor', () => {
    it('should set the name and symbol of the token', async () => {
      const { OdysseyNFT, name, symbol } = await loadFixture(deployContract);
      expect(await OdysseyNFT.name()).to.equal(name);
      expect(await OdysseyNFT.symbol()).to.equal(symbol);
    });

    it('should set the max supply', async () => {
      const { OdysseyNFT } = await loadFixture(deployContract);
      expect(await OdysseyNFT.maxTokens()).to.equal(maxOdysseySupply);
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
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

      await OdysseyNFT.connect(owner).safeMint(addr1.address, 1);
      expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("should fail to mint an NFT when the maximum number of NFTs per wallet have already been minted", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

      await expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.not.be.reverted;
      await expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Odyssey mints per wallet exceeded");
    });

    it("should fail to mint an NFT when the max supply is reached", async function () {
      const { OdysseyNFT, owner, addr1, addr2 } = await loadFixture(deployContract);

      OdysseyNFT.connect(owner).safeMint(addr1.address, 1);
      OdysseyNFT.connect(owner).setMaxTokens(1);

      await expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Max Odyssey supply reached");
    });

    it("Should mint an NFT and set the correct token URI", async function () {
      const { OdysseyNFT, owner, addr4 } = await loadFixture(deployContract);

      await OdysseyNFT.connect(owner).safeMint(addr4.address, 2);
      await expect(await OdysseyNFT.tokenURI(2)).to.equal("ipfs://2.json");
    });

    it("Should not mint an NFT if minting is paused", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

      await OdysseyNFT.pause();
      await expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("transferOdyssey", async function () {
    it("should transfer an OdysseyNFT from the owner to the buyer", async function () {
      const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);
  
      await OdysseyNFT.connect(owner).safeMint(owner.address, 1);
      await OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);
      expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("should not allow transfer of non-existent OdysseyNFT", async () => {
      const { OdysseyNFT, addr1, addr2 } = await loadFixture(deployContract);
      expect (OdysseyNFT["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1)).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("set max tokens that could be minted", async function () {
    it("should set the maximum amount of OdysseyNFT's which can be minted", async function () {
      const { OdysseyNFT, owner } = await loadFixture(deployContract);
  
      await OdysseyNFT.connect(owner).setMaxTokens(1000);
      // await OdysseyNFT.safeTransferFrom(owner.address, addr1.address, 1);
      expect(await OdysseyNFT.maxTokens()).to.equal(1000);
    });

    it("should revert with max odyssey supply reached", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
  
      await OdysseyNFT.connect(owner).setMaxTokens(1);
      expect (OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Max Odyssey supply reached");
    });
  });

  describe("contract paused", async function () {
    it("should revert with Contract is paused", async function () {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
      
      await OdysseyNFT.connect(owner).pause();
      expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("token already minted", async function () {
    it("should revert with token already minted", async () => {
      const { OdysseyNFT, owner, addr3, addr4 } = await loadFixture(deployContract);
        await expect (OdysseyNFT.connect(owner).safeMint(addr3.address, 1));
        await expect (OdysseyNFT.connect(owner).safeMint(addr4.address, 1)).to.be.revertedWith("ERC721: token already minted");
    });
  });

  describe("token burn", async function () {
    it("should burn the token", async () => {
      const { OdysseyNFT, owner, addr4 } = await loadFixture(deployContract);
      await OdysseyNFT.connect(owner).safeMint(addr4.address, 6);
      await OdysseyNFT.connect(addr4).burn(6);
      expect(await OdysseyNFT.exists(6)).to.be.false;
    });

    it("should revert with token does not exist", async () => {
      const { OdysseyNFT } = await loadFixture(deployContract);
      expect(OdysseyNFT.burn(2)).to.be.revertedWith('token does not exist');
    });

    it("should revert if not owner or approved", async () => {
      const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
      const odyssey_id = 1;
      await OdysseyNFT.connect(owner).safeMint(addr1.address, odyssey_id);
      await expect(OdysseyNFT.connect(owner).burn(odyssey_id)).to.revertedWith("caller is not token owner or approved");
    });
  });

  describe("token URI", async function () {
    it("should set the correct base URI", async function () {
      const { OdysseyNFT, owner, addr3, addr4 } = await loadFixture(deployContract);

      await OdysseyNFT.connect(owner).safeMint(addr4.address, 1);
      await expect(await OdysseyNFT.tokenURI(1)).to.equal("ipfs://1.json");
      await expect(await OdysseyNFT.connect(owner).setbaseURI("http://"));
      await OdysseyNFT.connect(owner).safeMint(addr3.address, 2);
      await expect(await OdysseyNFT.tokenURI(2)).to.equal("http://2.json");
    });
  });
});
