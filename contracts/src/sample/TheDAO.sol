// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract JustADAO {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        // interaction
        payable(msg.sender).transfer(balances[msg.sender]);
        // effect
        balances[msg.sender] = 0;
        // checks ?
        // wut?!? isn't this how checks effects interactions work?
    }
}
