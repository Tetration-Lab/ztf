// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {CallbackTarget} from "../src/sample/CallbackTarget.sol";

contract CallbackScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address[] memory trustList = new address[](1);
        trustList[0] = 0xE52BEb4e12122F9A34ae9aa14d5098c2Aeec79C0; // ZTF
        CallbackTarget callback = new CallbackTarget(trustList);

        console2.log(address(callback));

        vm.stopBroadcast();
    }
}
