// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../token/DADToken.sol";

/** 
* @title Vesting Contract
* @author Odyssey
* @notice The Vesting Mechanism
* DAD holders can gradually burn those tokens to get MOMs gradually over 2 years.
*/
contract Vesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    /**
     * @notice Role that can update structures of the contract.
     */
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    /**
     * @notice Holder info 
     */
    struct Holder {
        uint last_claim_date;
        uint256 total_tokens;
    }

    /**
     * @notice DAD token address
     */
    address immutable public dad_token;

    /**
     * @notice MOM token address
     */
    address public mom_token;
    
    /**
     * @notice Vesting starting date
     */
    uint immutable public starting_date;
    
    /**
     * @notice Vesting end date
     */
    uint immutable public end_date;
    
    /**
     * @notice MOM address set control flag
     */
    bool private mom_set;

    /**
     * @notice Map address to holder
     */
    mapping(address => Holder) public holders;

    /**
     * 
     * @param holder User address
     * @param amount Amount updated
     * @param last_claim_date The last claim date of that holder
     */
    event HolderUpdated(address holder, uint256 amount, uint last_claim_date);

    /**
     * 
     * @param mom MOM token address
     */
    event MOMAddressUpdated(address mom);

    /**
     * 
     * @param holder User address
     * @param amount Amount of tokens redeemed
     */
    event Redeemed(address holder, uint256 amount);

    /**
     * @dev constructor
     * @param _dad_token DAD token address
     * @param _starting_date Vesting starting date
     */
    constructor(address _dad_token, uint _starting_date) {
        require(_dad_token != address(0) && _starting_date != 0, "Input cannot be 0");
        dad_token = _dad_token;
        starting_date = _starting_date;
        end_date = starting_date + 730 days;
        mom_set = false;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Updates the MOM address, this can only be done ONCE by admin
     * @param _mom_token MOM token address
     */
    function set_mom_address(address _mom_token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(mom_set == false && _mom_token != address(0), "MOM address was set already or address is 0");
        mom_token = _mom_token;
        mom_set = true;
        emit MOMAddressUpdated(mom_token);
    }

    /**
     * @dev Update the Holder map by initializing the Holder if necessary
     * @param holder User address
     * @param amount Amount to be updated
     */
    function update_holder(address holder, uint256 amount) public onlyRole(UPDATER_ROLE) {
        require(holder != address(0) && amount != 0, "Holder address or amount cannot be 0");
        
        uint current_timestamp = block.timestamp;
        holders[holder].last_claim_date = holders[holder].last_claim_date == 0 && current_timestamp >= starting_date 
            ? current_timestamp
            : starting_date;
    
        holders[holder].total_tokens += amount;
        emit HolderUpdated(holder, amount, holders[holder].last_claim_date);
    }

    /**
     * @notice Redeem the entitled tokens
     * @dev Burns DAD and transfer MOM from this contract address to the user
     */
    function redeem_tokens() public nonReentrant {
        return _redeem_tokens();
    }

    /**
     * @dev Actual logic of redeem_tokens
     */
    function _redeem_tokens() private {
        require(mom_set, "MOM address is not set yet");
        uint current_timestamp = block.timestamp;
        require(current_timestamp > starting_date, "Vesting not started");
        Holder storage holder = holders[msg.sender];
        require(current_timestamp > holder.last_claim_date, "Nothing to redeem at this moment");
        uint256 total_to_redeem = current_timestamp < end_date
            ? (holder.total_tokens * (current_timestamp - holder.last_claim_date)) / (end_date - holder.last_claim_date)
            :  holder.total_tokens;
        require(total_to_redeem > 0 , "Nothing to redeem at this moment");
        DADToken dad_contract = DADToken(dad_token);
        
        require(holder.total_tokens > 0, "No tokens to redeem");
        require(dad_contract.balanceOf(msg.sender) >= total_to_redeem, "Not enough balance to burn");
        require(dad_contract.allowance(msg.sender, address(this)) >= total_to_redeem, "Allowance is needed");

        holder.total_tokens = holder.total_tokens - total_to_redeem;
        
        dad_contract.burnFrom(msg.sender, total_to_redeem);
        IERC20(mom_token).safeTransfer(payable(msg.sender), total_to_redeem);
        
        emit Redeemed(msg.sender, total_to_redeem);
    }
}
