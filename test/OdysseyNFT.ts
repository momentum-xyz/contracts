import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";

  const name = 'Odyssey_NFT';
  const symbol = 'ODS';
  const maxOdysseySupply = 21000;
  const mintPrice = ethers.utils.parseEther('1');
  const URI =  "ipfs://";


describe("deploy contract", function() {
  async function deployContract(){

    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("OdysseyNFT");
    const OdysseyNFT = await contract.deploy(name, symbol, maxOdysseySupply, mintPrice, URI);

    return { OdysseyNFT, name, symbol, maxOdysseySupply, mintPrice, owner, addr1, addr2, addr3, addr4, URI };

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
        const { OdysseyNFT, mintPrice } = await loadFixture(deployContract);
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
          await OdysseyNFT.connect(owner).safeMint(addr1.address, 1);
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);

        });

        it("should fail to mint an NFT when the maximum number of NFTs per wallet have already been minted", async function () {
          const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);
    
          await expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.not.be.reverted;
          expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Odyssey mints per wallet exceeded");

        });

        it("Should mint an NFT and set the correct token URI", async function () {
          const { OdysseyNFT, owner, addr1 } = await loadFixture(deployContract);

          await OdysseyNFT.connect(owner).safeMint(addr1.address, 1);
          expect(await OdysseyNFT.tokenURI(1)).to.equal("ipfs://1");
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
          // await OdysseyNFT.safeTransferFrom(owner.address, addr1.address, 1);
          await OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);
          expect(await OdysseyNFT.ownerOf(1)).to.equal(addr1.address);
        });
          
      it("should not allow non-owner to transfer OdysseyNFT", async () => {
        const { OdysseyNFT, owner, addr1, addr2 } = await loadFixture(deployContract);
        await OdysseyNFT.connect(owner).safeMint(addr1.address, 1);
        expect (OdysseyNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
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

        it("should set the mint_price for minting the OdysseyNFT", async function () {
          const { OdysseyNFT, owner } = await loadFixture(deployContract);
      
          await OdysseyNFT.connect(owner).setMintPrice(1000);
          // await OdysseyNFT.safeTransferFrom(owner.address, addr1.address, 1);
          expect(await OdysseyNFT.mintPrice()).to.equal(1000);
        });

        it("should revert with max odyssey supply reached", async function () {
          const { OdysseyNFT, owner, addr1, addr2 } = await loadFixture(deployContract);
      
          await OdysseyNFT.connect(owner).setMaxTokens(1);
          expect (OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Max Odyssey supply reached");
        });


      });

      describe("contract paused", async function () {
        it("should revert with Contract is paused", async function () {
          const { OdysseyNFT, owner, addr1, addr2 } = await loadFixture(deployContract);
          
          await OdysseyNFT.connect(owner).pause();
          expect(OdysseyNFT.connect(owner).safeMint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
        });

      });

      describe("token already minted", async function () {
        it("should revert with token already minted", async () => {
          const { OdysseyNFT, owner, addr3 } = await loadFixture(deployContract);
          expect (OdysseyNFT.connect(owner).safeMint(addr3.address, 1)).to.be.revertedWith("ERC721: token already minted");
        });

      });

      describe("token burn", async function () {
        it("should burn the token", async () => {
          const { OdysseyNFT, owner, addr4 } = await loadFixture(deployContract);
          const tokenId = await OdysseyNFT.connect(owner).safeMint(addr4.address, 6);
          await OdysseyNFT.burnToken(6)
          expect( await OdysseyNFT.exists(6)).to.be.false
        });

        it("should revert with token does not exist", async () => {
          const { OdysseyNFT, owner, addr3 } = await loadFixture(deployContract);
          expect(OdysseyNFT.burnToken(2)).to.be.revertedWith('token does not exist');
        });

      });

}
);
