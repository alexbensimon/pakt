// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IPaktManager {
    function withdraw() external;
}

contract WithdrawContractTest {
    IPaktManager private immutable i_paktManager;

    constructor(address _paktManagerAddress) {
        i_paktManager = IPaktManager(_paktManagerAddress);
    }

    function withdrawFromPaktManager() external {
        i_paktManager.withdraw();
    }
}
