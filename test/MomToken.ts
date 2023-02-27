import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

function rolesRevertString(address: string, role: string): string {
  return `AccessControl: account ${address.toLowerCase()} is missing role ${role.toLowerCase()}`
}

describe("MomToken", function () {
  async function deployMomTokenOneKSupply() {
    const initialSupply = 1000;
    const [owner, addr0] = await ethers.getSigners();

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply);

    return { momToken, initialSupply, owner, addr0 };
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
      // Lower case to match the revert message
      const burnerRole = await momToken.BURNER_ROLE();

      await momToken.transfer(addr0.address, amount);

      await expect(momToken.connect(addr0).burn(amount)).to.be.revertedWith(rolesRevertString(addr0.address, burnerRole));
      await expect(momToken.burn(amount)).to.emit(momToken, "Transfer").withArgs(owner.address, ethers.constants.AddressZero, amount);
    });

    it("Should not mint tokens if address doesn't have the Minter role", async function () {
      const { momToken, owner, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const minterRole = await momToken.MINTER_ROLE();

      await expect(momToken.connect(addr0).mint(addr0.address, amount)).to.be.revertedWith(rolesRevertString(addr0.address, minterRole));
      await expect(momToken.mint(addr0.address, amount)).to.emit(momToken, "Transfer").withArgs(ethers.constants.AddressZero, addr0.address, amount);
    });

    it("Should not pause and unpause contract if address doesn't have the Puaser role", async function () {
      const { momToken, owner, addr0 } = await loadFixture(deployMomTokenOneKSupply);
      const amount = 10;
      const pauserRole = await momToken.PAUSER_ROLE();

      await expect(momToken.connect(addr0).pause()).to.be.revertedWith(rolesRevertString(addr0.address, pauserRole));
      await expect(momToken.pause()).to.emit(momToken, "Paused").withArgs(owner.address);

      await expect(momToken.connect(addr0).unpause()).to.be.revertedWith(rolesRevertString(addr0.address, pauserRole));
      await expect(momToken.unpause()).to.emit(momToken, "Unpaused").withArgs(owner.address);

    });
  });
});
