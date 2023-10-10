// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../IFlag.sol";
import "./TotallySecureContract.sol";

contract SecureFlag is IFlag {
    address target;

    constructor(address _target) {
        target = _target;
    }

    function capture() external override {
        if (
            TotallySecureContract(target).getOwner() !=
            0x000000000000000000000000000000000000dEaD
        ) {
            emit Captured();
        }
    }
}
