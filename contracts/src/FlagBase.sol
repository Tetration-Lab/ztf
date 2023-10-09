// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./IFlag.sol";

contract FlagBase is IFlag {
    function capture() external override {
        emit Captured();
    }
}
