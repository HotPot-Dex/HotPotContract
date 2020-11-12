pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
    Token for test
 */
contract StakeERC20 is ERC20 {
    constructor() public ERC20("Stake Token", "ST") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
