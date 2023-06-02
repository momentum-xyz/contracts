// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../token/MomToken.sol";
import "../nft/OdysseyNFT.sol";

/** 
* @title Staking Contract
* @author Odyssey
* @notice The Momentum staking mechanism
*/
contract Staking is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
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
     * @dev Holds the Odyssey info
     */
    struct Odyssey {
        uint256 odyssey_id;
        uint256 total_staked_into;
        uint256 total_stakers;
        uint256 total_rewards;
        uint256 staked_odysseys_index;
    }

    /**
     * @dev Holds the relation Odyssey -> Staker info
     */
    struct StakedBy {
        address user;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 timestamp;
        uint256 effective_timestamp;
    }

    /**
     * @dev How much a staker should claim after the locking period
     */
    struct Unstaker {
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 untaking_timestamp;
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
     * @notice Odyssey NFT's token address
     */
    address public odyssey_nfts;

    /**
     * @notice Total number of tokens staked.
     */
    uint256 public total_staked;

    /**
     * @notice Locking period to claim unstaked tokens
     */
    uint public locking_period;

    /**
     * @notice Timeout to validate the rewards calculation
     */
    uint public rewards_timeout;

    /**
     * @notice Timestamp of the last rewards calculation
     */
    uint public last_rewards_calculation;

    /**
     * @notice Mapping of stakers by respective addresses
     */
    mapping (address => Staker) public stakers;
    
    /**
     * @notice Mapping of Odysseys by its ID's
     */
    mapping (uint256 => Odyssey) public odysseys;

    /**
     * @notice Mapping the values of each Staker that the Odyssey is being staked by
     */
    mapping (uint256 => StakedBy[]) public staked_by;

    /**
     * @notice Mapping the indexes of the `StakedBy` list of the Odyssey
     */
    mapping (uint256 => mapping(address => uint256)) public staked_by_indexes;

    /**
     * @notice Mapping the unstake list of the user address
     */
    mapping (address => Unstaker[]) public unstakes;

    /**
     * @notice list of staked odysseys
     */
    uint256[] public staked_odysseys;

    /**
     * @notice storage gap for upgrades
     */
    uint256[50] __gap;

    /**
     * 
     * @param user User address
     * @param total_claimed Total tokens that were claimed
     * @param total_staked Total staked by user
     */
    event ClaimedUnstaked(address indexed user, uint256 total_claimed, uint256 total_staked);
    
    /**
     * 
     * @param odyssey_id Odyssey id
     * @param total_rewards_claimed Total rewards claimed by the user
     */
    event OdysseyRewardsClaimed(uint256 indexed odyssey_id, uint256 total_rewards_claimed);
    
    /**
     * 
     * @param user User address
     * @param odyssey_from Odyssey ID that the user is removing stake
     * @param odyssey_to Odyssey ID that the user is staking into
     * @param amount Amount that's being restaked
     * @param token Token used (MOM or DAD)
     * @param total_staked_from Total amount of tokens that remains staked on the `odyssey_from`
     * @param total_staked_to Total amount of tokens staked on `odyssey_to`
     */
    event Restake(address indexed user,
                  uint256 indexed odyssey_from,
                  uint256 indexed odyssey_to,
                  uint256 amount,
                  Token token,
                  uint256 total_staked_from,
                  uint256 total_staked_to);
    
    /**
     * 
     * @param user User address
     * @param total_rewards_claimed Total rewards claimed by the user
     */
    event RewardsClaimed(address indexed user, uint256 total_rewards_claimed);


    /**
     * 
     * @param timestamp Timestamp when the rewards were updated
     * @param blocknumber Blocknumber when the rewards were updated
     */
    event RewardsUpdated(uint timestamp, uint256 blocknumber);


    /**
     * 
     * @param user User address
     * @param odyssey_id Odyssey ID that's being staked
     * @param amount_staked Amount being staked
     * @param token Token used (MOM or DAD) 
     * @param total_staked Total being staked by the user on the Odyssey
     */
    event Stake(address indexed user, uint256 indexed odyssey_id, uint256 amount_staked, Token token, uint256 total_staked);

    /**
     * 
     * @param user User address
     * @param odyssey_id Odyssey ID that's being unstaked
     * @param amount_unstaked Amount unstaked
     * @param token Token used (MOM or DAD)
     * @param total_staked Total remained staked by the user on that Odyssey
     */
    event Unstake(address indexed user, uint256 indexed odyssey_id, uint256 amount_unstaked, Token token, uint256 total_staked);

    /**
     * @dev Initializer of the contract, is called when deploying
     * @param _mom_token MOM Token contract address
     * @param _dad_token DAD Token contract address
     * @param _odyssey_nfts Odyssey NFT contract address
     */
    function initialize(address _mom_token, address _dad_token, address _odyssey_nfts) initializer public {
        require(_mom_token != address(0) && _dad_token != address(0) && _odyssey_nfts != address(0),
                "A contract address is invalid");
        mom_token = _mom_token;
        dad_token = _dad_token;
        odyssey_nfts = _odyssey_nfts;
        locking_period = 7 days;
        rewards_timeout = 3 minutes;
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
        require(_mom_token != address(0), "Invalid contract address");
        mom_token = _mom_token;
    }

    /**
     * @dev Updates the DAD token contract
     * @param _dad_token new address for the DAD token contract
     */
    function update_dad_token_contract(address _dad_token) public onlyRole(MANAGER_ROLE) {
        require(_dad_token != address(0), "Invalid contract address");
        dad_token = _dad_token;
    }

    /**
     * @dev Updates the Odyssey NFT's contract
     * @param _odyssey_nfts new address for the Odyssey NFT's contract
     */
    function update_odyssey_nfts_contract(address _odyssey_nfts) public onlyRole(MANAGER_ROLE) {
        require(_odyssey_nfts != address(0), "Invalid contract address");
        odyssey_nfts = _odyssey_nfts;
    }

    /**
     * @dev Update the staking rewards of the users
     * @param addresses list of addresses to update
     * @param stakers_amounts amount that will be updated per user
     * @param odysseys_ids list of odysseys id to update
     * @param odysseys_amounts amount that will be updated per odyssey
     * @param timestamp timestamp of the reward calculation
     */
    function update_rewards(address[] memory addresses, uint256[] memory stakers_amounts, uint256[] memory odysseys_ids, uint256[] memory odysseys_amounts, uint timestamp ) public onlyRole(MANAGER_ROLE) {
        require(addresses.length > 0
                && stakers_amounts.length > 0
                && odysseys_ids.length > 0
                && odysseys_amounts.length > 0,
                "Invalid Input");
        require(addresses.length == stakers_amounts.length
                && odysseys_ids.length == odysseys_amounts.length,
                "Lengths don't match");
        require(timestamp < block.timestamp, "Invalid timestamp");
        require(block.timestamp - timestamp < rewards_timeout, "Timeout");

        for(uint i = 0; i < addresses.length; i++) {
            stakers[addresses[i]].total_rewards += stakers_amounts[i];
        }

        for(uint i = 0; i < odysseys_ids.length; i++) {
            odysseys[odysseys_ids[i]].total_rewards += odysseys_amounts[i];
        }

        last_rewards_calculation = block.timestamp;
        emit RewardsUpdated(last_rewards_calculation, block.number);
    }

    /**
     * @dev Update the locking period to claim rewards
     * @param _locking_period new locking period
     */
    function update_locking_period(uint _locking_period) public onlyRole(MANAGER_ROLE) {
        locking_period = _locking_period;
    }

    /**
     * @dev Update the rewards_timeout to update calculated rewards
     * @param _rewards_timeout new rewards_timeout
     */
    function update_rewards_timeout(uint _rewards_timeout) public onlyRole(MANAGER_ROLE) {
        rewards_timeout = _rewards_timeout;
    }

    /**
     * @dev Returns the list of staked Odysseys
     */
    function get_staked_odysseys() external view returns(uint256[] memory) {
        return staked_odysseys;
    }

    /**
     * @dev Returns the list of Stakers that are staking at the Odyssey
     * @param odyssey the Odyssey ID
     */
    function get_staked_by(uint256 odyssey) external view returns(StakedBy[] memory) {
        return staked_by[odyssey];
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
     * @notice Claim stake rewards
     */
    function claim_rewards() public {
        _claim_rewards();
    }
    
    /**
     * @notice Claim Odyssey rewards
     */
    function claim_rewards(uint256 odyssey_id) public {
        _claim_rewards(odyssey_id);
    }

    modifier onlyMintedOdyssey(uint256 odyssey_id) {
        require(OdysseyNFT(odyssey_nfts).exists(odyssey_id), "This Odyssey doesn't exists");
        _;
    }

    /**
     * @dev Stake the tokens into the Odyssey. If no staker or Odyssey exists, they will be created in the process.
     * @param odyssey_id Odyssey id to be staked on
     * @param amount Amount to be staked in the Odyssey
     * @param token Token that will be staked 
     */
    function _stake(uint256 odyssey_id, uint256 amount, Token token) private onlyMintedOdyssey(odyssey_id) {
        require(amount > 0, "Amount cannot be 0");
        if(token == Token.DAD) {
            IERC20(dad_token).safeTransferFrom(payable(msg.sender), address(this), amount);
        } else {
            IERC20(mom_token).safeTransferFrom(payable(msg.sender), address(this), amount);
        }

        _do_stake(odyssey_id, amount, token);

        emit Stake(msg.sender, odyssey_id, amount, token, staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]].total_amount);
    }

    /**
     * @dev Actual stake operation logic.
     * @param odyssey_id Odyssey id to be staked on
     * @param amount Amount to be staked in the Odyssey
     * @param token Token that will be staked 
     */
    function _do_stake(uint256 odyssey_id, uint256 amount, Token token) private {
        Staker storage staker = stakers[msg.sender];
        Odyssey storage odyssey = odysseys[odyssey_id];
        
        if(staker.user == address(0)) {
            staker.user = msg.sender;
        }
        staker.total_staked += amount;
        
        token == Token.DAD ? staker.dad_amount += amount : staker.mom_amount += amount;
        total_staked += amount;
        
        // First staker on the odyssey
        if(odyssey.odyssey_id == 0) {
            odyssey.odyssey_id = odyssey_id;
            odyssey.staked_odysseys_index = staked_odysseys.length;
            staked_odysseys.push(odyssey_id);
        }
        odyssey.total_staked_into += amount;

        uint256 index = staked_by_indexes[odyssey_id][msg.sender];
        // First stake of the user
        if (staked_by[odyssey_id].length == 0) {
            staked_by[odyssey_id].push();
        }
        // The user is not staking on the odyssey
        if(index == 0) {
            odyssey.total_stakers++;
            index = staked_by[odyssey_id].length;
            staked_by_indexes[odyssey_id][msg.sender] = index;
            staked_by[odyssey_id].push();
            staked_by[odyssey_id][index].user = msg.sender;
            staked_by[odyssey_id][index].total_amount = amount;
            token == Token.DAD
                    ?  staked_by[odyssey_id][index].dad_amount += amount
                    :  staked_by[odyssey_id][index].mom_amount += amount;
            staked_by[odyssey_id][index].timestamp = block.timestamp;
            staked_by[odyssey_id][index].effective_timestamp = block.timestamp;
        } else {
            staked_by[odyssey_id][index].effective_timestamp = 
                    calculate_effective_timestamp(staked_by[odyssey_id][index].timestamp,
                        staked_by[odyssey_id][index].total_amount,
                        amount,
                        true);
            staked_by[odyssey_id][index].total_amount += amount;
            token == Token.DAD
                    ? staked_by[odyssey_id][index].dad_amount += amount
                    : staked_by[odyssey_id][index].mom_amount += amount;
            staked_by[odyssey_id][index].timestamp = block.timestamp;
        }
    }

    /**
     * @dev Unstake the tokens from an Odyssey and update the unstakers map with the values.
     * @param odyssey_id Odyssey id that will be unstaked
     * @param token token to be unstaked
     */
    function _unstake(uint256 odyssey_id, Token token) private onlyMintedOdyssey(odyssey_id) {
        Staker storage staker = stakers[msg.sender];
        require(staker.user != address(0)
                && staked_by_indexes[odyssey_id][msg.sender] != 0
                && staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]].user == staker.user,
                "Invalid user or user not staking on that Odyssey");
        StakedBy storage _staked_by = staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]];

        token == Token.DAD
                    ? require(_staked_by.dad_amount > 0)
                    : require(_staked_by.mom_amount > 0);

        Unstaker[] storage unstaker = unstakes[msg.sender];
        uint256 amount = token == Token.DAD
                    ? _staked_by.dad_amount
                    : _staked_by.mom_amount;
        uint256 remaining_amount = 0;
        
        if(staker.total_staked > amount) {
            if(_staked_by.total_amount > amount) {
                uint effective_timestamp = calculate_effective_timestamp(_staked_by.timestamp,
                        _staked_by.total_amount,
                        amount,
                        false);
                token == Token.DAD
                    ? _staked_by.dad_amount = 0
                    : _staked_by.mom_amount = 0;
                _staked_by.total_amount -= amount;
                staker.total_staked -= amount;
                _staked_by.effective_timestamp = effective_timestamp;
                _staked_by.timestamp = block.timestamp;
                remaining_amount = _staked_by.total_amount;
                total_staked -= amount;
            } else {
                remove_staked_by(odyssey_id, msg.sender);
                decrease_odyssey_total_stakers(odyssey_id, amount);
            }
            token == Token.DAD
                    ? staker.dad_amount = 0
                    : staker.mom_amount = 0;
            staker.total_staked -= amount;
        } else {
            delete stakers[msg.sender];
            remove_staked_by(odyssey_id, msg.sender);
            decrease_odyssey_total_stakers(odyssey_id, amount);
        }
        unstaker.push();
        token == Token.DAD
                    ?  unstaker[unstaker.length-1].dad_amount += amount
                    :  unstaker[unstaker.length-1].mom_amount += amount;
        unstaker[unstaker.length-1].untaking_timestamp = block.timestamp;

        emit Unstake(msg.sender, odyssey_id, amount, token, remaining_amount);
    }

    /**
     * @dev Restake the amount from one Odyssey into other. No Locking period for this operation.
     * @param from_odyssey_id Id of the odyssey that the amount will be unstaked
     * @param to_odyssey_id Id of the odyssey that the amount will be staker
     * @param amount Amount to be restaked
     * @param token Token that will be restaked
     */
    function _restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) private onlyMintedOdyssey(to_odyssey_id) {
        require(amount > 0, "Amount cannot be 0");
        require(stakers[msg.sender].user != address(0), "Not a staker");
        require(staked_by_indexes[from_odyssey_id][msg.sender] > 0, "Not staking in that Odyssey");
        
        StakedBy storage staked_by_from = staked_by[from_odyssey_id][staked_by_indexes[from_odyssey_id][msg.sender]];

        uint current_timestamp = block.timestamp;
        uint effective_timestamp;
        uint256 total_staked_from = 0;
        
        if (token == Token.DAD) {
            require(staked_by_from.dad_amount >= amount, "Not enough staked");
            staked_by_from.dad_amount -= amount;
        } else {
            require(staked_by_from.mom_amount >= amount, "Not enough staked");
            staked_by_from.mom_amount -= amount;
        }

        // Removing all stake from the Odyssey
        if(staked_by_from.total_amount == amount) {
            remove_staked_by(from_odyssey_id, msg.sender);
            decrease_odyssey_total_stakers(from_odyssey_id, amount);
        } else {
            effective_timestamp = calculate_effective_timestamp(staked_by_from.timestamp,
                                                                    staked_by_from.total_amount,
                                                                    amount,
                                                                    false);
            staked_by_from.total_amount -= amount;
            staked_by_from.timestamp = current_timestamp;
            staked_by_from.effective_timestamp = effective_timestamp;
            total_staked_from = staked_by_from.total_amount;
        }

        // Restake in the 'to' Odyssey
        _do_stake(to_odyssey_id, amount, token);

        uint256 total_staked_to = staked_by[to_odyssey_id][staked_by_indexes[to_odyssey_id][msg.sender]].total_amount;
        
        emit Restake(msg.sender,
                    from_odyssey_id,
                    to_odyssey_id,
                    amount,
                    token,
                    total_staked_from,
                    total_staked_to);
    }

    /**
     * @dev Transfer the unstaked tokens to an user, only after the locking period
     */
    function _claim_unstaked_token() private {
        require(unstakes[msg.sender].length > 0, "Nothing to claim");

        uint256 moms_to_claim = 0;
        uint256 dads_to_claim = 0;
        bool claim = false;

        for (int i = 0; i < int(unstakes[msg.sender].length); i++) {
            uint index = uint(i);
            if((block.timestamp - unstakes[msg.sender][index].untaking_timestamp) >= locking_period) {
                moms_to_claim = moms_to_claim + unstakes[msg.sender][index].mom_amount;
                dads_to_claim = dads_to_claim + unstakes[msg.sender][index].dad_amount;
                unstakes[msg.sender][index] = unstakes[msg.sender][unstakes[msg.sender].length-1];
                unstakes[msg.sender].pop();
                claim = true;
                i--;
            }
        }
        if(claim) {
            if(moms_to_claim > 0) {
                IERC20(mom_token).safeTransfer(payable(msg.sender), moms_to_claim);
            }
            if(dads_to_claim > 0) {
                IERC20(dad_token).safeTransfer(payable(msg.sender), dads_to_claim);
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
     * @dev Mint new tokens as rewards for the Odyssey owner.
     * @param odyssey_id Oddysey ID to claim the rewards
     */
    function _claim_rewards(uint256 odyssey_id) private {
        require(odysseys[odyssey_id].total_rewards > 0, "No rewards available");
        require(OdysseyNFT(odyssey_nfts).ownerOf(odyssey_id) == msg.sender, "Not owner of that Odyssey");

        uint256 amount = odysseys[odyssey_id].total_rewards;
        odysseys[odyssey_id].total_rewards = 0;

        MOMToken(mom_token).mint(payable(msg.sender), amount);

        emit OdysseyRewardsClaimed(odyssey_id, amount);
    }

    /**
     * @dev Utility function to remove an entry from staked_by
     * @param odyssey_id Odyssey id
     * @param staker address of the user
     */
    function remove_staked_by(uint256 odyssey_id, address staker) private {
        if(staked_by[odyssey_id].length == 2) {
            delete staked_by[odyssey_id];
            staked_by_indexes[odyssey_id][staker] = 0;
            return;
        }
        StakedBy storage last_item = staked_by[odyssey_id][staked_by[odyssey_id].length-1];
        staked_by_indexes[odyssey_id][last_item.user] = staked_by_indexes[odyssey_id][staker];
        staked_by[odyssey_id][staked_by_indexes[odyssey_id][staker]] = last_item;
        staked_by[odyssey_id].pop();
    }

   /**
     * @dev Utility function to decrease total stakers from an Odyssey, deleting it if necessary.
     * @param odyssey_id Odyssey id
     * @param amount amount to be decreased from total_staked_into
     */
    function decrease_odyssey_total_stakers(uint256 odyssey_id, uint256 amount) private {
        Odyssey storage odyssey = odysseys[odyssey_id];
        odyssey.total_stakers--;
        odyssey.total_staked_into -= amount;
        total_staked -= amount;
        if(odyssey.total_stakers == 0 && odyssey.total_rewards == 0) {
            uint256 last_item = staked_odysseys[staked_odysseys.length-1];
            odysseys[last_item].staked_odysseys_index = odyssey.staked_odysseys_index;
            staked_odysseys[odyssey.staked_odysseys_index] = last_item;
            staked_odysseys.pop();
            delete odysseys[odyssey_id];
        }
    }

    /**
     * @dev Utility function to calculate the effective timestamp of the stake.
     * The formula is Tn+1 = (CnTn + CxTx) / (Cn + Cx)
     * where Cn is the current stake and Tn is the moment that stake was set in.
     * Tx and Cx are the new stake/unstake time and amount, respectively.
     * @param effective_timestamp last stake timestamp
     * @param current_amount current amount staked
     * @param amount amount to be staked/unstaked
     * @param is_stake flag to determine if it is stake or unstake
     * @return uint new effective timestamp
     */
    function calculate_effective_timestamp(uint effective_timestamp, uint256 current_amount, uint256 amount, bool is_stake) private view returns(uint) {
        uint current_timestamp = block.timestamp;
        uint actual_effective_timestamp = effective_timestamp > last_rewards_calculation
                                            ? effective_timestamp
                                            : last_rewards_calculation;
        uint new_effective_timestamp = is_stake
                                        ? ( (current_amount * actual_effective_timestamp) + (amount * current_timestamp) ) / (current_amount + amount)
                                        : ( (current_amount * actual_effective_timestamp) - (amount * current_timestamp) ) / (current_amount - amount);
        return new_effective_timestamp;
    }

}
