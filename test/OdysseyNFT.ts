const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

  const name = 'Odyssey_NFT';
  const symbol = 'ODS';
  const maxOdysseySupply = 21000;
  const mintPrice = ethers.utils.parseEther('1');
  const URI =  "ipfs://";


describe("deploy contract", function() {
  async function deployContract(){

  const [owner, addr1, addr2] = await ethers.getSigners();
  const contract = await ethers.getContractFactory("OdysseyNFT");
  const OdysseyNFT = await contract.deploy(name, symbol, maxOdysseySupply, mintPrice, URI);

  return { OdysseyNFT, name, symbol, maxOdysseySupply, mintPrice, owner, addr1, addr2, URI };

};

  it("Should match mintPrice to the value assigned on deployment", async function () {
    const { OdysseyNFT, owner, mintPrice } = await loadFixture(deployContract);

    const ownerBalance = await OdysseyNFT.balanceOf(owner.address);
    expect(await OdysseyNFT.mintPrice()).to.equal(mintPrice);
  });

  describe('constructor', () => {
    it('should set the name and symbol of the token', async () => {
      const { OdysseyNFT, name, symbol } = await loadFixture(deployContract);
      expect(await OdysseyNFT.name()).to.equal(name);
      expect(await OdysseyNFT.symbol()).to.equal(symbol);
    });

    it('should set the max supply and mint price', async () => {
      const { OdysseyNFT, maxTokens, mintPrice } = await loadFixture(deployContract);
      expect(await OdysseyNFT.maxTokens()).to.equal(maxOdysseySupply);
      expect(await OdysseyNFT.mintPrice()).to.equal(mintPrice);
    });

  });

  describe('pauseMinting and unpauseMinting', () => {
        it('should pause and unpause minting', async () => {
          const { OdysseyNFT, maxTokens, mintPrice } = await loadFixture(deployContract);

          expect (await OdysseyNFT.mintingPaused()).to.be.false;
    
          await OdysseyNFT.pauseMinting();
        
          expect (await OdysseyNFT.mintingPaused()).to.be.true;
    
          await OdysseyNFT.unpauseMinting();
    
          expect (await OdysseyNFT.mintingPaused()).to.be.false;
        });
      });

  describe('mintNFT', () => {
        it('should mint a new NFT', async () => {
          const { OdysseyNFT, owner, addr1, mintPrice } = await loadFixture(deployContract);

          const nftName = 'Odyssey #1';
          const nftDescription = 'The first Odyssey NFT';
          await OdysseyNFT.connect(await ethers.getSigner(addr1.address)).mintNFT({ value: mintPrice });
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);

        });
        
        it("should fail to mint an NFT when sent the incorrect value", async function () {
          const { OdysseyNFT, addr1 } = await loadFixture(deployContract);
    
          await expect(OdysseyNFT.connect(addr1).mintNFT({ value: ethers.utils.parseEther("0.5") })).to.be.revertedWith("wrong amount sent");
    
          const balance = await OdysseyNFT.balanceOf(addr1.address);
          expect(balance).to.equal(0);
        });

        it("should fail to mint an NFT when the maximum number of NFTs per wallet have already been minted", async function () {
          const { OdysseyNFT, addr1 } = await loadFixture(deployContract);
    
          await OdysseyNFT.mintNFT({ value: ethers.utils.parseEther("1") });
          await expect(OdysseyNFT.connect(addr1).mintNFT({ value: ethers.utils.parseEther("1") })).to.not.be.reverted;
    
          await expect(OdysseyNFT.connect(addr1).mintNFT({ value: ethers.utils.parseEther("1") })).to.be.revertedWith("Odyssey mints per wallet exceeded");
    
          const balance = await OdysseyNFT.balanceOf(addr1.address);
          expect(balance).to.equal(1);
        });

        it("Should mint an NFT and set the correct token URI", async function () {
          const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);

          await OdysseyNFT.mintNFT({ value: ethers.utils.parseEther("1") });
          // const tokenId = await OdysseyNFT.tokenOfOwnerByIndex(owner.address, 0);
          expect(await OdysseyNFT.tokenURI(1)).to.equal("ipfs://1");
        });

        it("Should not mint an NFT if minting is paused", async function () {
          const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);

          await OdysseyNFT.pauseMinting();
          await expect(OdysseyNFT.mintNFT({ value: ethers.utils.parseEther("1") })).to.be.revertedWith("Odyssey Minting is paused");
        });

      });
    
      describe("transferOdyssey", function () {
        it("should transfer an OdysseyNFT from the owner to the buyer", async function () {
          const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);
      
          await OdysseyNFT.mintNFT({ value: ethers.utils.parseEther("1") });
          await OdysseyNFT.transferOdyssey(owner.address, addr1.address, 1);
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);
        });
          
      it("should not allow non-owner to transfer OdysseyNFT", async () => {
        const { OdysseyNFT, addr1, addr2, owner } = await loadFixture(deployContract);
        await OdysseyNFT.connect(addr1).mintNFT({ value: mintPrice });
        expect (OdysseyNFT.transferOdyssey(await addr2.address, await addr1.address, 1)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
      });
  
      it("should not allow transfer of non-existent OdysseyNFT", async () => {
        const { OdysseyNFT, addr1, addr2, owner } = await loadFixture(deployContract);
        expect (OdysseyNFT.transferOdyssey(await addr1.address, await addr2.address, 2)).to.be.revertedWith("ERC721: invalid token ID");
      });

      });

}
);
