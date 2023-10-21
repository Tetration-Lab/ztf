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

        address[] memory assets = new address[](2);
        assets[0] = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111; // wETH
        assets[1] = 0xa4c4cb2A072eE99f77212Fa18c2B7Ca26DA23905; // wMNT
        ZTF ztf = new ZTF(
            0xa9f5a60be55cc3faced59d2c54da23b3a7274ab2365bb4548a490e8caf6f2497,
            0x5f46B422e0192E409680a983eE14EF62F3B555df,
            address(0), // no wormhole here
            assets // wETH
        );

        console2.log(address(ztf));

        vm.stopBroadcast();
    }
}
