// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../IFlag.sol";

contract TotallySecureContract is IFlag {
    address owner = 0x000000000000000000000000000000000000dEaD;
    bool public pause = false;
    address public ztf;

    constructor() {}

    function changeOwner(address newOwner) external {
        require(msg.sender == owner, "Only owner can change owner");
        require(pause == false, "Contract is paused");
        owner = newOwner;
    }

    function notABackdoor(address newOwner) external {
        require(pause == false, "Contract is paused");
        owner = newOwner;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function capture() external override {
        if (this.getOwner() != 0x000000000000000000000000000000000000dEaD) {
            emit Captured();
        }
    }
}
