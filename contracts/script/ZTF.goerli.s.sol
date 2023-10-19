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
        assets[0] = 0xD8134205b0328F5676aaeFb3B2a0DC15f4029d8C; // Spark's sDAI
        assets[1] = 0x6E4F1e8d4c5E5E6e2781FD814EE0744cc16Eb352; // Spark's wstETH
        ZTF ztf = new ZTF(
            0xd914d2c3b3e85e88d0ea677aec9b284bb82353011ad428f3c6d9f0ec50d7a673,
            address(verifier),
            0x28D8F1Be96f97C1387e94A53e00eCcFb4E75175a, // wormhole relayer
            assets
        );

        console2.log(address(ztf));

        vm.stopBroadcast();
    }
}
