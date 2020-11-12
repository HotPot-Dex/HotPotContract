pragma solidity ^0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/nft/hotpot-token.sol";

contract TestNFT {

  function testInitialBalanceUsingDeployedContract() public {
    NFTokenHotPot nft = NFTokenHotPot(DeployedAddresses.NFTokenHotPot());

    uint expected = 10000;

    Assert.equal(nft.getBalance(tx.origin), expected, "Owner should have 10000 MetaCoin initially");
  }

  function testInitialBalanceWithNewMetaCoin() public {
    MetaCoin meta = new MetaCoin();

    uint expected = 10000;

    Assert.equal(meta.getBalance(tx.origin), expected, "Owner should have 10000 MetaCoin initially");
  }

}
