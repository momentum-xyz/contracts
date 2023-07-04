// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../token/DADToken.sol";

contract Vesting is AccessControl {
    using SafeERC20 for IERC20;
    /**
     * @notice Role that can update structures of the contract.
     */
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    struct Holder {
        uint last_claim_date;
        uint256 total_tokens;
    }

    address public dad_token;
    address public mom_token;
    uint public starting_date;
    uint public end_date;
    bool private mom_set;

    mapping(address => Holder) public holders;

    event HolderUpdated(address holder, uint256 amount, uint last_claim_date);
    event Redeemed(address holder, uint256 amount);

    constructor(address _dad_token, uint _starting_date) {
        require(_dad_token != address(0) && _starting_date != 0, "Input cannot be 0");
        dad_token = _dad_token;
        starting_date = _starting_date;
        end_date = starting_date + 730 days;
        mom_set = false;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function set_mom_address(address _mom_token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(mom_set == false && _mom_token != address(0), "MOM address was set already or address is 0");
        mom_token = _mom_token;
        mom_set = true;
    }

    function update_holder(address holder, uint256 amount) public onlyRole(UPDATER_ROLE) {
        require(holder != address(0) && amount != 0, "Holder address or amount cannot be 0");
        
        uint current_timestamp = block.timestamp;
        holders[holder].last_claim_date = holders[holder].last_claim_date == 0 && current_timestamp >= starting_date 
            ? current_timestamp
            : starting_date;
    
        holders[holder].total_tokens += amount;
        emit HolderUpdated(holder, amount, holders[holder].last_claim_date);
    }

    function redeem_tokens() public {
        return _redeem_tokens();
    }

    function _redeem_tokens() private {
        require(mom_set, "MOM address is not set yet");
        Holder storage holder = holders[msg.sender];
        uint current_timestamp = block.timestamp;
        uint256 total_to_redeem = current_timestamp < end_date
            ? (holder.total_tokens * (current_timestamp - holder.last_claim_date)) / (end_date - holder.last_claim_date)
            :  holder.total_tokens;
        DADToken dad_contract = DADToken(dad_token);
        
        require(holder.total_tokens > 0, "No tokens to redeem");
        require(dad_contract.balanceOf(msg.sender) >= total_to_redeem, "Not enough balance to burn");
        require(dad_contract.allowance(msg.sender, address(this)) >= total_to_redeem, "Allowance is needed");

        dad_contract.burnFrom(msg.sender, total_to_redeem);
        holder.total_tokens = holder.total_tokens - total_to_redeem;
        IERC20(mom_token).safeTransfer(payable(msg.sender), total_to_redeem);
        
        emit Redeemed(msg.sender, total_to_redeem);
    }
}
