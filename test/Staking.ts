import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Staking } from "../typechain-types";
import { Token, utils } from "./utils";

describe("Staking", function () {
  async function deployStaking() {
    const initialSupply = 1000;
    const [owner, addr0, addr1, addr2] = await ethers.getSigners();
    const name = 'Odyssey_NFT';
    const symbol = 'ODS';
    const maxOdysseySupply = 21000;
    const maxTokensPerWallet = 150;
    const URI =  "ipfs://";

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply);

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();

    const OdysseyNFT = await ethers.getContractFactory("OdysseyNFT");
    const odysseyNFT = await OdysseyNFT.deploy(name, symbol, maxOdysseySupply, maxTokensPerWallet, URI);

    await momToken.deployed();
    await dadToken.deployed();
    await odysseyNFT.deployed();

    const Staking = await ethers.getContractFactory("Staking");
    const staking = <Staking> await upgrades.deployProxy(Staking, [momToken.address, dadToken.address, odysseyNFT.address], { initializer: 'initialize', kind: 'uups'});

    await staking.deployed();

    // Granting the right permissions for the staking contract
    // Transfer DAD token (stake, unstake) and mint MOM token (rewards)
    await dadToken.grantRole(dadToken.TRANSFER_ROLE(), staking.address);
    await momToken.grantRole(momToken.MINTER_ROLE(), staking.address);

    return { staking, momToken, dadToken, odysseyNFT, owner, addr0, addr1, addr2 };
  }

  describe("Initialize", function () {
    it("should set the right token contract addresses on initialize", async function () {
      const { staking, momToken, dadToken } = await loadFixture(deployStaking);
      
      expect(await staking.mom_token()).to.equal(momToken.address);
      expect(await staking.dad_token()).to.equal(dadToken.address);
    });
  });

  describe("Stake", function () {
    it("should revert if user do not have enough MOM balance or doesn't have allowance", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(staking.connect(addr0).stake(odyssey_id, amount+1, Token.MOM)).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("should stake MOM and update structures, first time", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await momToken.balanceOf(addr0.address)).to.eq(0);
    });

    it("should stake MOM and update structures, not first time", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await momToken.balanceOf(addr0.address)).to.eq(0);

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount*2);
      expect(await staking.total_staked()).to.be.eq(amount*2);
      expect(await momToken.balanceOf(addr0.address)).to.eq(0);
    });

    it("should stake MOM and update structures, after unstaking", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await momToken.balanceOf(addr0.address)).to.eq(0);

      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await momToken.balanceOf(addr0.address)).to.eq(0);
    });

    it("should revert if user do not have enough DAD balance or doesn't have allowance", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(staking.connect(addr0).stake(odyssey_id, amount+1, Token.DAD)).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("should stake DAD and update structures, first time", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);
    });

    it("should stake DAD and update structures, not first time", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount*2);
      expect(await staking.total_staked()).to.be.eq(amount*2);
      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);
    });

    it("should stake DAD and update structures, after unstaking", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);

      await staking.connect(addr0).unstake(odyssey_id, Token.DAD);

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      
      await expect(await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD)).to.emit(staking, "Stake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount);
      expect(await staking.total_staked()).to.be.eq(amount);
      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);
    });
  });

  describe("Unstake", function () {
    it("should revert unstake if user is not staking on that Odyssey", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await expect(staking.connect(addr0).unstake(odyssey_id, Token.MOM)).to.be.revertedWith("Invalid user or user not staking on that Odyssey");
    });
    
    it("should unstake MOM and update structures removing staker and staked_by, only MOM staked", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(await staking.connect(addr0).unstake(odyssey_id, Token.MOM)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, 0);
      expect(await staking.total_staked()).to.be.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.eq(0);
    });

    it("should unstake MOM and update structures removing staker and staked_by, both MOM and DAD staked", async function () {
      const { staking, momToken, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);

      await expect(await staking.connect(addr0).unstake(odyssey_id, Token.MOM)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, amount);
      expect(await staking.total_staked()).to.be.not.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.not.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.not.eq(0);
    });

    it("should unstake MOM and update structures removing staker and staked_by, both MOM and DAD staked differently in more than one Odyssey", async function () {
      const { staking, momToken, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_one_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const odyssey_two_id = "0xe276ba1dff024fd28fcff53b6d94589b";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_one_id, amount, Token.MOM);
      await staking.connect(addr0).stake(odyssey_two_id, amount, Token.DAD);

      await expect(await staking.connect(addr0).unstake(odyssey_one_id, Token.MOM)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_one_id, amount, Token.MOM, 0);
      expect(await staking.total_staked()).to.be.not.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.not.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_one_id);
      expect(odyssey.total_stakers).to.be.eq(0);
    });

    it("should unstake MOM and update structures removing staker and staked_by, both MOM and DAD staked differently by more than one staker in one Odyssey", async function () {
      const { staking, momToken, dadToken, addr0, addr1, addr2 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr1.address, amount);
      await momToken.mint(addr2.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr1).approve(staking.address, amount);
      await momToken.connect(addr2).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr1).stake(odyssey_id, amount, Token.DAD);
      await staking.connect(addr2).stake(odyssey_id, amount, Token.MOM);

      expect(await staking.callStatic.total_staked()).to.be.eq(amount*3);
      await expect(await staking.connect(addr1).unstake(odyssey_id, Token.DAD)).to.emit(staking, "Unstake").withArgs(addr1.address, odyssey_id, amount, Token.DAD, 0);
      expect(await staking.callStatic.total_staked()).to.be.eq(amount*2);
      
      const staker = await staking.callStatic.stakers(addr1.address);
      expect(staker.user).to.be.eq(ethers.constants.AddressZero);

      const odyssey = await staking.callStatic.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.eq(2);
    });

    it("should revert if there is no tokens to claim", async function () {
      const { staking,addr0 } = await loadFixture(deployStaking);
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
    });
    
    it("should claim MOM only after 7 days", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);

      const now = await time.latest();
      
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
      
      await time.increaseTo(now + time.duration.days(7));

      await expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, amount, 0);
      expect(await momToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

    it("should claim all MOM in the list only after 7 days", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 2000;
      const odyssey_one_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const odyssey_two_id = "0xe276ba1dff024fd28fcff53b6d94589b";
      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_one_id, amount/2, Token.MOM);
      await staking.connect(addr0).stake(odyssey_two_id, amount/2, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_one_id, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_two_id, Token.MOM);

      const now = await time.latest();
      
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
      
      await time.increaseTo(now + time.duration.days(7));

      await expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, amount, 0);
      expect(await momToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

    it("should clear MOM tokens to claim, after claiming tokens", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).unstake(odyssey_id, Token.MOM);

      const now = await time.latest();

      await time.increaseTo(now + time.duration.days(7));

      await expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, amount, 0);
      expect(await momToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

    it("should unstake DAD and update structures removing staker and staked_by, only DAD staked, one Odyssey", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(await staking.connect(addr0).unstake(odyssey_id, Token.MOM)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_id, amount, Token.MOM, 0);
      expect(await staking.total_staked()).to.be.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.eq(0);
    });

    it("should unstake DAD and update structures removing staker and staked_by, both MOM and DAD staked equally in more than one Odyssey", async function () {
      const { staking, momToken, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 2000;
      const odyssey_one_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const odyssey_two_id = "0xe276ba1dff024fd28fcff53b6d94589b";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_one_id, amount/2, Token.MOM);
      await staking.connect(addr0).stake(odyssey_one_id, amount/2, Token.DAD);
      await staking.connect(addr0).stake(odyssey_two_id, amount/2, Token.MOM);
      await staking.connect(addr0).stake(odyssey_two_id, amount/2, Token.DAD);

      await expect(await staking.connect(addr0).unstake(odyssey_one_id, Token.DAD)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_one_id, amount/2, Token.DAD, amount/2);
      expect(await staking.total_staked()).to.be.not.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.not.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_one_id);
      expect(odyssey.total_stakers).to.be.not.eq(0);
    });

    it("should unstake DAD and update structures removing staker and staked_by, both MOM and DAD staked differently in more than one Odyssey", async function () {
      const { staking, momToken, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_one_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const odyssey_two_id = "0xe276ba1dff024fd28fcff53b6d94589b";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_one_id, amount, Token.MOM);
      await staking.connect(addr0).stake(odyssey_two_id, amount, Token.DAD);

      await expect(await staking.connect(addr0).unstake(odyssey_two_id, Token.DAD)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_two_id, amount, Token.DAD, 0);
      expect(await staking.total_staked()).to.be.not.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.not.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_two_id);
      expect(odyssey.total_stakers).to.be.eq(0);
    });

    it("should unstake DAD and update structures removing staker and staked_by, both MOM and DAD staked, one Odyssey", async function () {
      const { staking, momToken, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      
      await momToken.mint(addr0.address, amount);
      await dadToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);

      await expect(await staking.connect(addr0).unstake(odyssey_id, Token.DAD)).to.emit(staking, "Unstake").withArgs(addr0.address, odyssey_id, amount, Token.DAD, amount);
      expect(await staking.total_staked()).to.be.not.eq(0);
      
      const staker = await staking.stakers(addr0.address);
      expect(staker.user).to.be.not.eq(ethers.constants.AddressZero);

      const odyssey = await staking.odysseys(odyssey_id);
      expect(odyssey.total_stakers).to.be.not.eq(0);
    });

    it("should claim DAD only after 7 days", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);
      await staking.connect(addr0).unstake(odyssey_id, Token.DAD);

      const now = await time.latest();
      
      await expect(staking.connect(addr0).claim_unstaked_tokens()).to.be.revertedWith("Nothing to claim");
      
      await time.increaseTo(now + time.duration.days(7));

      await expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, 0, amount);
      expect(await dadToken.balanceOf(addr0.address)).to.be.eq(amount);
    });

    it("should clear DAD tokens to claim, after claiming tokens", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);
      await staking.connect(addr0).unstake(odyssey_id, Token.DAD);

      const now = await time.latest();

      await time.increaseTo(now + time.duration.days(7));

      await expect(await staking.connect(addr0).claim_unstaked_tokens()).to.emit(staking, "ClaimedUnstaked").withArgs(addr0.address, 0, amount);
      expect(await dadToken.balanceOf(addr0.address)).to.be.eq(amount);
    });
  });

  describe("Rewards", function () {
    it("should revert when no rewards to be claimed", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);

      await expect(staking.connect(addr0)["claim_rewards()"]()).to.revertedWith("No rewards available");
    });

    it("should revert when no Odyssey rewards to be claimed", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);

      await expect(staking.connect(addr0)["claim_rewards(uint256)"](1)).to.revertedWith("No rewards available");
    });

    it("should revert when user is not Odyssey owner", async function () {
      const { staking, momToken, odysseyNFT, addr0, owner } = await loadFixture(deployStaking);
      const amount = 1000;
      const rewards = 50;

      await odysseyNFT.safeMint(owner.address);
      const odyssey_id = await odysseyNFT.callStatic.currentId();

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await staking.update_rewards([addr0.address], [rewards], [odyssey_id], [rewards], await time.latest());

      await expect(staking.connect(addr0)["claim_rewards(uint256)"](odyssey_id)).to.be.revertedWith("Not owner of that Odyssey");
      await expect(await momToken.balanceOf(addr0.address)).to.be.eq(0);
    });

    it("should revert when updating rewards timeout", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const timeout = await time.latest() - time.duration.minutes(4);

      await expect(staking.update_rewards([addr0.address], [amount], [1], [1], timeout)).to.revertedWith("Timeout");
    });

    it("should revert when updating rewards receives an empty list in inputs", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;

      await expect(staking.update_rewards([addr0.address], [amount], [], [1], await time.latest())).to.revertedWith("Invalid Input");
    });

    it("should revert when updating rewards receives a future timestamp", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const timeout = await time.latest() + time.duration.minutes(4);

      await expect(staking.update_rewards([addr0.address], [amount], [1], [1], timeout)).to.revertedWith("Invalid timestamp");
    });

    it("should update rewards", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = 604472133179351442128925n;

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(staking.update_rewards([addr0.address], [amount], [odyssey_id], [amount], await time.latest())).to.emit(staking, "RewardsUpdated").withArgs(await (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp, await ethers.provider.getBlockNumber());
    });

    it("should claim odyssey rewards when user is owner and have rewards", async function () {
      const { staking, momToken, odysseyNFT, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const rewards = 50;

      await odysseyNFT.safeMint(addr0.address);
      const odyssey_id = await odysseyNFT.callStatic.currentId();

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await staking.update_rewards([addr0.address], [rewards], [odyssey_id], [rewards], await time.latest());

      await expect(await staking.connect(addr0)["claim_rewards(uint256)"](odyssey_id)).to.emit(staking, "OdysseyRewardsClaimed").withArgs(odyssey_id, rewards);
      await expect(await momToken.balanceOf(addr0.address)).to.be.eq(rewards);
    });

    it("should claim rewards when user has staking rewards", async function () {
      const { staking, momToken, odysseyNFT, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const rewards = 50;

      await odysseyNFT.safeMint(addr0.address);
      const odyssey_id = await odysseyNFT.callStatic.currentId();

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await staking.update_rewards([addr0.address], [rewards], [odyssey_id], [rewards], await time.latest());

      await expect(await staking.connect(addr0)["claim_rewards()"]()).to.emit(staking, "RewardsClaimed").withArgs(addr0.address, rewards);
      await expect(await momToken.balanceOf(addr0.address)).to.be.eq(rewards);
    });
  });

  describe("Restake", function () {
    it("should revert when amount is 0 MOM", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 0;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.MOM)).to.revertedWith("Amount cannot be 0");
    });

    it("should revert when user is not staking MOM in that Odyssey", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(new_odyssey_id, amount, Token.MOM);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.MOM)).to.revertedWith("Not staking in that Odyssey");
    });

    it("should revert when user is not a MOM staker", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.MOM)).to.revertedWith("Not a staker");
    });

    it("should revert when amount of MOM is greater than staked amount", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount * 2 , Token.MOM)).to.revertedWith("Not enough staked");
    });

    it("should restake if there is enough MOM tokens staked", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount / 2 , Token.MOM)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount / 2, Token.MOM, amount / 2, amount / 2);
    });

    it("should restake, even if it is the total amount of MOM", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount , Token.MOM)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount, Token.MOM, 0, amount);
    });

    it("should restake MOM on already staked Odyssey", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount/2, Token.MOM);
      await staking.connect(addr0).stake(new_odyssey_id, amount/2, Token.MOM);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount/2 , Token.MOM)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount/2, Token.MOM, 0, amount);
    });

    it("should revert when amount is 0 DAD", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 0;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.DAD)).to.revertedWith("Amount cannot be 0");
    });

    it("should revert when user is not staking DAD in that Odyssey", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(new_odyssey_id, amount, Token.DAD);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.DAD)).to.revertedWith("Not staking in that Odyssey");
    });

    it("should revert when user is not a DAD staker", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount, Token.DAD)).to.revertedWith("Not a staker");
    });

    it("should revert when amount of DAD is greater than staked amount", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount * 2 , Token.DAD)).to.revertedWith("Not enough staked");
    });

    it("should restake if there is enough DAD tokens staked", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount / 2 , Token.DAD)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount / 2, Token.DAD, amount / 2, amount / 2);
    });

    it("should restake, even if it is the total amount of DAD", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount, Token.DAD);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount , Token.DAD)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount, Token.DAD, 0, amount);
    });

    it("should restake DAD on already staked Odyssey", async function () {
      const { staking, dadToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";
      const new_odyssey_id = "0xe276ba1dff024fd28fcff53b6d937834";

      await dadToken.mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(staking.address, amount);
      await staking.connect(addr0).stake(odyssey_id, amount/2, Token.DAD);
      await staking.connect(addr0).stake(new_odyssey_id, amount/2, Token.DAD);

      await expect(staking.connect(addr0).restake(odyssey_id, new_odyssey_id, amount/2 , Token.DAD)).to.emit(staking, "Restake")
            .withArgs(addr0.address, odyssey_id, new_odyssey_id, amount/2, Token.DAD, 0, amount);
    });
  });

  describe("Utilities", function () {
    it("should update MOM token contract if manager", async function () {
      const { staking, owner } = await loadFixture(deployStaking);

      expect(await staking.connect(owner).mom_token()).not.eq(ethers.constants.AddressZero);

      staking.connect(owner).update_mom_token_contract(ethers.constants.AddressZero)
      
      expect(await staking.connect(owner).mom_token()).eq(ethers.constants.AddressZero);
    });

    it("should revert update MOM token contract if not manager", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const manager_role = await staking.MANAGER_ROLE();
      expect(await staking.connect(addr0).mom_token()).not.eq(ethers.constants.AddressZero);

      await expect(staking.connect(addr0).update_mom_token_contract(ethers.constants.AddressZero)).to.be.revertedWith(utils.rolesRevertString(addr0.address, manager_role));
    });
    
    it("should update DAD token contract if manager", async function () {
      const { staking, owner } = await loadFixture(deployStaking);
      
      expect(await staking.connect(owner).dad_token()).not.eq(ethers.constants.AddressZero);
      
      staking.connect(owner).update_dad_token_contract(ethers.constants.AddressZero)
      
      expect(await staking.connect(owner).dad_token()).eq(ethers.constants.AddressZero);
    });
    
    it("should revert update DAD token contract if not manager", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const manager_role = await staking.MANAGER_ROLE();
      expect(await staking.connect(addr0).dad_token()).not.eq(ethers.constants.AddressZero);
      
      await expect(staking.connect(addr0).update_dad_token_contract(ethers.constants.AddressZero)).to.be.revertedWith(utils.rolesRevertString(addr0.address, manager_role));
    });
    
    it("should update Locking Period if manager", async function () {
      const { staking, owner } = await loadFixture(deployStaking);
      
      expect(await staking.connect(owner).locking_period()).not.eq(ethers.constants.AddressZero);
      
      staking.connect(owner).update_locking_period(ethers.constants.AddressZero)
      
      expect(await staking.connect(owner).locking_period()).eq(ethers.constants.AddressZero);
    });
    
    it("should revert update Locking Period if not manager", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const manager_role = await staking.MANAGER_ROLE();
      expect(await staking.connect(addr0).locking_period()).not.eq(ethers.constants.AddressZero);
      
      await expect(staking.connect(addr0).update_locking_period(ethers.constants.AddressZero)).to.be.revertedWith(utils.rolesRevertString(addr0.address, manager_role));
    });

    it("should update Rewards Timeout if manager", async function () {
      const { staking, owner } = await loadFixture(deployStaking);
      const minutes = time.duration.minutes(4);
      expect(await staking.connect(owner).rewards_timeout()).not.eq(0);
      
      staking.connect(owner).update_rewards_timeout(minutes);
      
      expect(await staking.connect(owner).rewards_timeout()).eq(minutes);
    });
    
    it("should revert update Rewards Timeout if not manager", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const manager_role = await staking.MANAGER_ROLE();
      const minutes = time.duration.minutes(4);

      expect(await staking.connect(addr0).rewards_timeout()).not.eq(0);
      
      await expect(staking.connect(addr0).update_rewards_timeout(minutes)).to.be.revertedWith(utils.rolesRevertString(addr0.address, manager_role));
    });

    it("should update Odyssey NFT's contract if manager", async function () {
      const { staking, owner } = await loadFixture(deployStaking);

      expect(await staking.connect(owner).odyssey_nfts()).not.eq(ethers.constants.AddressZero);

      staking.connect(owner).update_odyssey_nfts_contract(ethers.constants.AddressZero)
      
      expect(await staking.connect(owner).odyssey_nfts()).eq(ethers.constants.AddressZero);
    });

    it("should revert update Odyssey NFT's if not manager", async function () {
      const { staking, addr0 } = await loadFixture(deployStaking);
      const manager_role = await staking.MANAGER_ROLE();
      expect(await staking.connect(addr0).odyssey_nfts()).not.eq(ethers.constants.AddressZero);

      await expect(staking.connect(addr0).update_odyssey_nfts_contract(ethers.constants.AddressZero)).to.be.revertedWith(utils.rolesRevertString(addr0.address, manager_role));
    });

    it("should get staked Odysseys list", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      let staked_odysseys = await staking.callStatic.get_staked_odysseys();

      expect(staked_odysseys.length).to.be.eq(0);

      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);

      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)

      staked_odysseys = await staking.callStatic.get_staked_odysseys();

      expect(staked_odysseys.length).to.be.eq(1);
    });

    it("should get staked_by list", async function () {
      const { staking, momToken, addr0 } = await loadFixture(deployStaking);
      const amount = 1000;
      const odyssey_id = "0xe276ba1dff024fd28fcff53b6d93028a";

      let staked_by = await staking.callStatic.get_staked_by(odyssey_id);

      expect(staked_by.length).to.be.eq(0);

      
      await momToken.mint(addr0.address, amount);
      await momToken.connect(addr0).approve(staking.address, amount);

      await staking.connect(addr0).stake(odyssey_id, amount, Token.MOM)

      staked_by = await staking.callStatic.get_staked_by(odyssey_id);

      // Expected 2 because we do not use index 0
      expect(staked_by.length).to.be.eq(2);
    });
  });
});
