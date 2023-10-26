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
        trustList[0] = 0x5f46B422e0192E409680a983eE14EF62F3B555df; // ZTF
        CallbackTarget callback = new CallbackTarget(trustList);

        console2.log(address(callback));

        vm.stopBroadcast();
    }
}
