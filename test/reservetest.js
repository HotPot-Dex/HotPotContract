const Web3 = require('web3');
const BigNumber = require('big-number');
const NFT = artifacts.require("NFTokenHotPot");
const StakePool = artifacts.require("StakePool");
const Gacha = artifacts.require("Gacha");
const Reward = artifacts.require("Reward");
const Market = artifacts.require("NFTMarket");
const HotPot = artifacts.require("HotPot");
const StakeERC = artifacts.require("StakeERC20");
const Loan = artifacts.require("Loan");
const Reserve = artifacts.require("ReservePool");
const { expectRevert, time } = require('@openzeppelin/test-helpers');


contract("ReservePool", (accounts) => {

    beforeEach(async () => {
        this.price = 20 * 10 ** 18;
        this.posibility = 8;

        this.testStake=true;
        this.testGacha = false;
        this.generateNFT = true;


        this.approveStr = '100000000000000000000000000000';
        this.str100 = '100000000000000000000';
        this.str200 = '200000000000000000000';
        this.str1000 = '1000000000000000000000';
        this.str10000 = '10000000000000000000000';


        this._devAddress = accounts[1];
        this.creator = accounts[0];
        this.staker0 = accounts[0];
        this.staker1 = accounts[2];
        this.staker2 = accounts[3];

        this.hotpot = await HotPot.new();
        this.reserve = await Reserve.new(this.hotpot.address);
        this.hotpot2 = await HotPot.new();


    });

    it("Reserve Test", async () => {
        await this.hotpot.transfer(this.reserve.address,this.str200);

        var b = await this.hotpot.balanceOf(this.reserve.address);
        assert.equal(b,this.str200,"not equal");

        await this.reserve.transfer(this.hotpot2.address,this.str100);

        var b2 = await this.hotpot.balanceOf(this.hotpot2.address);
        assert.equal(b2,this.str100,"not equal");

        b = await this.hotpot.balanceOf(this.reserve.address);
        assert.equal(b,this.str100,"not equal");

    });
});