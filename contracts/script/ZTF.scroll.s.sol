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

        address[] memory assets = new address[](1);
        assets[0] = 0x5300000000000000000000000000000000000004;
        ZTF ztf = new ZTF(
            0xa9f5a60be55cc3faced59d2c54da23b3a7274ab2365bb4548a490e8caf6f2497,
            0x6Bf3eA9b54E97197775aE180dD5280412CBb18cb,
            address(0), // no wormhole here
            assets // wETH
        );

        console2.log(address(ztf));

        vm.stopBroadcast();
    }
}
