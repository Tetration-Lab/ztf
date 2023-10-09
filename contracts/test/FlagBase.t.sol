// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {FlagBase} from "../src/FlagBase.sol";

contract FlagBaseTest is Test {
    FlagBase flag;
    function setUp() public {
        flag = new FlagBase();
    }

    function test_Increment() public {
        flag.capture();
    }
}
