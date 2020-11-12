const Web3 = require('web3');
const NFT = artifacts.require("NFTokenHotPot");
const BigNumber = require("big-number");
const BN = require('bn.js');
const web3Utils = require("web3-utils");
const StakePool = artifacts.require("StakePool");
const Gacha = artifacts.require("Gacha");
const Reward = artifacts.require("Reward");
const Market = artifacts.require("NFTMarket");
const HotPot = artifacts.require("HotPot");
const StakeERC = artifacts.require("StakeERC20");
const Loan = artifacts.require("Loan");
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { grep } = require('jquery');
//1.Stake
//2.Gacha
//3.Reward
//4.Market
//5.Loan

function bn2String(params) {
    return (params / 10 ** 18).toFixed(6);
}

contract("NFTokenHotPot", (accounts) => {

    beforeEach(async () => {
        this.price = 20 * 10 ** 18;
        this.posibility = 8;

        this.testStake = true;
        this.testReward = true;
        this.generateNFT = true;
        this.testMarket = false;


        this.approveStr = '100000000000000000000000000000';
        this.str100 = '100000000000000000000';
        this.str200 = '200000000000000000000';
        this.str1000 = '1000000000000000000000';
        this.str10000 = '10000000000000000000000';

        var nftName = "nft";
        var nftShort = "nft";

        this.stakeERC = {};
        this.stakePool = {};
        this.stakePoolAmount = {}
        this.stakeTokens = [
            "ethusdt",
            'unieth',
            'usdt',
            'hotpot',
            'hotpoteth'
        ];

        for (var i = 0; i < this.stakeTokens.length; i++) {
            var token = this.stakeTokens[i];
            if (token == "hotpoteth") {
                this.stakePoolAmount[token] = BigNumber(630000).mult(10 ** 18);
            } else if (token == "hotpot") {
                this.stakePoolAmount[token] = BigNumber(160000).mult(10 ** 18);
            } else {
                this.stakePoolAmount[token] = BigNumber(70000).mult(10 ** 18);
            }
        }
        var timestamp = Math.floor((new Date("2020/10/20 10:00:00")).getTime() / 1000);

        timestamp = Math.floor((new Date()).getTime() / 1000) + 3600;
        var duration = 86400 * 7;



        this._devAddress = accounts[1];
        this.creator = accounts[0];
        this.user0 = accounts[0];
        this.user1 = accounts[2];
        this.user2 = accounts[3];

        this.hotpot = await HotPot.new();
        this.nft = await NFT.new(nftName, nftShort);
        this.reward = await Reward.new(this._devAddress, this.nft.address, this.hotpot.address);
        this.loan = await Loan.new(this.nft.address, this.hotpot.address);

        await this.loan.setRewardAddress(this.reward.address);
        await this.loan.setDevAddress(this._devAddress);

        await this.reward.setLoan(this.loan.address);

        let strvalue = Web3.utils.toHex(this.price);

        this.gacha = await Gacha.new(strvalue, this.posibility, this.reward.address, this.nft.address, this.hotpot.address);

        this.market = await Market.new(this.reward.address, this.nft.address, this.hotpot.address,this.loan.address, this._devAddress);

        // console.log("h1=" + this.hotpot.address + ",h2=" + HotPot.address);

        this.nft.setReward(this.reward.address);
        this.nft.setExchange(this.market.address);
        this.nft.setGacha(this.gacha.address);

        if (this.testStake) {
            for (var i = 0; i < this.stakeTokens.length; i++) {
                var token = this.stakeTokens[i];
                this.stakeERC[token] = await StakeERC.new();

                var amount = new BigNumber(this.stakePoolAmount[token]);
                var firstWeek = amount.mult(30).div(100);

                this.stakePool[token] = await StakePool.new(this.stakeERC[token].address, this.nft.address, this.hotpot.address, this.loan.address, this.reward.address, timestamp, duration, firstWeek);

                await this.nft.addPool(this.stakePool[token].address);

                await this.hotpot.transfer(this.stakePool[token].address, firstWeek.mult(2));
            }
        }

        if (this.generateNFT) {
            await this.hotpot.approve(this.gacha.address, this.approveStr);
            for (var i = 0; i < 5; i++) {
                await this.gacha.pull10();
            }
            var total = await this.nft.totalSupply();
            console.log("total nft=" + total);

            await this.hotpot.transfer(this.user1, this.str10000);

            await this.hotpot.transfer(this.user2, this.str10000);
            await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user1 });
            for (var i = 0; i < 5; i++) {
                await this.gacha.pull10({ from: this.user1 });
            }
            var total = await this.nft.totalSupply({ from: this.user1 });
            console.log("total nft=" + total);
        }

        if (this.testReward) {
            await this.hotpot.transfer(this.reward.address, this.str10000);
        }
    });

    it("Market Test", async () => {
        var listSize = await this.market.getListSize();
        var listToken = await this.market.getListToken();
        console.log("listSize=" + listSize + ",listToken=" + listToken);

        var timestamp = Math.floor(((new Date()).getTime())/1000);

        await this.nft.safeTransferFrom(accounts[0], this.market.address, 1, getPriceBytes(1000));

        var price = await this.market.priceOf(1);
        console.log("price is "+(price/(10**18)));

        await this.loan.deposit(2,1,this.str100);

        var sell = await this.loan.checkCanSell(2,timestamp);
        console.log("can sell="+sell);

        await expectRevert(this.nft.safeTransferFrom(accounts[0],this.market.address,2,getPriceBytes(100)),"This token is loaning1.");

        await time.increase(86401);

        await this.nft.safeTransferFrom(accounts[0],this.market.address,2,getPriceBytes(100));

        console.log("safeTransferFrom 0");

        await expectRevert(this.nft.safeTransferFrom(accounts[0], this.market.address, 3, getPriceBytes(0))
            , "Price must be greater than zero");

        await this.nft.safeTransferFrom(accounts[0], this.market.address, 3, getPriceBytes(200));

        listSize = await this.market.getListSize();
        listToken = await this.market.getListToken();

        console.log("listSize=" + listSize + ",listToken=" + listToken);

        assert.equal(listSize, 3, "size error");

        var price1 = await this.market.priceOf(1);
        console.log("price1=" + bn2String(price1));

        var price2 = await this.market.priceOf(2);
        console.log("price2=" + bn2String(price2));


        var owner = await this.nft.ownerOf(2);
        assert.equal(owner, this.market.address, "address error");

        await this.market.unlist(2);

        listSize = await this.market.getListSize();
        listToken = await this.market.getListToken();

        console.log("listSize=" + listSize + ",listToken=" + listToken);


        assert.equal(listSize, 2, "size error");

        await expectRevert(this.market.unlist(2), "Token ID is not listed");


        await this.nft.safeTransferFrom(accounts[0], this.market.address, 2, getPriceBytes(200));

        await expectRevert(this.market.unlist(2, { from: this.user2 }), "Sender is not seller");

        var ub0 = await this.hotpot.balanceOf(this.user0);

        var ub1 = await this.hotpot.balanceOf(this.user1);
        var db = await this.hotpot.balanceOf(this._devAddress);

        var rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("usb0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "db=" + bn2String(db) + ","
            + "rb=" + bn2String(rb));

        await this.hotpot.approve(this.market.address, this.approveStr);
        await this.market.swap(1);

        ub0 = await this.hotpot.balanceOf(this.user0);

        ub1 = await this.hotpot.balanceOf(this.user1);
        db = await this.hotpot.balanceOf(this._devAddress);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("usb0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "db=" + bn2String(db) + ","
            + "rb=" + bn2String(rb));

        // await this.loan.deposit(4,1,this.str100);
        
        // await this.nft.safeTransferFrom(accounts[0], this.market.address, 4, getPriceBytes(200));

        // await this.hotpot.approve(this.market.address,this.approveStr,{from:this.user1});
        // await this.market.swap(4,{from:this.user1});
        

        // ub1 = await this.hotpot.balanceOf(this.user1);
        // console.log("ub1="+bn2String(ub1));

        // await this.hotpot.approve(this.loan.address,this.approveStr,{from:this.user2});
        // await this.loan.borrow(4,1,{from:this.user2});


        // ub1 = await this.hotpot.balanceOf(this.user1);
        // console.log("ub1="+bn2String(ub1));

        
    });
});

function getPriceBytes(price) {
    var p = new BigNumber(price);
    p.mult(10**18);
    console.log("p="+p.toString());
    return web3Utils.padLeft(web3Utils.toHex(p.toString()), 64)
}