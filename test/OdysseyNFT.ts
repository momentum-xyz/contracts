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
          const { OdysseyNFT, owner, addr1, mintPrice } = await loadFixture(deployContract);

          const nftName = 'Odyssey #1';
          const nftDescription = 'The first Odyssey NFT';
          await OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1);
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);

        });
        
        // it("should fail to mint an NFT when sent the incorrect value", async function () {
        //   const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
    
        //   await expect(OdysseyNFT.connect(owner.address).mintNFT({ value: ethers.utils.parseEther("0.5") })).to.be.revertedWith("wrong amount sent");
    
        //   const balance = await OdysseyNFT.balanceOf(addr1.address);
        //   expect(balance).to.equal(0);
        // });

        it("should fail to mint an NFT when the maximum number of NFTs per wallet have already been minted", async function () {
          const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
    
          await expect(OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1)).to.not.be.reverted;
          await expect(OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1)).to.be.revertedWith("Odyssey mints per wallet exceeded");

        });

        it("Should mint an NFT and set the correct token URI", async function () {
          const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

          await OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1);
          expect(await OdysseyNFT.tokenURI(1)).to.equal("ipfs://1");
        });

        it("Should not mint an NFT if minting is paused", async function () {
          const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

          await OdysseyNFT.pause();
          await expect(OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
        });

      });
    
      describe("transferOdyssey", function () {
        it("should transfer an OdysseyNFT from the owner to the buyer", async function () {
          const { OdysseyNFT, addr1, owner } = await loadFixture(deployContract);
      
          await OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(owner.address, 1);
          // await OdysseyNFT.safeTransferFrom(owner.address, addr1.address, 1);
          await OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);
        });
          
      it("should not allow non-owner to transfer OdysseyNFT", async () => {
        const { OdysseyNFT, owner, addr1, addr2 } = await loadFixture(deployContract);
        await OdysseyNFT.connect(await ethers.getSigner(owner.address)).safeMint(addr1.address, 1);
        expect (OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
      });
  
      it("should not allow transfer of non-existent OdysseyNFT", async () => {
        const { OdysseyNFT, addr1, addr2 } = await loadFixture(deployContract);
        expect (OdysseyNFT["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1)).to.be.revertedWith("ERC721: invalid token ID");
      });

      });

}
);
