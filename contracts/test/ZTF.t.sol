// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {ZTF} from "../src/ZTF.sol";

contract ZTFTest is Test {
    ZTF ztf;

    function setUp() public {
        ztf = new ZTF(
            0xce5b424643899718088c5b1e610d7d3a18c7c59ce460065a04909fb06875a687,
            0x04Cc45CEa9a1dBfe76f70CbFDFC42Df76D188a8e,
            new address[](0)
        );
    }

    function test_Increment() public view {
        bytes memory x = ztf.buildJournal(
            0x388C818CA8B9251b393131C08a736A67ccB19297,
            0xf917aec90938d013706032901593abeaecdca22e77468aff7711eee087bad41b,
            0x25e6fae36753c9598ef4ab3cb7856cc8094e3ee63f07538bdd6b12445b2c9e28
        );
        console2.logBytes(x);
    }
}
