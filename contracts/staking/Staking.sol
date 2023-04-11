// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../token/MomToken.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";

/** 
* @title Staking Contract
* @author Odyssey
* @notice The Momentum staking mechanism
*/
contract Staking is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    /**
     * @dev Manager Role that is able to update the contract structures
     */
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /**
     * @dev Possible Tokens enum
     */
    enum Token {
        MOM,
        DAD
    }

     /**
     * @dev Holds Staker info
     */
    struct Staker {
        address user;
        uint256 total_rewards;
        uint256 total_staked;
        uint256 dad_amount;
        uint256 mom_amount;
    }

    /**
     * @dev Holds the relation Staker -> Odyssey info
     */
    struct StakingAt {
        uint256 odyssey_id;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

    /**
     * @dev Holds the Odyssey info
     */
    struct Odyssey {
        uint256 odyssey_id;
        uint256 total_staked_into;
        uint256 total_stakers;
    }

    /**
     * @dev Holds the relation Odyssey -> Staker info
     */
    struct StakedBy {
        address user;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

    /**
     * @dev How much a staker should claim after the locking period
     */
    struct Unstaker {
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

    address public mom_token;
    address public dad_token;
    uint256 public total_staked;

    mapping (address => Staker) public stakers;
    mapping (uint256 => Odyssey) public odysseys;

    mapping (address => StakingAt[]) internal staking_at;
    mapping (address => mapping(uint256 => uint256)) internal staking_at_indexes;
    mapping (uint256 => StakedBy[]) internal staked_by;
    mapping (uint256 => mapping(address => uint256)) internal staked_by_indexes;

    mapping (address => Unstaker[]) public unstakes;

    event ClaimedUnstaked(address, uint256, uint256);
    event Restake(address, uint256, uint256, uint256, Token);
    event RewardsClaimed(address, uint256);
    event Stake(address, uint256, uint256, Token, uint256);
    event Unstake(address, uint256, uint256);

    /**
     * @dev Initializer of the contract, is called when deploying
     * @param _mom_token MOM Token contract address
     * @param _dad_token DAD Token contract address
     */
    function initialize(address _mom_token, address _dad_token) initializer public {
        mom_token = _mom_token;
        dad_token = _dad_token;
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    /**
     * @dev Updates the MOM token contract
     * @param _mom_token new address for the MOM token contract
     */
    function update_mom_token_contract(address _mom_token) public onlyRole(MANAGER_ROLE) {
        mom_token = _mom_token;
    }

    /**
     * @dev Updates the DAD token contract
     * @param _dad_token new address for the DAD token contract
     */
    function update_dad_token_contract(address _dad_token) public onlyRole(MANAGER_ROLE) {
        dad_token = _dad_token;
    }

    /**
     * @dev Update the staking rewards of the users
     * @param addresses list of addresses to update
     * @param amounts amount that will be updated per user
     */
    function update_rewards(address[] memory addresses, uint256[] memory amounts) public onlyRole(MANAGER_ROLE) {
        for(uint i = 0; i < addresses.length; i++) {
            stakers[addresses[i]].total_rewards += amounts[i];
        }
    }

    /**
     * @notice Stake operation
     * @param odyssey_id Odyssey id to be staked on
     * @param amount Amount to be staked in the Odyssey
     * @param token Token that will be staked
     */
    function stake(uint256 odyssey_id, uint256 amount, Token token) public payable {
        _stake(odyssey_id, amount, token);
    }

    /**
     * @notice Unstake operation
     * @param odyssey_id Odyssey id that will be unstaked
     * @param token token to be unstaked
     */
    function unstake(uint256 odyssey_id, Token token) public {
        _unstake(odyssey_id, token);
    }
    
    /**
     * @notice Restake operation
     * @param from_odyssey_id Id of the odyssey that the amount will be unstaked
     * @param to_odyssey_id Id of the odyssey that the amount will be staker
     * @param amount Amount to be restaked
     * @param token Token that will be restaked
     */
    function restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) public {
        _restake(from_odyssey_id, to_odyssey_id, amount, token);
    }

    /**
     * @notice Transfer untaked tokens back to the user
     */
    function claim_unstaked_tokens() public {
        _claim_unstaked_token();
    }

    /**
     * @notice Claim stake / Odyssey rewards
     */
    function claim_rewards() public {
        _claim_rewards();
    }

    /**
     * @dev Stake the tokens into the Odyssey. If no staker or Odyssey exists, they will be created in the process.
     * @param odyssey_id Odyssey id to be staked on
     * @param amount Amount to be staked in the Odyssey
     * @param token Token that will be staked 
     */
    function _stake(uint256 odyssey_id, uint256 amount, Token token) private {
        if(token == Token.DAD) {
            require(IERC20(dad_token).transferFrom(payable(msg.sender), address(this), amount));
        } else {
            require(IERC20(mom_token).transferFrom(payable(msg.sender), address(this), amount));
        }

        Staker storage staker = stakers[msg.sender];
        Odyssey storage odyssey = odysseys[odyssey_id];
        
        if(staker.user == address(0)) {
            staker.user = msg.sender;
        }
        staker.total_staked += amount;
        
        token == Token.DAD ? staker.dad_amount += amount : staker.mom_amount += amount;
        total_staked += amount;
        uint256 index = staking_at_indexes[msg.sender][odyssey_id];
        if(staking_at[msg.sender].length == 0) {
            staking_at[msg.sender].push();
        }
        if(index == 0) {
            index = staking_at[msg.sender].length;
            staking_at_indexes[msg.sender][odyssey_id] = index;
            staking_at[msg.sender].push();
            staking_at[msg.sender][index].odyssey_id = odyssey_id;
            staking_at[msg.sender][index].total_amount = amount;
            token == Token.DAD
                    ? staking_at[msg.sender][index].dad_amount += amount
                    : staking_at[msg.sender][index].mom_amount += amount;
            staking_at[msg.sender][index].since = block.timestamp;
        } else {
            staking_at[msg.sender][index].total_amount += amount;
            token == Token.DAD
                    ? staking_at[msg.sender][index].dad_amount += amount
                    : staking_at[msg.sender][index].mom_amount += amount;
        }

        // First staker on the odyssey
        if(odyssey.odyssey_id == 0) {
            odyssey.odyssey_id = odyssey_id;
        }
        odyssey.total_stakers++;
        odyssey.total_staked_into += amount;

        index = staked_by_indexes[odyssey_id][msg.sender];
        // First stake of the user
        if (staked_by[odyssey_id].length == 0) {
            staked_by[odyssey_id].push();
        }
        // The user is not staking on the odyssey
        if(index == 0) {
            index = staked_by[odyssey_id].length;
            staked_by_indexes[odyssey_id][msg.sender] = index;
            staked_by[odyssey_id].push();
            staked_by[odyssey_id][index].user = msg.sender;
            staked_by[odyssey_id][index].total_amount = amount;
            token == Token.DAD
                    ?  staked_by[odyssey_id][index].dad_amount += amount
                    :  staked_by[odyssey_id][index].mom_amount += amount;
            staked_by[odyssey_id][index].since = block.timestamp;

        } else {
            staked_by[odyssey_id][index].total_amount += amount;
            token == Token.DAD
                    ? staked_by[odyssey_id][index].dad_amount += amount
                    : staked_by[odyssey_id][index].mom_amount += amount;
        }

        emit Stake(msg.sender, odyssey_id, amount, token, staker.total_staked);

    }

    /**
     * @dev Unstake the tokens from an Odyssey and update the unstakers map with the values.
     * @param odyssey_id Odyssey id that will be unstaked
     * @param token token to be unstaked
     */
    function _unstake(uint256 odyssey_id, Token token) private {
        Staker storage staker = stakers[msg.sender];
        Odyssey storage odyssey = odysseys[odyssey_id];

        require(staker.user != address(0) && staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]].odyssey_id == odyssey.odyssey_id);
        token == Token.DAD
                    ? require(staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]].dad_amount > 0)
                    : require(staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]].mom_amount > 0);

        Unstaker[] storage unstaker = unstakes[msg.sender];
        StakingAt storage _staking_at = staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]];
        StakedBy storage _staked_by = staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]];
        uint256 amount = token == Token.DAD
                    ? _staking_at.dad_amount
                    : _staking_at.mom_amount;
        
        if(staker.total_staked > amount) {
            if(_staking_at.total_amount > amount) {
                token == Token.DAD
                    ? _staking_at.dad_amount = 0
                    : _staking_at.mom_amount = 0;
                _staking_at.total_amount -= amount;
                staker.total_staked -= amount;
    
                if(_staked_by.total_amount > amount) {
                    _staked_by.total_amount -= amount;
                    token == Token.DAD
                    ? _staked_by.dad_amount = 0
                    : _staked_by.mom_amount = 0;
                } else {
                    remove_staked_by(odyssey_id, msg.sender);
                }
            } else {
                remove_staked_by(odyssey_id, msg.sender);
                remove_staking_at(odyssey_id, msg.sender);
                decrease_odyssey_total_stakers(odyssey_id, amount);
            }
        } else {
            delete stakers[msg.sender];
            remove_staked_by(odyssey_id, msg.sender);
            remove_staking_at(odyssey_id, msg.sender);
            decrease_odyssey_total_stakers(odyssey_id, amount);
        }
        total_staked -= amount;
        unstaker.push();
        token == Token.DAD
                    ?  unstaker[unstaker.length-1].dad_amount += amount
                    :  unstaker[unstaker.length-1].mom_amount += amount;
        unstaker[unstaker.length-1].since = block.timestamp;

        emit Unstake(msg.sender, odyssey_id, amount);
    }

    /**
     * @dev Restake the amount from one Odyssey into other. No Locking period for this operation.
     * @param from_odyssey_id Id of the odyssey that the amount will be unstaked
     * @param to_odyssey_id Id of the odyssey that the amount will be staker
     * @param amount Amount to be restaked
     * @param token Token that will be restaked
     */
    function _restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) private {
        require(amount > 0, "Amount cannot be 0");
        require(stakers[msg.sender].user != address(0), "Not a staker");
        require(staking_at_indexes[msg.sender][from_odyssey_id] > 0, "Not staking in that Odyssey");
        
        StakingAt storage staking_at_from = staking_at[msg.sender][staking_at_indexes[msg.sender][from_odyssey_id]];
        StakedBy storage staked_by_from = staked_by[from_odyssey_id][staked_by_indexes[from_odyssey_id][msg.sender]];

        uint256 index_to = staking_at_indexes[msg.sender][to_odyssey_id];
        
        if (token == Token.DAD) {
            require(staking_at_from.dad_amount >= amount, "Not enough staked");
            staking_at_from.dad_amount -= amount;
            staked_by_from.dad_amount -= amount;
        } else {
            require(staking_at_from.mom_amount >= amount, "Not enough staked");
            staking_at_from.mom_amount -= amount;
            staked_by_from.mom_amount -= amount;
        }
        staking_at_from.total_amount -= amount;
        staked_by_from.total_amount -= amount;

        if(staking_at_from.total_amount == 0) {
            remove_staking_at(from_odyssey_id, msg.sender);
            remove_staked_by(from_odyssey_id, msg.sender);
        }

        // The user is not staking on the odyssey
        if(index_to == 0) {
            index_to = staking_at[msg.sender].length;
            staking_at_indexes[msg.sender][to_odyssey_id] = index_to;
            staking_at[msg.sender].push();
            staking_at[msg.sender][index_to].odyssey_id = to_odyssey_id;
        }
        staking_at[msg.sender][index_to].total_amount += amount;
        token == Token.DAD
                ? staking_at[msg.sender][index_to].dad_amount += amount
                : staking_at[msg.sender][index_to].mom_amount += amount;
        staking_at[msg.sender][index_to].since = block.timestamp;

        index_to = staked_by_indexes[to_odyssey_id][msg.sender];

        // The user is not staking on the odyssey
        if(index_to == 0) {
            index_to = staked_by[to_odyssey_id].length;
            staked_by_indexes[to_odyssey_id][msg.sender] = index_to;
            staked_by[to_odyssey_id].push();
            staked_by[to_odyssey_id][index_to].user = msg.sender;
        }
        staked_by[to_odyssey_id][index_to].total_amount += amount;
        token == Token.DAD
                ? staked_by[to_odyssey_id][index_to].dad_amount += amount
                : staked_by[to_odyssey_id][index_to].mom_amount += amount;
        staked_by[to_odyssey_id][index_to].since = block.timestamp;
        
        emit Restake(msg.sender, from_odyssey_id, to_odyssey_id, amount, token);
    }

    /**
     * @dev Transfer the unstaked tokens to an user, only after the locking period
     */
    function _claim_unstaked_token() private {
        require(unstakes[msg.sender].length > 0, "Nothing to claim");

        uint256 moms_to_claim = 0;
        uint256 dads_to_claim = 0;
        bool deleted = false;
        bool claim = false;

        for (uint i = 0; i < unstakes[msg.sender].length; i++) {
            if(deleted) {
                i--;
                deleted = false;
            }
            if((block.timestamp - unstakes[msg.sender][i].since) >= 7 days) {
                moms_to_claim = moms_to_claim + unstakes[msg.sender][i].mom_amount;
                dads_to_claim = dads_to_claim + unstakes[msg.sender][i].dad_amount;
                unstakes[msg.sender][i] = unstakes[msg.sender][unstakes[msg.sender].length-1];
                unstakes[msg.sender].pop();
                deleted = true;
                claim = true;
            }
        }
        if(claim) {
            if(moms_to_claim > 0) {
                IERC20(mom_token).transfer(payable(msg.sender), moms_to_claim);
            }
            if(dads_to_claim > 0) {
                IERC20(dad_token).transfer(payable(msg.sender), dads_to_claim);
            }
            emit ClaimedUnstaked(msg.sender, moms_to_claim, dads_to_claim);
        } else {
            revert("Nothing to claim");
        }
    }

    /**
     * @dev Mint new tokens as rewards for the user.
     */
    function _claim_rewards() private {
        require(stakers[msg.sender].total_rewards > 0, "No rewards available");

        uint256 amount = stakers[msg.sender].total_rewards;
        stakers[msg.sender].total_rewards = 0;

        MOMToken(mom_token).mint(payable(msg.sender), amount);

        emit RewardsClaimed(msg.sender, amount);
    }

    /**
     * @dev Utility function to remove an entry from staking_at
     * @param odyssey_id Odyssey id
     * @param staker address of the user
     */
    function remove_staking_at(uint256 odyssey_id, address staker) private {
        staking_at_indexes[staker][staking_at[staker][staking_at[staker].length-1].odyssey_id] = staking_at_indexes[staker][odyssey_id];
        staking_at[staker][staking_at_indexes[staker][odyssey_id]] = staking_at[staker][staking_at[staker].length-1];
        staking_at[staker].pop();
    }

    /**
     * @dev Utility function to remove an entry from staked_by
     * @param odyssey_id Odyssey id
     * @param staker address of the user
     */
    function remove_staked_by(uint256 odyssey_id, address staker) private {
        staked_by_indexes[odyssey_id][staked_by[odyssey_id][staked_by[odyssey_id].length-1].user] = staked_by_indexes[odyssey_id][staker];
        staked_by[odyssey_id][staked_by_indexes[odyssey_id][staker]] = staked_by[odyssey_id][staked_by[odyssey_id].length-1];
        staked_by[odyssey_id].pop();
    }

   /**
     * @dev Utility function to decrease total stakers from an Odyssey
     * @param odyssey_id Odyssey id
     * @param amount amount to be decreased from total_staked_into
     */
    function decrease_odyssey_total_stakers(uint256 odyssey_id, uint256 amount) private {
        odysseys[odyssey_id].total_stakers--;
        odysseys[odyssey_id].total_staked_into -= amount;
    }
}
