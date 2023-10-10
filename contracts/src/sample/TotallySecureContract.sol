// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../ICallback.sol";

contract TotallySecureContract is ICallback {
    address owner = 0x000000000000000000000000000000000000dEaD;
    bool public pause = false;
    address public ztf;

    constructor(address _ztf) {
        ztf = _ztf;
    }

    function changeOwner(address newOwner) external {
        require(msg.sender == owner, "Only owner can change owner");
        require(pause == false, "Contract is paused");
        owner = newOwner;
    }

    function notABackdoor(address newOwner) external {
        require(pause == false, "Contract is paused");
        owner = newOwner;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function callback(address) external {
        require(msg.sender == ztf, "Only ZTF can call this function");
        pause = true;
    }
}
