// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {RiscZeroGroth16Verifier, ControlID} from "../src/groth16/RiscZeroGroth16Verifier.sol";
import {ZTF} from "../src/ZTF.sol";

contract ZTFScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        RiscZeroGroth16Verifier verifier = new RiscZeroGroth16Verifier(
            ControlID.CONTROL_ID_0,
            ControlID.CONTROL_ID_1
        );

        address[] memory assets = new address[](2);
        assets[0] = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111; // wETH
        assets[1] = 0xa4c4cb2A072eE99f77212Fa18c2B7Ca26DA23905; // wMNT
        ZTF ztf = new ZTF(
            0xd914d2c3b3e85e88d0ea677aec9b284bb82353011ad428f3c6d9f0ec50d7a673,
            address(verifier),
            address(0), // no wormhole here
            assets // wETH
        );

        console2.log(address(ztf));

        vm.stopBroadcast();
    }
}
