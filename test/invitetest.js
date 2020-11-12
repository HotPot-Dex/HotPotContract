const Invite = artifacts.require("Invite");
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

contract("Invite", (accounts) => {

    beforeEach(async () => {
        this.price = 20 * 10 ** 18;
        this.posibility = 8;

        this.testStake = false;
        this.testReward = false;
        this.generateNFT = false;


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


        this.invite = await Invite.new(this.nft.address);

        this.gacha = await Gacha.new(strvalue, this.posibility, this.reward.address, this.nft.address, this.hotpot.address, this.invite.address);


        this.invite.setValidContract(this.gacha.address);
        this.invite.setGenerateContract(this.gacha.address);

        this.market = await Market.new(this.reward.address, this.nft.address, this.hotpot.address, this.loan.address, this._devAddress);

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

                this.stakePool[token] = await StakePool.new(this.stakeERC[token].address, this.nft.address, this.hotpot.address, this.loan.address, this.reward.address, this.invite.address, timestamp, duration, firstWeek);

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
            console.log("total nft=" + total);

            await this.hotpot.transfer(this.user1, this.str10000);
            await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user1 });
            for (var i = 0; i < 10; i++) {
                await this.gacha.pull10({ from: this.user1 });
            }
            var total = await this.nft.totalSupply({ from: this.user1 });
            console.log("total nft=" + total);
        }

        if (this.testReward) {
            await this.hotpot.transfer(this.reward.address, this.str10000);
        }
    });


    it("Invite Test", async () => {
        console.log("Invite test");
        this.user0 = accounts[0];
        this.user1 = accounts[1];
        this.user2 = accounts[2];
        this.user3 = accounts[3];
        this.user4 = accounts[4];
        this.user5 = accounts[5];
        this.user6 = accounts[6];
        this.user7 = accounts[7];
        this.user8 = accounts[8];


        var invitenum = await this.invite.getInviteNum(accounts[0]);
        assert.equal(invitenum, 0, "invite num error");

        var calValidNum = await this.invite.calValidNum(this.user0);
        var calValidNum2 = await this.invite.calValidNum2(this.user0);
        assert.equal(calValidNum, 0, "invite num error");
        assert.equal(calValidNum2, 0, "invite num error");


        var mycode = await this.invite.getMyInviteCode(this.user0);
        console.log("my code=" + mycode);
        var inputcode = await this.invite.getInputInviteCode(this.user0);
        console.log("input code=" + inputcode);

        await expectRevert(this.invite.inputCode(1), "Invalid invite code.");

        await this.hotpot.approve(this.gacha.address, this.approveStr);
        await this.gacha.pull();
        mycode = await this.invite.getMyInviteCode(this.user0);
        console.log("my code=" + mycode);

        await expectRevert(this.invite.inputCode(mycode), "This is your invite code.");


        await this.hotpot.transfer(this.user1, this.str10000);
        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user1 });
        await this.gacha.pull({ from: this.user1 });

        var mycode1 = await this.invite.getMyInviteCode(this.user1);
        console.log("my code1=" + mycode1);

        await this.invite.inputCode(mycode, { from: this.user1 });


        invitenum = await this.invite.getInviteNum(accounts[0]);
        assert.equal(invitenum, 1, "invite num error");

        calValidNum = await this.invite.calValidNum(this.user0);
        calValidNum2 = await this.invite.calValidNum2(this.user0);
        assert.equal(calValidNum, 0, "invite num error");
        assert.equal(calValidNum2, 0, "invite num error");

        var calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        assert.equal(calRatioUpdate, 0, "invite num error");

        await this.gacha.pull({ from: this.user1 });

        invitenum = await this.invite.getInviteNum(accounts[0]);
        assert.equal(invitenum, 1, "invite num error");

        calValidNum = await this.invite.calValidNum(this.user0);
        calValidNum2 = await this.invite.calValidNum2(this.user0);
        assert.equal(calValidNum, 1, "invite num error");
        assert.equal(calValidNum2, 0, "invite num error");

        calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        assert.equal(calRatioUpdate, 5, "invite num error");

        var calRatioUpdate2 = await this.invite.calRatioUpdate(this.user1);
        assert.equal(calRatioUpdate2, 10, "invite num error");

        await this.invite.inputCode(mycode1, { from: this.user0 });

        calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        assert.equal(calRatioUpdate, 5, "invite num error");

        await this.gacha.pull();

        calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        assert.equal(calRatioUpdate, 15, "invite num error");

        await expectRevert(this.invite.inputCode(mycode, { from: this.user1 }), "You have invite code already.");

        await this.invite.inputCode(mycode, { from: this.user2 });
        await this.invite.inputCode(mycode, { from: this.user3 });
        await this.invite.inputCode(mycode, { from: this.user4 });
        await this.invite.inputCode(mycode, { from: this.user5 });

        await this.invite.inputCode(mycode, { from: this.user6 });
        await this.invite.inputCode(mycode, { from: this.user7 });

        invitenum = await this.invite.getInviteNum(accounts[0]);
        assert.equal(invitenum, 7, "invite num error");

        calValidNum = await this.invite.calValidNum(this.user0);
        calValidNum2 = await this.invite.calValidNum2(this.user0);
        assert.equal(calValidNum, 1, "invite num error");
        assert.equal(calValidNum2, 0, "invite num error");

        var total = await this.nft.totalSupply();
        console.log("nft total="+total);

        for(var i=0;i<50;i++){
            await this.gacha.pull10();
        }

        total = await this.nft.totalSupply();
        console.log("nft total="+total);

        await this.hotpot.transfer(this.user2, this.str100);
        await this.hotpot.transfer(this.user3, this.str100);

        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user2 });
        await this.gacha.pull({from:this.user2});

        total = await this.nft.totalSupply();
        console.log("nft total="+total);

        if(total>50){
            calValidNum = await this.invite.calValidNum(this.user0);
            calValidNum2 = await this.invite.calValidNum2(this.user0);
            assert.equal(calValidNum, 1, "invite num error");
            assert.equal(calValidNum2, 1, "invite num error");
        }else{
            calValidNum = await this.invite.calValidNum(this.user0);
            calValidNum2 = await this.invite.calValidNum2(this.user0);
            assert.equal(calValidNum, 2, "invite num error");
            assert.equal(calValidNum2, 0, "invite num error");
        }

        for(var i=0;i<50;i++){
            await this.gacha.pull10();
        }

        total = await this.nft.totalSupply();
        console.log("nft total="+total);

        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user3 });
        await this.gacha.pull({from:this.user3});

        calValidNum = await this.invite.calValidNum(this.user0);
        calValidNum2 = await this.invite.calValidNum2(this.user0);
        calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        console.log("calValidNum="+calValidNum);
        console.log("calValidNum2="+calValidNum2);
        console.log("calRatioUpdate="+calRatioUpdate);


        for(var i=0;i<50;i++){
            await this.gacha.pull10();
        }


        total = await this.nft.totalSupply();
        console.log("nft total="+total);

        await this.hotpot.transfer(this.user4, this.str100);
        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user4});
        await this.gacha.pull({from:this.user4});


        calValidNum = await this.invite.calValidNum(this.user0);
        calValidNum2 = await this.invite.calValidNum2(this.user0);
        calRatioUpdate = await this.invite.calRatioUpdate(this.user0);
        console.log("calValidNum="+calValidNum);
        console.log("calValidNum2="+calValidNum2);
        console.log("calRatioUpdate="+calRatioUpdate);

        invitenum = await this.invite.getInviteNum(accounts[1]);
        calValidNum = await this.invite.calValidNum(this.user1);
        calValidNum2 = await this.invite.calValidNum2(this.user1);
        calRatioUpdate = await this.invite.calRatioUpdate(this.user1);
        console.log("calValidNum="+calValidNum);
        console.log("calValidNum2="+calValidNum2);
        console.log("calRatioUpdate="+calRatioUpdate);
        console.log("invitenum="+invitenum);

        await this.invite.inputCode(mycode1,{from:this.user8});

        invitenum = await this.invite.getInviteNum(accounts[1]);
        calValidNum = await this.invite.calValidNum(this.user1);
        calValidNum2 = await this.invite.calValidNum2(this.user1);
        calRatioUpdate = await this.invite.calRatioUpdate(this.user1);
        console.log("calValidNum="+calValidNum);
        console.log("calValidNum2="+calValidNum2);
        console.log("calRatioUpdate="+calRatioUpdate);
        console.log("invitenum="+invitenum);



        await this.hotpot.transfer(this.user8, this.str100);
        await this.hotpot.approve(this.gacha.address, this.approveStr, { from: this.user8});
        await this.gacha.pull({from:this.user8});


        invitenum = await this.invite.getInviteNum(accounts[1]);
        calValidNum = await this.invite.calValidNum(this.user1);
        calValidNum2 = await this.invite.calValidNum2(this.user1);
        calRatioUpdate = await this.invite.calRatioUpdate(this.user1);
        console.log("calValidNum="+calValidNum);
        console.log("calValidNum2="+calValidNum2);
        console.log("calRatioUpdate="+calRatioUpdate);
        console.log("invitenum="+invitenum);




    });
});