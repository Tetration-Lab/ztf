// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../CallbackBase.sol";

contract CallbackTarget is CallbackBase {
    event Saved();

    constructor(address[] memory trustList) {
        for (uint i = 0; i < trustList.length; i++) {
            trusted[trustList[i]] = true;
        }
    }

    function callback(address, address) external override onlyTrusted {
        emit Saved();
    }
}
