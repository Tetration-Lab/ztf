// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/token/ERC20/ERC20.sol";

contract TMP20 is ERC20 {
    constructor(
        uint amount,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _mint(msg.sender, amount);
    }
}
