// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../IFlag.sol";

contract DAOFlag is IFlag {
    address public immutable dao;
    uint public immutable daoBalance;

    // assume that DAO have some ETH from address that attack doesn't control.
    constructor(address dao_) {
        dao = dao_;
        daoBalance = dao_.balance;
    }
    // hint: maybe you can withdraw more than you deposit?
    function capture() external override {
        if (dao.balance < daoBalance) {
            emit Captured();
        }
    }
}
