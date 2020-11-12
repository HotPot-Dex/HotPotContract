var BigNumber = require('big-number');
const HotPot = artifacts.require("HotPot");
const NFT = artifacts.require("NFTokenHotPot");
const StakePool = artifacts.require("StakePool");
const HotPotLPPool = artifacts.require("HotPotLPStakePool");
const Loan = artifacts.require("Loan");
const Reward = artifacts.require("Reward");
const Invite = artifacts.require("Invite");

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
    var ethAddress;
    var uniFactoryAddress;
    var count = 0;

    console.log("network="+network);
    console.log("loan ="+Loan.address);

    for (var i = 0; i < stakeTokens.length; i++) {
        var token = stakeTokens[i];
        if (token == "hotpoteth") {
            stakePoolAmount[token] = BigNumber(560000-70000).mult(10 ** 18);
        } else if (token == "hotpot") {
            stakePoolAmount[token] = BigNumber(160000).mult(10 ** 18);
        } else {
            stakePoolAmount[token] = BigNumber(70000).mult(10 ** 18);
        }
    }
    var timestamp = Math.floor((new Date("2020/10/20 10:00:00")).getTime() / 1000);

    timestamp = Math.floor((new Date()).getTime() / 1000) + 3600;
    var duration = 86400;

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
        stakeERC20Address[stakeTokens[1]] = "0xd3d2e2692501a5c9ca623199d38826e513033a17";
        stakeERC20Address[stakeTokens[2]] = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    } else if (network == "ropsten-fork" || network == "ropsten") {
        ethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
        uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

        stakeERC20Address[stakeTokens[0]] = "0x1c5DEe94a34D795f9EEeF830B68B80e44868d316";
        stakeERC20Address[stakeTokens[1]] = "0xB709f47e5FA51Fe61085Ab40302A25Fc7dbCe590";
        stakeERC20Address[stakeTokens[2]] = "0xad6d458402f60fd3bd25163575031acdce07538d";
        stakeERC20Address[stakeTokens[3]] = "0xad6d458402f60fd3bd25163575031acdce07538d";
    }else if (network == "rinkeby-fork" || network == "rinkeby") {
        ethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
        uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

        stakeERC20Address[stakeTokens[0]] = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";  //eth/usdc
        stakeERC20Address[stakeTokens[1]] = "0x01be23585060835e02b77ef475b0cc51aa1e0709";  //link
        stakeERC20Address[stakeTokens[2]] = "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";  //usdc
        stakeERC20Address[stakeTokens[3]] = "0x2448ee2641d78cc42d7ad76498917359d961a783";  //dai

        //0x40d3b2f06f198d2b789b823cdbecd1db78090d74 usdt
    }

    
    /***********************************  Deploy Stake Pools   **************************************/

    //Deploy StakePool -- 6 pools
    var nft;
    var hotpot;
    //deploy fake erc20 to stake

    for (var i = 5; i < stakeTokens.length; i++) {
        var token = stakeTokens[i];
        count=5;
        console.log("deploy " + token);
        // var stakeAddress = stakeERC20Address[token];
        // var amount = stakePoolAmount[token];
        deployer
            .then(function () {
                return HotPot.deployed();
            })
            .then(function (instance) {
                hotpot = instance;
                stakeERC20Address['hotpot'] = hotpot.address;
                // console.log("hotpot address="+stakeERC20Address['hotpot']);
                return NFT.deployed();
            })
            .then(function (result) {
                nft = result;
                // console.log("nft=" + nft.address);
                //1. deploy single pool
                // let rewardAmount = web3.utils.toHex(amount);
                var token = stakeTokens[count++];
                // console.log("deploy real " + token);

                var amount = new BigNumber(stakePoolAmount[token]);
                var firstWeek = amount.mult(30).div(100);
                var stakeAddress = stakeERC20Address[token];
                console.log("token="+token+",stakeAddress="+stakeAddress);
                if (stakeAddress != null && stakeAddress != "") {
                    console.log("deploy stake pool : " + token + ",address=" + stakeAddress);
                    console.log("loan address="+Loan.address);
                    return deployer.deploy(StakePool, stakeAddress, nft.address, HotPot.address, Loan.address, Reward.address, Invite.address, timestamp, duration, firstWeek);
                } else {
                    console.log("deploy hotpot lp stake pool");
                    //HotPotLPPool
                    return deployer.deploy(HotPotLPPool, nft.address, HotPot.address, Loan.address, Reward.address, Invite.address, timestamp, duration, firstWeek, uniFactoryAddress, ethAddress);
                }
            })
            .then(function (instance) {
                nft.addPool(instance.address);
                var token = stakeTokens[count - 1];
                console.log("transfer real " + token);
                var amount = stakePoolAmount[token];
                hotpot.transfer(instance.address, amount);

                console.log("***************************************************************************************");
                console.log("\n");

                console.log("stake token = " + token);
                console.log("stake token address = " + stakeERC20Address[token]);
                console.log("stake pool address=" + instance.address);
                console.log("\n");
                console.log("***************************************************************************************");
                console.log("\n");

                if (token === 'hotpoteth') {
                    return instance.tokenAddr();
                }
            })
            .then(function (result) {
                if (result) {
                    console.log("hotpot/eth token address = " + result);
                }
            });
    }
}