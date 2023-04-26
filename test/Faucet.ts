import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token } from "./utils";

describe("Faucet", function () {
  async function deployFaucet() {
    const initialSupply = 1000;
    const [owner, addr0] = await ethers.getSigners();
    const amount = 1000;

    const MOMToken = await ethers.getContractFactory("MOMToken");
    const momToken = await MOMToken.deploy(initialSupply);

    const DADToken = await ethers.getContractFactory("DADToken");
    const dadToken = await DADToken.deploy();

    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(momToken.address, dadToken.address, amount);

    await momToken.grantRole(momToken.MINTER_ROLE(), faucet.address);
    await dadToken.grantRole(dadToken.MINTER_ROLE(), faucet.address);

    return { faucet, amount, owner, addr0, momToken, dadToken };
  }

    describe("Deployment", async function () {
        it("should deploy and set the correct amount, owner and contract addresses", async function () {
            const { faucet, amount, owner, momToken, dadToken } = await loadFixture(deployFaucet);
            
            expect(await faucet.owner()).to.equal(owner.address);
            expect(await faucet.amount()).to.equal(amount);
            expect(await faucet.mom_token()).to.equal(momToken.address);
            expect(await faucet.dad_token()).to.equal(dadToken.address);
        });
    });
    
    describe("Owner role", async function () {
        it("should set attributes", async function () {
            const { faucet, amount, momToken, dadToken } = await loadFixture(deployFaucet);
            
            expect(await faucet.amount()).to.equal(amount);
            await faucet.set_amount(0);
            expect(await faucet.amount()).to.equal(0);

            expect(await faucet.cooldown_period()).to.equal(time.duration.days(1));
            await faucet.set_cooldown_period(0);
            expect(await faucet.cooldown_period()).to.equal(0);

            expect(await faucet.mom_token()).to.equal(momToken.address);
            await faucet.set_mom_address(ethers.constants.AddressZero);
            expect(await faucet.mom_token()).to.equal(ethers.constants.AddressZero);

            expect(await faucet.dad_token()).to.equal(dadToken.address);
            await faucet.set_dad_address(ethers.constants.AddressZero);
            expect(await faucet.dad_token()).to.equal(ethers.constants.AddressZero);
        });
    });

    describe("Token generation", async function () {
        it("should generate the amount of MOM tokens", async function () {
            const { faucet, amount, addr0, momToken } = await loadFixture(deployFaucet);
            
            await expect(await momToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.MOM);
            await expect(await momToken.balanceOf(addr0.address)).to.equal(amount);
        });

        it("should generate the amount of MOM tokens after the cooldown period", async function () {
            const { faucet, amount, addr0, momToken } = await loadFixture(deployFaucet);
            
            await expect(await momToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.MOM);
            await expect(await momToken.balanceOf(addr0.address)).to.equal(amount);
            await time.increaseTo(await time.latest() + time.duration.days(1));
            await expect(faucet.connect(addr0).get_tokens(Token.MOM)).not.to.be.reverted;
            await expect(await momToken.balanceOf(addr0.address)).to.equal(amount*2);
        });

        it("should revert when trying to get MOM tokens on the cooldown period", async function () {
            const { faucet, amount, addr0, momToken } = await loadFixture(deployFaucet);
            
            await expect(await momToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.MOM);
            await expect(await momToken.balanceOf(addr0.address)).to.equal(amount);
            await expect(faucet.connect(addr0).get_tokens(Token.MOM)).to.revertedWith('Too soon to get more tokens');;
        });
        
        it("should generate the amount of DAD tokens", async function () {
            const { faucet, amount, addr0, dadToken } = await loadFixture(deployFaucet);
            
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.DAD);
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(amount);
        });

        it("should generate the amount of DAD tokens after the cooldown period", async function () {
            const { faucet, amount, addr0, dadToken } = await loadFixture(deployFaucet);
            
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.DAD);
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(amount);
            await time.increaseTo(await time.latest() + time.duration.days(1));
            await expect(faucet.connect(addr0).get_tokens(Token.DAD)).not.to.be.reverted;
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(amount*2);
        });

        it("should revert when trying to get DAD tokens on the cooldown period", async function () {
            const { faucet, amount, addr0, dadToken } = await loadFixture(deployFaucet);
            
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(0);
            await faucet.connect(addr0).get_tokens(Token.DAD);
            await expect(await dadToken.balanceOf(addr0.address)).to.equal(amount);
            await expect(faucet.connect(addr0).get_tokens(Token.DAD)).to.revertedWith('Too soon to get more tokens');;
        });
    });

});
