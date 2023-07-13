// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DADToken.sol";
import "../vesting/Vesting.sol";

/** 
* @title MOM Token
* @author Odyssey
* @notice The Momentum Token
*/
contract MOMToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    /**
     * @notice Role that can pause/unpause the contract.
     */
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    /**
     * @notice Role that can mint new tokens.
     */
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /**
     * @notice Role that can burn tokens.
     */
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /**
     * @dev Address of the DAD token contract
     */
    address immutable dad;

    /**
     * @dev Address of the Vesting contract
     */
    address immutable vesting;

    /// Constructor of the contract
    constructor(uint256 initialSupply, address _vesting, address _dad) ERC20("Momentum", "MOM") {
        require(_vesting != address(0) && _dad != address(0), "Address should not be 0");
        // assigning all roles to the deployer (owner)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        vesting = _vesting;
        dad = _dad;

        // mint the initial supply
        _mint(msg.sender, initialSupply);
    }

    /**
    * @notice Pauses the contract, no actions will be allowed until it is unpaused
    * @dev Only pauser can pause the contract
    */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
    * @notice Unpause the contract
    * @dev Only pauser can unpause the contract
    */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Mint new tokens
     * @dev Only admin and minter can perform this action
     * @param to Destination of the new minted tokens
     * @param amount Amount of tokens to be minted
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Mint DAD tokens to the user, and MOM tokens to the Vesting contract
     * In this way, all DADs minted through this function will have the same value
     * in MOMs on the Vesting contract.
     * @dev Only admin and minter can perform this action
     * @param to Destination of the new minted tokens
     * @param amount Amount of tokens to be minted
     */
    function mintDad(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        Vesting(vesting).update_holder(to, amount);
        DADToken(dad).mint(to, amount);
        _mint(vesting, amount);
        
    }


    /// @dev Overriding default function, only adding the 'whenNotPaused' modifier
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Burn the provided certain amount of tokens
     * @dev Only burner can burn tokens
     * @param amount Amount of tokens to be burned
     */
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(_msgSender(), amount);
    }

    /**
     * @notice Burn the provided amount of tokens from the provided account
     * @dev Only burner can burn tokens
     * @param account Address of the account that will have the tokens burned
     * @param amount Amount of tokens to be burned
     */
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}
