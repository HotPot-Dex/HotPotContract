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


    it("Test Stake Pool", async () => {
        console.log("Stake test start");
        if (!this.testStake) {
            return;
        }
        var stakepool = this.stakePool['usdt'];
        console.log("usdt pool address = " + stakepool.address);
        var pb = await stakepool.getPoolBalance();
        console.log("pb=" + pb / 10 ** 18);

        var pb2 = await this.hotpot.balanceOf(stakepool.address);
        console.log("pb2=" + pb2 / 10 ** 18);

        var starttime = await stakepool.starttime();
        var now = Math.floor(((new Date()).getTime()) / 1000);
        console.log("starttime=" + starttime + ",now=" + now + ",delay=" + (now - starttime));

        var blocktime = await stakepool.getBlockTime();
        console.log("block time=" + blocktime);

        var approveStr = '100000000000000000000000000000';
        var str100 = '100000000000000000000';
        var str200 = '200000000000000000000';
        var str1000 = '1000000000000000000000';

        var stakeAmount = [
            str100,
            str100,
            str200
        ];

        var stakeAmount = this.stakePoolAmount['usdt'];
        var firstweek = stakeAmount.mult(30).div(100);

        // blocktime: 1603291790 
        // starttime: 1603250988
        // now=       1603247390
        var finish = await stakepool.periodFinish();
        console.log("periodFinish=" + finish);

        if (starttime > now) {
            // await expectRevert(this.core.addLiquidity({ from: clean }), "Liquidity Generation Event over");
            console.log("not start");
            await expectRevert(stakepool.stake(str100), "not start");
            console.log("not start finish");
        }

        await time.increase(3700);

        now = Math.floor(((new Date()).getTime()) / 1000);
        console.log("new starttime=" + starttime + ",now=" + now + ",delay=" + (now - starttime));

        console.log("Test no approve error");
        await expectRevert(stakepool.stake(str100), "ERC20: transfer amount exceeds allowance");

        var usdt = this.stakeERC['usdt'];
        await usdt.approve(stakepool.address, approveStr);
        console.log("approve test");
        await stakepool.stake(str100);

        await usdt.approve(stakepool.address, approveStr, { from: this.staker1 });

        console.log("test no stake token error");
        await expectRevert(stakepool.stake(str100, { from: this.staker1 }), "ERC20: transfer amount exceeds balance");

        var balance0 = await usdt.balanceOf(accounts[0]);
        var balance1 = await usdt.balanceOf(accounts[1]);

        console.log("balance0=" + balance0 / 10 ** 18 + ",balance1=" + balance1 / 10 ** 18);

        await usdt.transfer(this.staker1, str1000);

        console.log("test stake by account1");
        await stakepool.stake(str100, { from: this.staker1 });

        await usdt.approve(stakepool.address, approveStr, { from: this.staker2 });

        await usdt.transfer(this.staker2, str1000);

        await stakepool.stake(str200, { from: this.staker2 });

        var totalstake = await this.stakeERC['usdt'].balanceOf(stakepool.address);
        // totalstake = totalstake.div(10**18);
        console.log("total stake=" + totalstake / 10 ** 18);

        await time.increase(3600);

        var earned0 = await stakepool.earned(accounts[0]);
        var earned1 = await stakepool.earned(this.staker1);
        var earned2 = await stakepool.earned(this.staker2);
        var earneddev = await stakepool.earned(accounts[1]);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2) + ",edev=" + bn2String(earneddev));

        await stakepool.getRewardFree({ from: this.staker0 });
        await stakepool.getRewardFree({ from: this.staker1 });
        await stakepool.getRewardFree({ from: this.staker2 });

        var sb0 = await this.hotpot.balanceOf(this.staker0);
        var sb1 = await this.hotpot.balanceOf(this.staker1);
        var sb2 = await this.hotpot.balanceOf(this.staker2);

        var rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        var get0 = earned0 * 70 / 100 * 5 / 100;
        var get1 = earned1 * 70 / 100 * 5 / 100;
        var get2 = earned2 * 70 / 100 * 5 / 100;

        var getrb = earned0 * 30 / 100 * 5 / 100
            + earned1 * 30 / 100 * 5 / 100 + earned2 * 30 / 100 * 5 / 100;


        console.log("get0=" + bn2String(get0) + "," + "get1=" + bn2String(get1) + "," +
            "get2=" + bn2String(get2) + "," + "getrb=" + bn2String(getrb));


        // assert.equal(sb0 / 10 ** 18, get0 / 10 ** 18);
        // assert.equal(sb1 / 10 ** 18, get1 / 10 ** 18);
        // assert.equal(sb2 / 10 ** 18, get2 / 10 ** 18);
        // assert.equal(rb / 10 ** 18, getrb / 10 ** 18);

        console.log("get reward finish");

        console.log("get reward within 24 hours");
        await expectRevert(stakepool.getRewardFree({ from: this.staker0 }), "You get reward within 24 hours!");
        await expectRevert(stakepool.getRewardFree({ from: this.staker1 }), "You get reward within 24 hours!");
        await expectRevert(stakepool.getRewardFree({ from: this.staker2 }), "You get reward within 24 hours!");

        console.log("get reward within 24 hours finish");
        await time.increase(3600 * 23);

        console.log("get reward after 23 hours");
        //You get reward within 24 hours!

        await expectRevert(stakepool.getRewardFree({ from: this.staker0 }), "You get reward within 24 hours!");

        await expectRevert(stakepool.getRewardFree({ from: this.staker1 }), "You get reward within 24 hours!");

        await expectRevert(stakepool.getRewardFree({ from: this.staker2 }), "You get reward within 24 hours!");

        var lastRewardTime = await stakepool.lastRewardTime(accounts[0]);
        console.log("lastRewardTime=" + lastRewardTime);

        await time.increase(3601);

        blocktime = await stakepool.getBlockTime();
        console.log("getBlockTime=" + blocktime + ",delay=" + (lastRewardTime + 86400 - blocktime));


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));

        await stakepool.getRewardFree({ from: accounts[0] });
        await stakepool.getRewardFree({ from: this.staker1 });
        await stakepool.getRewardFree({ from: this.staker2 });

        sb0 = await this.hotpot.balanceOf(this.staker0);
        sb1 = await this.hotpot.balanceOf(this.staker1);
        sb2 = await this.hotpot.balanceOf(this.staker2);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        await time.increase(86400 * 6);

        console.log("one week later");
        blocktime = await stakepool.getBlockTime();
        console.log("getBlockTime=" + blocktime + ",finish delay=" + (finish - blocktime));


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));

        console.log("user0 claim");
        await stakepool.getRewardFree({ from: accounts[0] });
        sb0 = await this.hotpot.balanceOf(this.staker0);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        console.log("owner notifyRewardAmount");
        var amount = new BigNumber(this.stakePoolAmount['usdt']);
        var secondWeek = amount.mult(15).div(100);
        await stakepool.notifyRewardAmount(secondWeek);


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));


        console.log("user1 claim");
        await stakepool.getRewardFree({ from: this.staker1 });
        sb1 = await this.hotpot.balanceOf(this.staker1);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        console.log("one day later");
        await time.increase(86400);


        console.log("user2 claim");
        await stakepool.getRewardFree({ from: this.staker2 });
        sb2 = await this.hotpot.balanceOf(this.staker2);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));


        await time.increase(86400 * 6);

        console.log("one week later");
        blocktime = await stakepool.getBlockTime();
        console.log("getBlockTime=" + blocktime + ",finish delay=" + (finish - blocktime));


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));

        console.log("user0 claim");
        await stakepool.getRewardFree({ from: accounts[0] });
        sb0 = await this.hotpot.balanceOf(this.staker0);

        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "sb1=" + bn2String(sb1) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        console.log("owner notifyRewardAmount");
        var amount = new BigNumber(this.stakePoolAmount['usdt']);
        var secondWeek = amount.mult(15).div(100);
        await stakepool.notifyRewardAmount(secondWeek);


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));

        var nftcount = await this.nft.balanceOf(accounts[0]);
        

        var g1 = await this.nft.getGrade(1);
        console.log("nftcount="+nftcount+",grade="+g1);
        var g2 = await this.nft.getGrade(2);
        console.log("nftcount="+nftcount+",grade="+g2);
        var g3 = await this.nft.getGrade(3);
        console.log("nftcount="+nftcount+",grade="+g3);

        await stakepool.getRewardByNFT(1);


        sb0 = await this.hotpot.balanceOf(this.staker0);
        rb = await this.hotpot.balanceOf(this.reward.address);
        var devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("sb0=" + bn2String(sb0) + "," + "devb=" + bn2String(devb) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        await expectRevert(stakepool.getRewardByNFT(1),"This ticket is used within 24 hours!");
        await expectRevert(stakepool.getRewardByNFT(1,{from:accounts[1]}),"This ticket is used within 24 hours!");
        await expectRevert(stakepool.getRewardByNFT(2,{from:accounts[1]}),"You do not have right to use this token!");

        await time.increase(3600);
        console.log("3600 later");
        await expectRevert(stakepool.getRewardByNFT(1),"This ticket is used within 24 hours!");
     
        await time.increase(86000);


        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));


        console.log("86000 later");

        console.log("\n")
        console.log("before claim0");
        console.log("\n")

        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));


        sb0 = await this.hotpot.balanceOf(this.staker0);
        rb = await this.hotpot.balanceOf(this.reward.address);
        var devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("sb0=" + bn2String(sb0) + "," + "devb=" + bn2String(devb) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        console.log("\n")
        console.log("start claim0");
        console.log("\n")

        await stakepool.getRewardByNFT(1);


        console.log("\n")
        console.log("before claim1");
        console.log("\n")

        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));


        sb0 = await this.hotpot.balanceOf(this.staker0);
        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "devb=" + bn2String(devb) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        console.log("\n")
        console.log("start claim1");
        console.log("\n")

        await stakepool.getRewardByNFT(2);


        console.log("\n")
        console.log("before claim2");
        console.log("\n")

        earned0 = await stakepool.earned(accounts[0]);
        earned1 = await stakepool.earned(this.staker1);
        earned2 = await stakepool.earned(this.staker2);

        console.log("e0=" + bn2String(earned0) + ",e1=" + bn2String(earned1) + ",e2=" + bn2String(earned2));


        sb0 = await this.hotpot.balanceOf(this.staker0);
        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "devb=" + bn2String(devb) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));


        console.log("\n")
        console.log("start claim2");
        console.log("\n")

        await stakepool.getRewardByNFT(3);

        
        sb0 = await this.hotpot.balanceOf(this.staker0);
        rb = await this.hotpot.balanceOf(this.reward.address);

        console.log("sb0=" + bn2String(sb0) + "," + "devb=" + bn2String(devb) + ","
            + "sb2=" + bn2String(sb2) + "," + "rb=" + bn2String(rb));

        await expectRevert(this.reward.getReward(1),"This ticket is used within 24 hours!");

        await time.increase(86401);

        await this.reward.getReward(1);
        

        await expectRevert(stakepool.getRewardByNFT(1),"This ticket is used within 24 hours!");

        var total1 = await this.nft.balanceOf(accounts[1]);



    });


});