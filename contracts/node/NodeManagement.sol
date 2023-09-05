// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../token/MomToken.sol";
import "../nft/OdysseyNFT.sol";

/** 
* @title NodeManagement Contract
* @author Odyssey
* @notice The Momentum NodeManagement mechanism
*/
contract NodeManagement is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public {
        __AccessControl_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    struct Node {
        uint256 node_id;
        string hostname;
        address owner;
        string name;
    }

    mapping(uint256 => uint256) node_index;
    
    Node[] nodes;

    function splitSignature(bytes memory sig)
       public
       pure
       returns (uint8, bytes32, bytes32)
   {
       require(sig.length == 65);

       bytes32 r;
       bytes32 s;
       uint8 v;

       assembly {
           // first 32 bytes, after the length prefix
           r := mload(add(sig, 32))
           // second 32 bytes
           s := mload(add(sig, 64))
           // final byte (first byte of the next 32 bytes)
           v := byte(0, mload(add(sig, 96)))
       }
     
       return (v, r, s);
   }


}