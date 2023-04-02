import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Staking } from "../typechain-types";
import { Token } from "./utils";

describe("Staking", function () {
  async function deployStaking() {
    const initialSupply = 1000;
    const [owner, addr0, addr1] = await ethers.getSigners();

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply);

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();

    await momToken.deployed();
    await dadToken.deployed();

    const Staking = await ethers.getContractFactory("Staking");
    const staking = <Staking> await upgrades.deployProxy(Staking, [momToken.address, dadToken.address], { initializer: 'initialize', kind: 'uups'});

    await staking.deployed();

    // Granting the right permissions for the staking contract
    // Transfer DAD token (stake, unstake) and mint MOM token (rewards)
    await dadToken.grantRole(dadToken.TRANSFER_ROLE(), staking.address);
    await momToken.grantRole(momToken.MINTER_ROLE(), staking.address);

    return { staking, momToken, dadToken, owner, addr0, addr1 };
  }

  describe("Initialize", function () {
    it("should set the right token contract addresses on initialize", async function () {
      const { staking, momToken, dadToken, owner, addr0 } = await loadFixture(deployStaking);
      expect(await staking.mom_token()).to.equal(momToken.address);
      expect(await staking.dad_token()).to.equal(dadToken.address);
    });
  });

  describe("Stake", function () {
    it("should stake and update structures", async function () {
      const { staking, momToken, dadToken, owner, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 0;
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
    });
  });

  describe("Unstake", function () {
    it("should unstake MOM and update structures removing staker and staked_by", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 1;
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      expect(await staking.connect(addr0).unstake(odyssey_id, Token.MOM)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_id, amount, Token.MOM);
      expect(await staking.total_staked()).to.be.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.eq(0);
    });

    it("should unstake MOM and claim unstaked tokens", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 1;

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);
    });

    it("should revert if there is no tokens to claim", async function () {
      const { staking,addr0 } = await loadFixture(deployStaking);
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
    });
    
    it("should claim only after 7 days", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 1;

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);

      const now = await time.latest();
      
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
      
      time.increaseTo(now + time.duration.days(7));

      expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, amount, 0);
      expect(await momToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

    it("should clear tokens to claim, after claiming tokens", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 1;

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);

      const now = await time.latest();

      time.increaseTo(now + time.duration.days(7));

      expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, amount, 0);
      expect(await momToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

  });

});