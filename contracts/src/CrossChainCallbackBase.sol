// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./ICallback.sol";
import "./IWormholeReceiver.sol";

contract CallbackBase is ICallback {
    mapping(address => bool) trusted; // should be ZTF of wormhole
    address wormhole;

    modifier onlyTrusted() {
        if (msg.sender != address(this)) {
            require(trusted[msg.sender], "untrusted caller");
        }
        _;
    }

    // this can be use to do anything e.g. pause protocol, payment, etc
    function callback(address, address) public virtual onlyTrusted {}

    function receiveWormholeMessages(
        bytes memory payload, // Message passed by source contract
        bytes[] memory, // Any additional VAAs that are needed (Note: these are unverified)
        bytes32 sourceAddress, // The address of the source contract
        uint16, // The Wormhole chain ID
        bytes32 // A hash of contents, useful for replay protection
    ) external payable {
        require(msg.sender == wormhole, "not wormhole");
        require(
            trusted[address(uint160(uint256(sourceAddress)))],
            "untrusted caller"
        );
        (address flag, address claimer) = abi.decode(
            payload,
            (address, address)
        );
        callback(flag, claimer);
    }
}
