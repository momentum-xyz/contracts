// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Staking.sol";

/** 
* @title Staking Upgrade TEST Contract
* @author Odyssey
* @notice contract to test the upgrade functionality for the staking contract
*/
contract StakingV2Test is Staking {
    bool public isUpgraded;

    function reinitialize() public {
        isUpgraded = true;
    }
}