// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../CallbackBase.sol";

contract CallbackTarget is CallbackBase {
    uint public numSaved = 0;
    event Saved();

    constructor(address[] memory trustList) {
        for (uint i = 0; i < trustList.length; i++) {
            trusted[trustList[i]] = true;
        }
    }

    function callback(address, address) external override onlyTrusted {
        numSaved += 1;
        emit Saved();
    }
}
