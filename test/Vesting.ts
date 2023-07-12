import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { utils } from "./utils"
import { Staking, Vesting } from "../typechain-types";
import { staking } from "../typechain-types/contracts";

describe("Vesting", function () {
  async function deployVesting() {
    const name = 'Odyssey_NFT';
    const symbol = 'ODS';
    const maxOdysseySupply = 21000;
    const maxTokensPerWallet = 150;
    const URI =  "ipfs://";
    const total_parts = 36;
    const [owner, addr0] = await ethers.getSigners();

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();
    await dadToken.deployed();

    const starting_date = await time.latest() + time.duration.days(1);
    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(dadToken.address, starting_date);
    await vesting.deployed();

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(10000, vesting.address, dadToken.address);
    await momToken.deployed();

    await vesting.set_mom_address(momToken.address);

    await dadToken.grantRole(dadToken.BURNER_ROLE(), vesting.address);
    await dadToken.grantRole(dadToken.MINTER_ROLE(), momToken.address);
    await momToken.grantRole(momToken.MINTER_ROLE(), vesting.address);
    await vesting.grantRole(vesting.UPDATER_ROLE(), owner.address);

    return { vesting, momToken, dadToken, owner, addr0, starting_date };
  }

  describe("Constructor", function () {
      it("should set the right token contract addresses", async function () {
          const { vesting, momToken, dadToken, starting_date } = await loadFixture(deployVesting);
        
          expect(await vesting.mom_token()).to.eq(momToken.address);
          expect(await vesting.dad_token()).to.eq(dadToken.address);
          expect(await vesting.starting_date()).to.eq(starting_date);
          expect(await vesting.end_date()).to.eq(starting_date + time.duration.days(730));
      });

      it("should fail if any input is 0", async function () {
        const { dadToken, starting_date } = await loadFixture(deployVesting);
      
        const Vesting = await ethers.getContractFactory("Vesting");
        await expect(Vesting.deploy(dadToken.address, 0)).to.be.reverted;
        await expect(Vesting.deploy(ethers.constants.AddressZero, starting_date)).to.be.reverted;
    });
  });

  describe("Holders", function () {
    it("should update holder address and set current time as last claim", async function () {
        const { vesting, dadToken, owner, addr0 } = await loadFixture(deployVesting);
        const amount = 1000;
        
        await dadToken.connect(owner).mint(addr0.address, amount);
        
        await time.increase(time.duration.days(2));

        await expect(await vesting.update_holder(addr0.address, amount)).to.emit(vesting, "HolderUpdated")
                      .withArgs(addr0.address, amount, await time.latest());

    });

    it("should update holder set starting date as last claim", async function () {
      const { vesting, dadToken, owner, addr0, starting_date } = await loadFixture(deployVesting);
      const amount = 1000;
      
      await dadToken.connect(owner).mint(addr0.address, amount);
      
      await expect(await vesting.update_holder(addr0.address, amount)).to.emit(vesting, "HolderUpdated")
                    .withArgs(addr0.address, amount, starting_date);

    });

    it("should not update holder if holder address is 0", async function () {
      const { vesting, dadToken, owner, addr0, starting_date } = await loadFixture(deployVesting);
      const amount = 1000;
      
      await expect(vesting.update_holder(ethers.constants.AddressZero, amount)).to.revertedWith("Holder address or amount cannot be 0");

    });

    it("should not update holder if amount is 0", async function () {
      const { vesting, dadToken, owner, addr0, starting_date } = await loadFixture(deployVesting);
      const amount = 0;
      
      await dadToken.connect(owner).mint(addr0.address, amount);
      
      await expect(vesting.update_holder(addr0.address, 0)).to.revertedWith("Holder address or amount cannot be 0");
    });
  });

  describe("Redeem", function () {
    it("should redeem tokens", async function () {
        const { vesting, dadToken, momToken, owner, addr0 } = await loadFixture(deployVesting);
        const timestamp = await time.latest();
        const amount = 1000;

        await vesting.update_holder(addr0.address, amount);
        await time.increaseTo(timestamp + time.duration.years(1));

        await dadToken.connect(owner).mint(addr0.address, amount);
        await dadToken.connect(addr0).approve(vesting.address, amount);
        await momToken.connect(owner).mint(vesting.address, amount);
        
        await expect(await vesting.connect(addr0).redeem_tokens()).to.emit(vesting, "Redeemed")
                      .withArgs(addr0.address, 498);

        expect(await dadToken.balanceOf(addr0.address)).to.lt(amount);
        expect(await momToken.balanceOf(addr0.address)).to.gt(0);
    });

    it("should redeem all tokens if vesting has ended", async function () {
      const { vesting, dadToken, momToken, owner, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();
      const amount = 1000;

      await vesting.update_holder(addr0.address, amount);
      await time.increaseTo(timestamp + time.duration.years(3));

      await dadToken.connect(owner).mint(addr0.address, amount);
      await dadToken.connect(addr0).approve(vesting.address, amount);
      await momToken.connect(owner).mint(vesting.address, amount);
      
      await expect(await vesting.connect(addr0).redeem_tokens()).to.emit(vesting, "Redeemed")
                      .withArgs(addr0.address, amount);

      expect(await dadToken.balanceOf(addr0.address)).to.eq(0);
      expect(await momToken.balanceOf(addr0.address)).to.eq(amount);
  });

    it("should not redeem tokens if MOM address was not set", async function () {
      const { dadToken, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();

      const starting_date = await time.latest() + time.duration.days(1);
      const Vesting = await ethers.getContractFactory("Vesting");
      const vesting = await Vesting.deploy(dadToken.address, starting_date);
      await vesting.deployed();

      await time.increaseTo(timestamp + time.duration.days(5));

      await expect(vesting.connect(addr0).redeem_tokens()).to.revertedWith("MOM address is not set yet");
    });

    it("should not redeem tokens if there is no tokens to redeem", async function () {
      const { vesting, dadToken, owner, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();

      await time.increaseTo(timestamp + time.duration.days(5));

      await expect(vesting.connect(addr0).redeem_tokens()).to.revertedWith("Nothing to redeem at this moment");
    });

    it("should not redeem tokens if there not enough balance to burn", async function () {
      const { vesting, dadToken, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();
      const amount = 1000;

      await vesting.update_holder(addr0.address, amount);
      await time.increaseTo(timestamp + time.duration.days(5));

      await expect(vesting.connect(addr0).redeem_tokens()).to.revertedWith("Not enough balance to burn");
    });
    
    it("should not redeem tokens if there not enough alowance", async function () {
      const { vesting, dadToken, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();
      const amount = 1000;

      await vesting.update_holder(addr0.address, amount);

      await time.increaseTo(timestamp + time.duration.days(5));

      await dadToken.connect(addr0).approve(vesting.address, 1);
      await dadToken.mint(addr0.address, amount);

      await expect(vesting.connect(addr0).redeem_tokens()).to.revertedWith("Allowance is needed");
    });

    it("should not redeem tokens if vesting has not started yet", async function () {
      const { vesting, dadToken, addr0 } = await loadFixture(deployVesting);
      const timestamp = await time.latest();
      const amount = 1000;

      await vesting.update_holder(addr0.address, amount);

      await dadToken.connect(addr0).approve(vesting.address, 1);
      await dadToken.mint(addr0.address, amount);

      await expect(vesting.connect(addr0).redeem_tokens()).to.revertedWith("Vesting not started");
    });
  });

  describe("Utils", function () {
    it("should not set mom address more than one time", async function () {
      const { vesting, owner } = await loadFixture(deployVesting);

      await expect(vesting.set_mom_address(vesting.address)).to.revertedWith("MOM address was set already or address is 0");
    });

    it("should not set mom address if 0", async function () {
      const { dadToken } = await loadFixture(deployVesting);

      const starting_date = await time.latest() + time.duration.days(1);
      const Vesting = await ethers.getContractFactory("Vesting");
      const vesting = await Vesting.deploy(dadToken.address, starting_date);
      await vesting.deployed();

      await expect(vesting.set_mom_address(ethers.constants.AddressZero)).to.revertedWith("MOM address was set already or address is 0");
    });

    it("shold emit MOM address updated event", async function () {
      const { dadToken, momToken, starting_date } = await loadFixture(deployVesting);
      const Vesting = await ethers.getContractFactory("Vesting");
      const vesting = await Vesting.deploy(dadToken.address, starting_date);
      await vesting.deployed();

      await expect(await vesting.set_mom_address(momToken.address)).to.emit(vesting, "MOMAddressUpdated").withArgs(momToken.address);
    });
  });

});
