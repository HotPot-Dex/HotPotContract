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

        this.testStake=true;
        this.testGacha = true;
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
            for (var i = 0; i < 10; i++) {
                await this.gacha.pull10();
            }
            var total = await this.nft.totalSupply();
            console.log("total nft="+total);

            await this.hotpot.transfer(accounts[1],this.str10000);
            await this.hotpot.approve(this.gacha.address, this.approveStr,{from:accounts[1]});
            for (var i = 0; i < 10; i++) {
                await this.gacha.pull10({from:accounts[1]});
            }
            var total = await this.nft.totalSupply({from:accounts[1]});
            console.log("total nft="+total);
        }
    });

    it("Test Reward", async () => {
        if(!this.generateNFT){
            var rb = await this.hotpot.balanceOf(this.reward.address);
            console.log("rb="+rb);
            assert.equal(rb, 0, "rb error");
    
            var rr = await this.reward.calNormalReward(0);
            console.log("rr="+rr);
            assert.equal(rr, 0, "rr error");
    
            await this.hotpot.transfer(this.reward.address, this.str100);
    
            rb = await this.hotpot.balanceOf(this.reward.address);
            assert.equal(rb, 100 * 10 ** 18, "rb error");
    
            rr = await this.reward.calNormalReward(0);
            assert.equal(rr, 0, "rr error");
    
            await expectRevert(this.nft.setGacha(accounts[0]), "It's not contract address!");
    
            // await expectRevert(this.reward.getReward(0),"It is not a NFT token!");
            // await expectRevert(this.reward.getReward(1),"It is not a NFT token!");
    
            console.log("calNormalReward="+rr);
        }else{
            var rb = await this.hotpot.balanceOf(this.reward.address);
            console.log("rb="+bn2String(rb));

            var rr = await this.reward.calNormalReward(1);
            console.log("rr="+bn2String(rr));

            var grade = await this.nft.getGrade(1);
            console.log("token1 grade="+grade);

            var grade1 = await this.nft.getGradeCount(1);
            console.log("grade1="+grade1);
            var grade2 = await this.nft.getGradeCount(2);
            console.log("grade2="+grade2);
            var grade3 = await this.nft.getGradeCount(3);
            console.log("grade3="+grade3);
            

            await this.hotpot.transfer(this.reward.address, this.str100);
            rb = await this.hotpot.balanceOf(this.reward.address);
            console.log("rb="+bn2String(rb));

            rr = await this.reward.calNormalReward(1);
            console.log("rr="+bn2String(rr));

            await this.reward.getReward(1);

            await expectRevert(this.reward.getReward(1),"This ticket is used within 24 hours!");

            await expectRevert(this.reward.getReward(2,{from:accounts[1]}),"You do not have right to use this token!");

            
        }

    });

});