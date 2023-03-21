// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Staking is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    enum Token {
        MOM,
        DAD
    }

    struct Staker {
        address user;
        uint256 total_reward;
        uint256 total_staked;
        mapping(Token => uint256) token_values;
        mapping(uint256 => uint256) indexes;
        mapping(uint256 => StakingAt[]) staking_at;
    }

    struct StakingAt {
        uint256 odyssey_id;
        uint256 amount;
        uint256 since;
    }

    struct Odyssey {
        uint256 odyssey_id;
        uint256 total_staked_into;
        uint256 total_stakers;
        mapping(uint256 => uint256) indexes;
        mapping(uint256 => StakedBy[]) staked_by;
    }

    struct StakedBy {
        address user;
        uint256 amount;
        uint256 since;
    }

    address public mom_token;
    address public dad_token;
    uint256 public total_staked;

    mapping (address => Staker) internal stakers;
    mapping (uint256 => Odyssey) internal odysseys;

    mapping (address => StakingAt[]) internal staking_at;
    mapping (uint256 => StakedBy[]) internal staked_by;

    event Stake(address, uint256, uint256);

    function initialize(address _mom_token, address _dad_token) initializer public {
        mom_token = _mom_token;
        dad_token = _dad_token;
        total_staked = 0;
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function stake(uint256 odyssey_id, uint256 amount, Token token) public payable {
        _stake(odyssey_id, amount, token);
    }

    function _calculate_reward() private {

    }

    function unstake(uint256 odyssey_id, uint256 amount, Token token) public {
        _unstake(odyssey_id, amount, token);
    }

    function restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) public {
        _restake(from_odyssey_id, to_odyssey_id, amount, token);
    }

    function claim_rewards() public {}

    function _calculate_rewards() private {}

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
        staker.token_values[token] += amount;
        
        total_staked += amount;

        if(staker.indexes[odyssey_id] == 0) {
            staker.indexes[odyssey_id] = staker.staking_at[0].length;
            staker.staking_at[0].push(StakingAt(odyssey_id, amount, block.timestamp));
        } else {
            staker.staking_at[0][staker.indexes[odyssey_id]].amount += amount;
        }

        if(odyssey.odyssey_id == 0) {
            odyssey.odyssey_id = odyssey_id;
        }
        odyssey.total_stakers++;
        odyssey.total_staked_into += amount;

        if(odyssey.indexes[odyssey_id] == 0) {
            odyssey.indexes[odyssey_id] = odyssey.staked_by[0].length;
            odyssey.staked_by[0].push(StakedBy(staker.user, amount, block.timestamp));
        } else {
            odyssey.staked_by[0][odyssey.indexes[odyssey_id]].amount += amount;
        }

        emit Stake(staker.user, odyssey_id, amount);

    }

    function _unstake(uint256 odyssey_id, uint256 amount, Token token) private {
        
    }

    function _restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) private{

    }

    function _generate_rewards() private {}

    //  TODO: Do NOT forget about the function to change the STAKER/ODYSSEY in cases of
    // Selling an Odyssey with stakers/rewards

}