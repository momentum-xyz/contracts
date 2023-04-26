// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/DADToken.sol";
import "../token/MomToken.sol";

/** 
* @title MOM/DAD Token Faucet for testnet
* @author Odyssey
* @notice The Momentum Token Faucet
*/
contract Faucet is Ownable {
    
    /**
     * @dev Possible Tokens enum
     */
    enum Token {
        MOM,
        DAD
    }

    /**
     * @notice MOM token address
     */
    address public mom_token;
    
    /**
     * @notice DAD token address
     */
    address public dad_token;

    /**
     * @dev Amount to be generated for the user
     */
    uint256 private amount_;

    /**
     * @dev Cooldown period to get more tokens
     */
    uint private cooldown_period_ = 1 days;

    /**
     * @dev Mapping the address of the user to a timestamp,
     * to check if the user can get more tokens.
     */
    mapping(address => uint) private users;

    event FaucetDrop(address, uint256, Token, uint);

    /**
     * @dev The constructor of the contract
     * @param _mom_token The MOM token address
     * @param _dad_token The DAD token address
     * @param _amount Initial amount to be generated for the user
     */
    constructor(address _mom_token, address _dad_token, uint256 _amount) Ownable() {
        mom_token = _mom_token;
        dad_token = _dad_token;
        amount_ = _amount;
    }

    /**
     * @notice Set the MOM token contract address
     * @param _mom_token new address for the MOM token contract
     */
    function set_mom_address(address _mom_token) public onlyOwner {
        mom_token = _mom_token;
    }

    /**
     * @notice Set the DAD token contract address
     * @param _dad_token new address for the DAD token contract
     */
    function set_dad_address(address _dad_token) public onlyOwner {
        dad_token = _dad_token;
    }

    /**
     * @notice Set the amount to be generated by the faucet
     * @param _amount Amount to be generated by the faucet
     */
    function set_amount(uint256 _amount) public onlyOwner {
        amount_ = _amount;
    }

    /**
     * @notice Returns the current amount set to be generated by the faucet
     * @return amount_ The current amount set to be generated by the faucet
     */
    function amount() public view returns(uint256) {
        return amount_;
    }

    /**
     * @notice Returns the current cooldown_period to generate more tokens
     * @return cooldown_period_ The current cooldown_period to generate more tokens
     */
    function cooldown_period() public view returns(uint) {
        return cooldown_period_;
    }

    /**
     * @notice Set the cooldown period to get more tokens from the faucet
     * @param _cooldown_period Cooldown period to be set in order to generate more tokens
     */
    function set_cooldown_period(uint _cooldown_period) public onlyOwner {
        cooldown_period_ = _cooldown_period;
    }

    /**
     * @notice Generates `amount_` of `token` to the user, only after the `cooldown_period_`
     * @param token The token to be generated
     */
    function get_tokens(Token token) public {
        require(block.timestamp - users[msg.sender] >= cooldown_period_, "Too soon to get more tokens");
        users[msg.sender] = block.timestamp;
        token == Token.DAD
            ? DADToken(dad_token).mint(payable(msg.sender), amount_)
            : MOMToken(mom_token).mint(payable(msg.sender), amount_);
        emit FaucetDrop(msg.sender, amount_, token, users[msg.sender]);
    }

}