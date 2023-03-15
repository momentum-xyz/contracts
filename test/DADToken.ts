import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "./utils"

describe("DADToken", function () {
  async function deployDadTokenOneKSupply() {
    const [owner, addr0] = await ethers.getSigners();

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();

    return { dadToken, owner, addr0 };
  }

  describe("Deployment", function () {
    it("Should set all roles to the contract deployer", async function () {
      const { dadToken, owner } = await loadFixture(deployDadTokenOneKSupply);
      
      expect(await dadToken.hasRole(dadToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await dadToken.hasRole(dadToken.BURNER_ROLE(), owner.address)).to.equal(true);
    });
  });

  describe("Roles", function () {
    it("Should not mint tokens if address doesn't have the Admin role", async function () {
        const { dadToken, owner, addr0 } = await loadFixture(deployDadTokenOneKSupply);
        const amount = 10;
        const minterRole = await dadToken.DEFAULT_ADMIN_ROLE();
  
        await expect(dadToken.connect(addr0).mint(addr0.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, minterRole));
        await expect(dadToken.mint(addr0.address, amount)).to.emit(dadToken, "Transfer").withArgs(ethers.constants.AddressZero, addr0.address, amount);
      });
    
    it("Should not burn or burnFrom tokens if address doesn't have the Burner/Admin role", async function () {
      const { dadToken, owner, addr0 } = await loadFixture(deployDadTokenOneKSupply);
      const amount = 10;
      const burnerRole = await dadToken.BURNER_ROLE();
      
      await dadToken.mint(owner.address, 100);
      await dadToken.mint(addr0.address, 100);

      await expect(dadToken.burn(amount)).to.emit(dadToken, "Transfer").withArgs(owner.address, ethers.constants.AddressZero, amount);

      await expect(dadToken.connect(addr0).burn(amount)).to.emit(dadToken, "Transfer").to.be.revertedWith(utils.rolesRevertString(addr0.address, burnerRole));


      await dadToken.grantRole(burnerRole, addr0.address);

      await expect(dadToken.connect(addr0).burn(amount)).to.emit(dadToken, "Transfer").withArgs(addr0.address, ethers.constants.AddressZero, amount);
    });

    it("Should not pause and unpause contract if address doesn't have the Admin role", async function () {
      const { dadToken, owner, addr0 } = await loadFixture(deployDadTokenOneKSupply);
      const pauserRole = await dadToken.DEFAULT_ADMIN_ROLE();

      await expect(dadToken.connect(addr0).pause()).to.be.revertedWith(utils.rolesRevertString(addr0.address, pauserRole));
      await expect(dadToken.pause()).to.emit(dadToken, "Paused").withArgs(owner.address);

      await expect(dadToken.connect(addr0).unpause()).to.be.revertedWith(utils.rolesRevertString(addr0.address, pauserRole));
      await expect(dadToken.unpause()).to.emit(dadToken, "Unpaused").withArgs(owner.address);

    });

    it("Should not be able to increase/decrease/approve allowance if address doesn't have the Transfer/Admin role", async function () {
        const { dadToken, owner, addr0 } = await loadFixture(deployDadTokenOneKSupply);
        const transferRole = await dadToken.TRANSFER_ROLE();
        const mintAmount = 100;
        const amount = 10;

        await dadToken.mint(owner.address, mintAmount);
        await dadToken.mint(addr0.address, mintAmount);

        await expect(dadToken.connect(owner).approve(addr0.address, amount)).to.emit(dadToken, "Approval").withArgs(owner.address, addr0.address, amount);
        // Amount * 2 expected here, since the event emits the total allowance.
        await expect(dadToken.connect(owner).increaseAllowance(addr0.address, amount)).to.emit(dadToken, "Approval").withArgs(owner.address, addr0.address, amount*2);
        await expect(dadToken.connect(owner).decreaseAllowance(addr0.address, amount)).to.emit(dadToken, "Approval").withArgs(owner.address, addr0.address, amount);

        await expect(dadToken.connect(addr0).approve(owner.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, transferRole));
        await expect(dadToken.connect(addr0).increaseAllowance(owner.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, transferRole));
        await expect(dadToken.connect(addr0).decreaseAllowance(owner.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, transferRole));

        await dadToken.connect(owner).grantRole(transferRole, addr0.address);

        await expect(dadToken.connect(addr0).approve(owner.address, amount)).to.emit(dadToken, "Approval").withArgs(addr0.address, owner.address, amount);
        // Amount * 2 expected here, since the event emits the total allowance.
        await expect(dadToken.connect(addr0).increaseAllowance(owner.address, amount)).to.emit(dadToken, "Approval").withArgs(addr0.address, owner.address, amount*2);
        await expect(dadToken.connect(addr0).decreaseAllowance(owner.address, amount)).to.emit(dadToken, "Approval").withArgs(addr0.address, owner.address, amount);
    });

    it("Should not be able to transfer if address doesn't have the Transfer/Admin role", async function () {
        const { dadToken, owner, addr0 } = await loadFixture(deployDadTokenOneKSupply);
        const transferRole = await dadToken.TRANSFER_ROLE();
        const mintAmount = 100;
        const amount = 10;

        await dadToken.mint(dadToken.address, mintAmount);
        await dadToken.mint(owner.address, mintAmount);
        await dadToken.mint(addr0.address, mintAmount);

        await expect(dadToken.connect(owner).transfer(addr0.address, amount)).to.emit(dadToken, "Transfer").withArgs(owner.address, addr0.address, amount);

        await dadToken.connect(owner).grantRole(transferRole, addr0.address);
        await dadToken.connect(addr0).approve(owner.address, amount);

        await expect(dadToken.connect(owner).transferFrom(addr0.address, owner.address, amount)).to.emit(dadToken, "Transfer").withArgs(addr0.address, owner.address, amount);
        
        await dadToken.connect(owner).revokeRole(transferRole, addr0.address);

        await expect(dadToken.connect(addr0).transfer(owner.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, transferRole));
        await expect(dadToken.connect(addr0).transferFrom(owner.address, addr0.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, transferRole));

        await dadToken.connect(owner).grantRole(transferRole, addr0.address);

        await expect(dadToken.connect(addr0).transfer(owner.address, amount)).to.emit(dadToken, "Transfer").withArgs(addr0.address, owner.address, amount);

        await dadToken.connect(owner).approve(addr0.address, amount);
        await expect(dadToken.connect(addr0).transferFrom(owner.address, addr0.address, amount)).to.emit(dadToken, "Transfer").withArgs(owner.address, addr0.address, amount);
    });
  });
});
