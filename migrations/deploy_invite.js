const Invite = artifacts.require("Invite");
const Gacha = artifacts.require("Gacha");

module.exports = function (deployer, network) {
    deployer.deploy(Invite)
    .then(function(invite){
        invite.setValidContract(Gacha.address);
        invite.setGenerateContract(Gacha.address);
    });
}
