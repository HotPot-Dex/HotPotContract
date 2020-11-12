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
const Invite = artifacts.require("Invite");
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
        this.testReward = false;
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
                console.log("StakePool new : "+token);
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



    // function deposit(
    //     uint256 _tokenId,
    //     uint256 _days,
    //     uint256 _pricePerDay
    // )

    it("Loan Test", async () => {
        var loanSize = await this.loan.getLoanSize();
        var loanTokens = await this.loan.getLoanList();
        var reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        var nft0 = await this.nft.balanceOf(accounts[0]);
        console.log("nft0=" + nft0);
        var nft1 = await this.nft.balanceOf(this.user1);
        console.log("nft0=" + nft1);

        await expectRevert(this.loan.deposit(1, 0, this.str100), "Can not loan for 0 day!");
        await expectRevert(this.loan.deposit(1, 366, this.str100), "The max loan time is 365 days!");


        console.log("deposit");
        await this.loan.deposit(1, nft0, this.str100);

        loanSize = await this.loan.getLoanSize();
        var loanTokens = await this.loan.getLoanList();
        var reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        console.log("cancelDeposit");
        await this.loan.cancelDeposit(1);

        loanSize = await this.loan.getLoanSize();
        loanTokens = await this.loan.getLoanList();
        reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        await this.loan.deposit(1, 1, this.str100);
        console.log("his token is in reservation 1");
        await expectRevert(this.loan.deposit(1, 1, this.str100), "This token is in reservation!");

        await this.loan.deposit(2, 1, this.str1000);


        loanSize = await this.loan.getLoanSize();
        loanTokens = await this.loan.getLoanList();
        reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        await time.increase(86401);


        await this.loan.deposit(1, 1, this.str100);

        await this.loan.deposit(2, 1, this.str1000);

        loanSize = await this.loan.getLoanSize();
        loanTokens = await this.loan.getLoanList();
        reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);


        await time.increase(86400);
        await this.loan.cancelDeposit(1);

        await time.increase(86400);
        await this.loan.cancelDeposit(2);


        loanSize = await this.loan.getLoanSize();
        loanTokens = await this.loan.getLoanList();
        reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        await time.increase(1000);
        await expectRevert(this.loan.cancelDeposit(2), "This token is not deposited!");

        await this.loan.deposit(1, 1, this.str100);

        await expectRevert(this.loan.borrow(1, 1), "You are the owner of this token!");

        await expectRevert(this.loan.borrow(2, 1), "This token can not be borrowed!");

        await expectRevert(this.loan.borrow(1, 2, { from: accounts[1] }), "This token can not be borrowed for so long!");

        await time.increase(86400);

        await expectRevert(this.loan.borrow(1, 1, { from: accounts[1] }), "This token is not loan now!");

        await this.loan.cancelDeposit(1);

        loanSize = await this.loan.getLoanSize();
        loanTokens = await this.loan.getLoanList();
        reservation = await this.loan.reservations(1);

        console.log("loan size = " + loanSize);
        console.log("loanTokens = " + loanTokens);
        console.log("reservation=" + reservation.tokenId);

        await this.loan.deposit(1, 1, this.str100);

        var ub0 = await this.hotpot.balanceOf(this.user0);
        var ub1 = await this.hotpot.balanceOf(this.user1);
        var rb = await this.hotpot.balanceOf(this.reward.address);
        var devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("before loan");

        console.log("ub0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "rb=" + bn2String(rb) + "," + "devb=" + bn2String(devb));


        await this.hotpot.approve(this.loan.address, this.approveStr, { from: this.user1 });
        await this.loan.borrow(1, 1, { from: this.user1 });


        ub0 = await this.hotpot.balanceOf(this.user0);
        ub1 = await this.hotpot.balanceOf(this.user1);
        rb = await this.hotpot.balanceOf(this.reward.address);
        devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("after loan");

        console.log("ub0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "rb=" + bn2String(rb) + "," + "devb=" + bn2String(devb));
        
        reservation = await this.loan.reservations(1);
        console.log(printReservation(reservation));

        await expectRevert(this.loan.cancelDeposit(1),"This token is borrowed!");

        console.log("re borrow");
        await expectRevert(this.loan.borrow(1,1,{from:this.user2}),"This token is borrowed!");

        console.log('re deposit');
        await expectRevert(this.loan.deposit(1,1,this.str100),"This token is in reservation!");

        await time.increase(86401);
        console.log("after 86400s");
        // await this.loan.cancelDeposit(1);

        await expectRevert(this.loan.borrow(1, 1, { from: accounts[1] }), "This token is not loan now!");

        await this.loan.deposit(1,10,this.str100);

        await this.loan.borrow(1,1,{from:this.user1});

        console.log("re borrow");
        await expectRevert( this.loan.borrow(1,1,{from:this.user2}),"This token is borrowed!");

        await time.increase(86401);
        console.log("re borrow 2");

        
        reservation = await this.loan.reservations(1);
        console.log(printReservation(reservation));

        await this.hotpot.transfer(this.user2,this.str1000);
        await this.hotpot.approve(this.loan.address,this.approveStr,{from:this.user2});


        ub0 = await this.hotpot.balanceOf(this.user0);
        ub2 = await this.hotpot.balanceOf(this.user2);
        console.log("ub2="+bn2String(ub2));
        rb = await this.hotpot.balanceOf(this.reward.address);
        devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("ub0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "rb=" + bn2String(rb) + "," + "devb=" + bn2String(devb));


        ub0 = await this.hotpot.balanceOf(this.user0);
        var ub2 = await this.hotpot.balanceOf(this.user2);
        console.log("ub2="+bn2String(ub2));
        await this.loan.borrow(1,3,{from:this.user2});

        ub0 = await this.hotpot.balanceOf(this.user0);
        ub2 = await this.hotpot.balanceOf(this.user2);
        console.log("ub2="+bn2String(ub2));
        rb = await this.hotpot.balanceOf(this.reward.address);
        devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("ub0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "rb=" + bn2String(rb) + "," + "devb=" + bn2String(devb));

        await time.increase(86401);

        await expectRevert(this.loan.cancelDeposit(1),"This token is borrowed!");

        await time.increase(86401);

        await expectRevert(this.loan.cancelDeposit(1),"This token is borrowed!");

        await time.increase(86401);

        // this.loan.cancelDeposit(1);
        await this.loan.borrow(1,4,{from:this.user2});

        await expectRevert(this.loan.borrow(1,1,{from:this.user2}),"This token is borrowed!");

        await time.increase(86401*4);
        this.loan.borrow(1,1,{from:this.user2});

        ub0 = await this.hotpot.balanceOf(this.user0);
        ub2 = await this.hotpot.balanceOf(this.user2);
        console.log("ub2="+bn2String(ub2));
        rb = await this.hotpot.balanceOf(this.reward.address);
        devb = await this.hotpot.balanceOf(this._devAddress);

        console.log("ub0=" + bn2String(ub0) + "," + "ub1=" + bn2String(ub1) + "," +
            "rb=" + bn2String(rb) + "," + "devb=" + bn2String(devb));

        
        await time.increase(86400*5);


        reservation = await this.loan.reservations(1);
        console.log(printReservation(reservation));

        await this.loan.deposit(1,2,this.str100);

        await time.increase(86400 + 86000);

        await expectRevert(this.loan.borrow(1,1,{from:this.user2}),"This token is not loan now!");

        await this.loan.cancelDeposit(1);

        await this.loan.deposit(2,10,this.str100);

        await expectRevert(this.reward.getReward(2),"You do not have right to use this token!");

        await this.reward.getReward(1);

        await expectRevert(this.loan.deposit(1,1,this.str100),"This member card is used today!");

        await time.increase(86401);

        await this.loan.deposit(1,1,this.str100);

        await expectRevert(this.reward.getReward(2),"You do not have right to use this token!");

        await time.increase(86400*11);
        this.reward.getReward(2);

        await this.loan.deposit(1,1,this.str10000);


        await expectRevert(this.loan.borrow(1,1,{from:this.user1}),"You do not have enough hotpot!");

        await time.increase(86401);

        await this.loan.deposit(2,1,this.str200);

        await this.loan.borrow(2,1,{from:this.user1});

        await this.reward.getReward(2,{from:this.user1});

        // await this.reward.getReward(2,{from:this.user1});
        await expectRevert(this.reward.getReward(2,{from:this.user1}),"This ticket is used within 24 hours!");

        await time.increase(86401);

        await expectRevert(this.reward.getReward(2,{from:this.user1}),"You do not have right to use this token!");

        await time.increase(86400*3);

        await this.loan.deposit(2,5,this.str100);

        await this.loan.borrow(2,2,{from:this.user1});

        await this.reward.getReward(2,{from:this.user1});

        await time.increase(86401);

        await  expectRevert(this.reward.getReward(2),"You do not have right to use this token!");

        await this.reward.getReward(2,{from:this.user1});

        var stakepool = this.stakePool['usdt'];

        await time.increase(86401);
        await expectRevert(this.reward.getReward(2,{from:this.user1}),"You do not have right to use this token!");

        await this.reward.getReward(1);

        await expectRevert(stakepool.getRewardByNFT(1),"This ticket is used within 24 hours!");

        await time.increase(87000);

        await stakepool.getRewardByNFT(1);

        await expectRevert(this.loan.deposit(1,1,this.str100),"This member card is used today!");

        await time.increase(87000);

        await this.loan.deposit(1,2,this.str100);

        await this.loan.borrow(1,1,{from:this.user1});

        await stakepool.getRewardByNFT(1,{from:this.user1});
        
        await expectRevert(this.reward.getReward(1,{from:this.user1}),"This ticket is used within 24 hours!");

        // await this.loan.deposit(1,1,this.str100,{from:this.user1});
        console.log("his token is in reservation 2");

        var ownerof = await this.nft.ownerOf(1);
        console.log("owner of 1="+ownerof+",user1="+this.user1);

        await expectRevert(this.loan.deposit(1,1,this.str100),"This token is in reservation!");

        await time.increase(87000*2);

        await expectRevert(this.loan.deposit(1,1,this.str100,{from:this.user1}),"You are not the owner of this token!");

        console.log("Loan test finish");


    // struct Reservation {
    //     uint256 tokenId;
    //     address owner;
    //     address borrower;
    //     uint256 borrowEndTime; //borrow end time
    //     uint256 pricePerDay;
    //     uint256 start; // loan start time
    //     uint256 times; //loan for how many days

    // }


        await this.loan.deposit(1,1,this.str100);
        var reservations = await this.loan.reservations(1);
        var start = parseInt(reservations.start);
        var times = parseInt(reservations.times);
        var finish = start+times*86400;
        console.log("start="+start+",times="+times+",finish="+finish);

        await time.increase(10000);

        await this.loan.borrow(1,1,{from:this.user1});

        var reservations = await this.loan.reservations(1);
        var start = parseInt(reservations.start);
        var times = parseInt(reservations.times);
        var finish = start+times*86400;
        var borrowEndTime = parseInt(reservations.borrowEndTime);
        console.log("start="+start+",times="+times+",finish="+finish+",borrowEndTime="+borrowEndTime);

        await time.increase(86400);


        await this.loan.deposit(1,1,this.str100);

        await time.increase(86400-601);

        this.loan.borrow(1,1,{from:this.user1});


        var reservations = await this.loan.reservations(1);
        var start = parseInt(reservations.start);
        var times = parseInt(reservations.times);
        var finish = start+times*86400;
        var borrowEndTime = parseInt(reservations.borrowEndTime);
        console.log("start="+start+",times="+times+",finish="+finish+",borrowEndTime="+borrowEndTime);

        
    });


    function printReservation(r) {
        return "token id="+r.tokenId+",borrower="+r.borrower+",borrowEndTime="+r.borrowEndTime+
        ",pricePerDay="+bn2String(r.pricePerDay)+",start="+r.start+",times="+r.times;
    }
    // struct Reservation {
    //     uint256 tokenId;
    //     address borrower;
    //     uint256 borrowEndTime; //borrow end time
    //     uint256 pricePerDay;
    //     uint256 start; // loan start time
    //     uint256 times; //loan for how many days
    // }
});