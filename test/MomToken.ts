import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MomToken", function () {
  async function deployMomTokenOneKSupply() {
    const initialSupply = 1000;
    const [owner, otherAccount] = await ethers.getSigners();

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply);

    return { momToken, initialSupply, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { momToken, owner } = await loadFixture(deployMomTokenOneKSupply);

      expect(await momToken.owner()).to.equal(owner.address);
    });

    it("Should set initial suply to owner", async function () {
      const { momToken, owner, initialSupply } = await loadFixture(
        deployMomTokenOneKSupply
      );

      expect(await momToken.balanceOf(owner.address)).to.equal(
        initialSupply
      );
    });

  });
});
