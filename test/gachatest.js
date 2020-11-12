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
const { expectRevert, time } = require('@openzeppelin/test-helpers');

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

        this.testStake=true;
        this.testGacha = false;
        this.generateNFT = true;


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
        this.staker0 = accounts[0];
        this.staker1 = accounts[2];
        this.staker2 = accounts[3];

        this.hotpot = await HotPot.new();
        this.nft = await NFT.new(nftName, nftShort);
        this.reward = await Reward.new(this._devAddress, this.nft.address, this.hotpot.address);
        this.loan = await Loan.new(this.nft.address, this.hotpot.address);

        await this.loan.setRewardAddress(this.reward.address);
        await this.loan.setDevAddress(this._devAddress);

        await this.reward.setLoan(this.loan.address);

        let strvalue = Web3.utils.toHex(this.price);

        this.gacha = await Gacha.new(strvalue, this.posibility, this.reward.address, this.nft.address, this.hotpot.address);

        this.market = await Market.new(this.reward.address, this.nft.address, this.hotpot.address, this._devAddress);

        // console.log("h1=" + this.hotpot.address + ",h2=" + HotPot.address);

        this.nft.setReward(this.reward.address);
        this.nft.setExchange(this.market.address);
        this.nft.setGacha(this.gacha.address);

    });

    it("Gacha Test", async () => {
        console.log("Gacha test");


        await this.hotpot.approve(this.gacha.address, this.approveStr);
        await this.gacha.pull();

        if (!this.testGacha) {
            return;
        }
        var sb0 = await this.hotpot.balanceOf(this.staker0);
        console.log("Gacha sb0=" + bn2String(sb0));

        var user0 = accounts[0];
        var user1 = accounts[1];
        var user2 = accounts[2];
        var user3 = accounts[3];

        await this.hotpot.approve(this.gacha.address, this.approveStr);

        console.log("transfer hotpot");
        await this.hotpot.transfer(user1, this.str100);
        await this.hotpot.transfer(user2, this.str1000);
        await this.hotpot.transfer(user3, this.str10000);

        var ub0 = await this.hotpot.balanceOf(user0);
        assert.equal(ub0 / 10 ** 18, 1000000 - 100 - 1000 - 10000, "ub0 error");


        console.log("start pull");
        await this.gacha.pull();
        await this.gacha.pull();
        await this.gacha.pull();
        await this.gacha.pull();

        var uft0 = await this.nft.balanceOf(user0);
        console.log("uft0=" + uft0);
        ub0 = await this.hotpot.balanceOf(user0);
        assert.equal(ub0 / 10 ** 18, 1000000 - 100 - 1000 - 10000 - 4 * this.price/10**18, "ub0 error");

        await this.gacha.pull();
        await this.gacha.pull();
        await this.gacha.pull();
        await this.gacha.pull();
        await this.gacha.pull();

        ub0 = await this.hotpot.balanceOf(user0);
        assert.equal(ub0 / 10 ** 18, 1000000 - 100 - 1000 - 10000 - 9 * this.price/10**18, "ub0 error");

        uft0 = await this.nft.balanceOf(user0);
        console.log("uft0=" + uft0);

        var rb = await this.hotpot.balanceOf(this.reward.address);
        assert(rb / 10 ** 18, 9 * this.price/10**18, "rb error");

        var ub1 = await this.hotpot.balanceOf(user1);

        assert.equal(ub1, 100 * 10 ** 18, "balance error");

        await this.gacha.pull10();

        var uft0 = await this.nft.balanceOf(user0);
        console.log("uft0=" + uft0);


        var ub1 = await this.hotpot.balanceOf(user1);
        console.log("ub1=" + bn2String(ub1));
        // assert.equal(ub1/10**18,0,"ub1 error");

        await expectRevert(this.gacha.pull({ from: user1 }), "ERC20: transfer amount exceeds allowance");

        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: user1 });

        await this.gacha.pull({ from: user1 });

        var uft1 = await this.nft.balanceOf(user1);
        console.log("uft1=" + uft1);

        ub1 = await this.hotpot.balanceOf(user1);
        assert.equal(ub1 / 10 ** 18, 80, "ub1 error");

        // await expectRevert(this.gacha.pull({ from: user1 }), "Wallet balance is not enough!");


        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: user3 });

        await this.gacha.pull10({ from: user3 });

        var uft3 = await this.nft.balanceOf(user3);
        console.log("uft3=" + uft3);

        await this.gacha.pull10({ from: user3 });

        uft3 = await this.nft.balanceOf(user3);
        console.log("uft3=" + uft3);

        // getGradeCount
        var count1 = await this.nft.getGradeCount(1);
        var count2 = await this.nft.getGradeCount(2);
        var count3 = await this.nft.getGradeCount(3);
        console.log("count1=" + count1 + "," + "count2=" + count2 + "," + "count3=" + count3);

        var totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);

        var p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);

        p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);

        // getGradeCount
        count1 = await this.nft.getGradeCount(1);
        count2 = await this.nft.getGradeCount(2);
        count3 = await this.nft.getGradeCount(3);
        console.log("count1=" + count1 + "," + "count2=" + count2 + "," + "count3=" + count3);

        rb = await this.hotpot.balanceOf(this.reward.address);
        console.log("rb=" + bn2String(rb));


        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();


        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);


        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();


        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);


        p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);


        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();


        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);


        p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);


        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();


        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);


        p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);

        rb = await this.hotpot.balanceOf(this.reward.address);
        console.log("rb=" + bn2String(rb));


        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();

        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();
        await this.gacha.pull10();


        totalnft = await this.nft.totalSupply();
        console.log("total nft=" + totalnft);


        p = await this.gacha.getPosibilityNow();
        console.log("p=" + p);

        rb = await this.hotpot.balanceOf(this.reward.address);
        console.log("rb=" + bn2String(rb));

        // getGradeCount
        count1 = await this.nft.getGradeCount(1);
        count2 = await this.nft.getGradeCount(2);
        count3 = await this.nft.getGradeCount(3);
        console.log("count1=" + count1 + "," + "count2=" + count2 + "," + "count3=" + count3);

    });

});