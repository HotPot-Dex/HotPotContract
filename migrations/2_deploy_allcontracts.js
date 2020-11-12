const Web3 = require("web3");

const NFT = artifacts.require("NFTokenHotPot");
const Reward = artifacts.require("Reward");
const Gacha = artifacts.require("Gacha");
const NFTMarket = artifacts.require("NFTMarket");
const Loan = artifacts.require("Loan");
const HotPot = artifacts.require("HotPot");
const Invite = artifacts.require("Invite");
const ReservePool = artifacts.require("ReservePool");
const BigNumber = require('big-number');
const StakePool = artifacts.require("StakePool");
const HotPotLPPool = artifacts.require("HotPotLPStakePool");

var stakeTokens = [
    "ethusdt",
    'wbtc',
    'usdc',
    'usdt',
    'hotpot',
    'hotpoteth'
];

var stakeERC20Address = {}

var stakePoolAmount = {}

module.exports = function (deployer, network) {
    var _price = 20 * 10 ** 18;
    var _posibility = 8;

    var _devAddress = "";

    var nftName = "nft";
    var nftShort = "nft";

    console.log("network=" + network);
    if (network == "development") {
        _devAddress = "0x08B7fF344567051722AfC1CFf83dCd259939295A";

        nftName = "nft";
        nftShort = "nft";
    } else if (network == "mainnet-fork" || network == "mainnet") {
        _devAddress = "0xA8E393F8a62226F8ADf3b650a6199d585B31A349";

        nftName = "HotPot Member";
        nftShort = "HPM";

    } else if (network == "ropsten-fork" || network == "ropsten") {
        _devAddress = "0xFc8D32B38331f51B3014ED05F59Bf4B002014461";

        nftName = "nft";
        nftShort = "nft";
    } else if (network == "rinkeby-fork" || network == "rinkeby") {
        _devAddress = "0xFc8D32B38331f51B3014ED05F59Bf4B002014461";

        nftName = "nft";
        nftShort = "nft";
    }

    deployer.then(async () => {
        var hotpot = await deployer.deploy(HotPot);
        var nft = await deployer.deploy(NFT, nftName, nftShort);
        var reward = await deployer.deploy(Reward, _devAddress, NFT.address, HotPot.address);
        var loan = await deployer.deploy(Loan, NFT.address, HotPot.address);

        await loan.setRewardAddress(Reward.address);
        await loan.setDevAddress(_devAddress);
        await reward.setLoan(Loan.address);

        var invite = await deployer.deploy(Invite, NFT.address);

        let strvalue = Web3.utils.toHex(_price);
        var gacha = await deployer.deploy(Gacha, strvalue, _posibility, Reward.address, NFT.address, HotPot.address, Invite.address);

        await invite.setValidContract(Gacha.address);
        await invite.setGenerateContract(Gacha.address);

        var market = await deployer.deploy(NFTMarket, Reward.address, NFT.address, HotPot.address, Loan.address, _devAddress);

        await nft.setReward(Reward.address);
        await nft.setExchange(NFTMarket.address);
        await nft.setGacha(Gacha.address);
        var reservePool = await deployer.deploy(ReservePool, HotPot.address);

        var amount = BigNumber(200000).mult(10 ** 18);
        hotpot.transfer(ReservePool.address, amount);

        //print all contract address
        console.log("***************************************************************************************");
        console.log("***************************************************************************************");
        console.log("***************************************************************************************");
        console.log("\n");
        console.log("nft address : " + NFT.address);
        console.log("hotpot address : " + HotPot.address);
        console.log("gacha address : " + Gacha.address);
        console.log("loan address : " + Loan.address);
        console.log("market address : " + NFTMarket.address);
        console.log("reward address : " + Reward.address);
        console.log("invite address : " + Invite.address);
        console.log("reserve address : " + ReservePool.address);
        console.log("network=" + network);

        var ethAddress;
        var uniFactoryAddress;

        for (var i = 0; i < stakeTokens.length; i++) {
            var token = stakeTokens[i];
            if (token == "hotpoteth") {
                stakePoolAmount[token] = BigNumber(448000).mult(10 ** 18);
            } else if (token == "hotpot") {
                stakePoolAmount[token] = BigNumber(128000).mult(10 ** 18);
            } else {
                stakePoolAmount[token] = BigNumber(56000).mult(10 ** 18);
            }
        }

        //start time
        var timestamp = 1605099600;
        console.log("timestamp=" + timestamp);
        //7 days
        var duration = 86400 * 7;

        var delay = 3600 * 2;

        // var stakeTokens = [
        //     "ethusdt",
        //     'wbtc',
        //     'usdc',
        //     'usdt',
        //     'hotpot',
        //     'hotpoteth'
        // ];
        if (network == "development") {
            stakeERC20Address[stakeTokens[0]] = "0x0E3aE000597D08820E885110cf6889aca39Fc7E8";
            stakeERC20Address[stakeTokens[1]] = "0x8470a4419241415a7371c3508e5767756595A027";
            stakeERC20Address[stakeTokens[2]] = "0xB664C8435510a6B6827FB79b1A633BdA57aDB6fd";
            stakeERC20Address[stakeTokens[3]] = "0xB664C8435510a6B6827FB79b1A633BdA57aDB6fd";

            stakeERC20Address[stakeTokens[5]] = "0xFE55361B1321F8Dd7584Ac914c181772A5B13AE5";

        } else if (network == "mainnet-fork" || network == "mainnet") {
            ethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

            stakeERC20Address[stakeTokens[0]] = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";
            stakeERC20Address[stakeTokens[1]] = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
            stakeERC20Address[stakeTokens[2]] = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
            stakeERC20Address[stakeTokens[3]] = "0xdac17f958d2ee523a2206206994597c13d831ec7";
        } else if (network == "rinkeby-fork" || network == "rinkeby") {
            ethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
            uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

            stakeERC20Address[stakeTokens[0]] = "0x78ab2e85eaf22dc7b6981e54432e17521bdadc23";  //eth/usdc
            stakeERC20Address[stakeTokens[1]] = "0x01be23585060835e02b77ef475b0cc51aa1e0709";  //link
            stakeERC20Address[stakeTokens[2]] = "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";  //usdc
            stakeERC20Address[stakeTokens[3]] = "0x2448ee2641d78cc42d7ad76498917359d961a783";  //dai

            timestamp = Math.floor((new Date()).getTime() / 1000) + 600;
            duration = 3600 * 2;
            delay = 60 * 10;
        }

        /***********************************  Deploy Stake Pools   **************************************/

        for (var i = 0; i < stakeTokens.length; i++) {
            var token = stakeTokens[i];
            console.log("deploy " + token);
            // var stakeAddress = stakeERC20Address[token];
            // var amount = stakePoolAmount[token];

            stakeERC20Address['hotpot'] = hotpot.address;

            // console.log("nft=" + nft.address);
            //1. deploy single pool
            // let rewardAmount = web3.utils.toHex(amount);
            // console.log("deploy real " + token);

            var amount = new BigNumber(stakePoolAmount[token]);
            var firstWeek = amount.mult(20).div(100);
            var stakeAddress = stakeERC20Address[token];
            console.log("token=" + token + ",stakeAddress=" + stakeAddress);
            var instance;
            if (stakeAddress != null && stakeAddress != "") {
                console.log("deploy stake pool : " + token + ",address=" + stakeAddress);
                if (token == 'hotpot') {
                    instance = await deployer.deploy(StakePool, stakeAddress, nft.address, HotPot.address, Loan.address, Reward.address, Invite.address, timestamp + delay, duration, firstWeek);
                } else {
                    instance = await deployer.deploy(StakePool, stakeAddress, nft.address, HotPot.address, Loan.address, Reward.address, Invite.address, timestamp, duration, firstWeek);
                }
            } else {
                console.log("deploy hotpot lp stake pool");
                //HotPotLPPool
                instance = await deployer.deploy(HotPotLPPool, nft.address, HotPot.address, Loan.address, Reward.address, Invite.address, timestamp + delay, duration, firstWeek, uniFactoryAddress, ethAddress);
            }

            nft.addPool(instance.address);
            console.log("transfer real " + token);

            hotpot.transfer(instance.address, stakePoolAmount[token]);

            console.log("***************************************************************************************");
            console.log("\n");

            console.log("stake token = " + token);
            console.log("stake token address = " + stakeERC20Address[token]);
            console.log("stake pool address=" + instance.address);
            console.log("\n");
            console.log("***************************************************************************************");
            console.log("\n");

            if (token === 'hotpoteth') {
                var result = await instance.tokenAddr();
                console.log("hotpot/eth token address = " + result);
            }
        }
    });
}
