import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "./utils";

describe("MomToken", function () {
  async function deployMomTokenOneKSupply() {
    const initialSupply = 1000;
    const [owner, addr0, addr1] = await ethers.getSigners();

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();
    
    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply, addr1.address, dadToken.address);
    
    await dadToken.grantRole(await dadToken.MINTER_ROLE(), momToken.address);

    return { momToken, dadToken, initialSupply, owner, addr0, addr1 };
  }

  describe("Deployment", function () {
    it("Should set all roles to the contract deployer", async function () {
      const { momToken, owner } = await loadFixture(deployMomTokenOneKSupply);
      
      expect(await momToken.hasRole(momToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
      expect(await momToken.hasRole(momToken.BURNER_ROLE(), owner.address)).to.equal(true);
      expect(await momToken.hasRole(momToken.MINTER_ROLE(), owner.address)).to.equal(true);
      expect(await momToken.hasRole(momToken.PAUSER_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set initial suply to owner", async function () {
      const { momToken, owner, initialSupply } = await loadFixture(
        deployMomTokenOneKSupply
      );
      
      const balance = await momToken.balanceOf(owner.address);

      expect(balance).to.equal(
        initialSupply
      );
    });

  });

  describe("Roles", function () {
    it("Should not burn or burnFrom tokens if address doesn't have the Burner role", async function () {
      const { momToken, owner, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const burnerRole = await momToken.BURNER_ROLE();

      await momToken.transfer(addr0.address, amount);

      await expect(momToken.connect(addr0).burn(amount/2)).to.be.revertedWith(utils.rolesRevertString(addr0.address, burnerRole));
      await expect(momToken.connect(addr0).burnFrom(addr0.address, amount/2)).to.be.revertedWith(utils.rolesRevertString(addr0.address, burnerRole));
      await expect(momToken.burn(amount/2)).to.emit(momToken, "Transfer").withArgs(owner.address, ethers.constants.AddressZero, amount/2);
      await momToken.connect(addr0).approve(owner.address, amount/2);
      await expect(momToken.burnFrom(addr0.address, amount/2)).to.emit(momToken, "Transfer").withArgs(addr0.address, ethers.constants.AddressZero, amount/2);
    });

    it("Should not mint tokens if address doesn't have the Minter role", async function () {
      const { momToken, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const minterRole = await momToken.MINTER_ROLE();

      await expect(momToken.connect(addr0).mint(addr0.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, minterRole));
      await expect(momToken.mint(addr0.address, amount)).to.emit(momToken, "Transfer").withArgs(ethers.constants.AddressZero, addr0.address, amount);
    });

    it("Should not mint DAD tokens and the tokens to the vesting contract if address doesn't have the MOM Minter role", async function () {
      const { momToken, owner, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const minterRole = await momToken.MINTER_ROLE();

      await expect(momToken.connect(addr0).mintDad(addr0.address, amount)).to.be.revertedWith(utils.rolesRevertString(addr0.address, minterRole));
      await expect(momToken.mint(addr0.address, amount)).to.emit(momToken, "Transfer").withArgs(ethers.constants.AddressZero, addr0.address, amount);
    });

    it("Should not pause and unpause contract if address doesn't have the Pauser role", async function () {
      const { momToken, owner, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const pauserRole = await momToken.PAUSER_ROLE();

      await expect(momToken.connect(addr0).pause()).to.be.revertedWith(utils.rolesRevertString(addr0.address, pauserRole));
      await expect(momToken.pause()).to.emit(momToken, "Paused").withArgs(owner.address);

      await expect(momToken.connect(addr0).unpause()).to.be.revertedWith(utils.rolesRevertString(addr0.address, pauserRole));
      await expect(momToken.unpause()).to.emit(momToken, "Unpaused").withArgs(owner.address);
    });
  });

  describe("Utils", function () {
    it("Should not mint DAD tokens to address and the same amount of MOM to vesting", async function () {
      const { momToken, dadToken, owner, addr0, addr1 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;

      await momToken.connect(owner).mintDad(addr0.address, amount);
      
      const dad_balance = await dadToken.callStatic.balanceOf(addr0.address);
      const mom_balance = await momToken.callStatic.balanceOf(addr1.address);

      expect(dad_balance).eq(amount);
      expect(mom_balance).eq(amount);
    });
  });
});
