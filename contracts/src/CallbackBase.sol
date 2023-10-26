// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./ICallback.sol";

contract CallbackBase is ICallback {
    mapping(address => bool) public trusted; // should be ZTF of wormhole

    modifier onlyTrusted() {
        require(trusted[msg.sender], "untrusted caller");
        _;
    }

    // this can be use to do anything e.g. pause protocol, payment, etc
    function callback(address, address) external virtual onlyTrusted {}
}
