// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/** 
* @title DAD Token
* @author Odyssey
* @notice DAD Token for vesting. Futue MOM Tokens. These tokens
* cannot be transfered between accounts and only be used to stake and 
* redeem MOM tokens after the lockup period
*/
contract DADToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    // TODO: add list of addresses and tokens to be minted when deploying the contract


    /// Constructor of the contract
    constructor() ERC20("Momentum", "DAD") {
        // TODO: mint the tokens to the respectives addresses
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(TRANSFER_ROLE, msg.sender);
    }

    /// @notice Pauses the contract, no actions will be allowed until it is unpaused
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    } 

    /// @notice Unpause the contract
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Mint new tokens
     * @dev Only admin can perform this action
     * @param to Destination of the new minted tokens
     * @param amount Amount of tokens to be minted
     */
    function mint(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
    }

    /// @dev Only adding the 'whenNotPaused' modifier
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Burn the provided certain amount of tokens
     * @param amount Amount of tokens to be burned
     */
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(_msgSender(), amount);
    }

    /**
     * @notice Burn the provided amount of tokens from the provided account
     * @param account Address of the account that will have the tokens burned
     * @param amount Amount of tokens to be burned
     */
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    /// @dev Only adding the 'onlyRole' modifier
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override onlyRole(TRANSFER_ROLE) returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    /// @dev Only adding the 'onlyRole' modifier
    function transfer(address to, uint256 amount) public virtual override onlyRole(TRANSFER_ROLE) returns (bool) {
        return super.transfer(to, amount);
    }

    /// @dev Only adding the 'onlyRole' modifier
    function approve(address spender, uint256 amount) public virtual override onlyRole(TRANSFER_ROLE) returns (bool) {
        return super.approve(spender, amount);
    }

    /// @dev Only adding the 'onlyRole' modifier
    function increaseAllowance(address spender, uint256 addedValue) public virtual override onlyRole(TRANSFER_ROLE) returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    /// @dev Only adding the 'onlyRole' modifier
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual override onlyRole(TRANSFER_ROLE) returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}
