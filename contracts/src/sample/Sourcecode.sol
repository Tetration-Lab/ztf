// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../IFlag.sol";

contract Sourcecode is IFlag {
    bool public isSafe = false;

    function safe(bytes memory code) private pure returns (bool) {
        uint i = 0;
        while (i < code.length) {
            uint8 op = uint8(code[i]);

            if (op >= 0x30 && op <= 0x48) {
                return false;
            }

            if (
                op == 0x54 || // SLOAD
                op == 0x55 || // SSTORE
                op == 0xF0 || // CREATE
                op == 0xF1 || // CALL
                op == 0xF2 || // CALLCODE
                op == 0xF4 || // DELEGATECALL
                op == 0xF5 || // CREATE2
                op == 0xFA || // STATICCALL
                op == 0xFF // SELFDESTRUCT
            ) return false;

            if (op >= 0x60 && op < 0x80) i += (op - 0x60) + 1;

            i++;
        }

        return true;
    }

    function submitCode(bytes memory code) external {
        bool flag = safe(code);
        require(flag, "Unsafe code");
        isSafe = true;
    }

    function capture() external override {
        if (isSafe) {
            emit Captured();
        }
    }
}
