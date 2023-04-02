// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";

contract Staking is Initializable, AccessControlUpgradeable, UUPSUpgradeable {

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    enum Token {
        MOM,
        DAD
    }

    struct Staker {
        address user;
        uint256 total_reward;
        uint256 total_staked;
        uint256 dad_amount;
        uint256 mom_amount;
    }

    struct StakingAt {
        uint256 odyssey_id;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

    struct Odyssey {
        uint256 odyssey_id;
        uint256 total_staked_into;
        uint256 total_stakers;
    }

    struct StakedBy {
        address user;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

    struct StakingInfo {
        address user;
        uint256 odyssey_id;
        uint256 total_amount;
        uint256 dad_amount;
        uint256 mom_amount;
        uint256 since;
    }

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
    // mapping (uint256 => StakingInfo[]) staking_info;
    // mapping (uint256 => uint256) staking_info_odyssey;

    mapping (address => Unstaker[]) public unstakes;

    event ClaimedUnstaked(address, uint256, uint256);
    event Stake(address, uint256, uint256, Token);
    event Unstake(address, uint256, uint256);

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

    function updateMomTokenContract(address _mom_token) public onlyRole(MANAGER_ROLE) {
        mom_token = _mom_token;
    }

    function updateDadTokenContract(address _dad_token) public onlyRole(MANAGER_ROLE) {
        dad_token = _dad_token;
    }

    function stake(uint256 odyssey_id, uint256 amount, Token token) public payable {
        _stake(odyssey_id, amount, token);
    }

    function unstake(uint256 odyssey_id, Token token) public {
        _unstake(odyssey_id, token);
    }

    function restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) public {
        _restake(from_odyssey_id, to_odyssey_id, amount, token);
    }

    function claim_unstaked_tokens() public {
        _claim_unstaked_token();
    }

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

        if(odyssey.odyssey_id == 0) {
            odyssey.odyssey_id = odyssey_id;
        }
        odyssey.total_stakers++;
        odyssey.total_staked_into += amount;

        index = staked_by_indexes[odyssey_id][msg.sender];
        if (staked_by[odyssey_id].length == 0) {
            staked_by[odyssey_id].push();
        }
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

        emit Stake(msg.sender, odyssey_id, amount, token);

    }

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
                _staking_at.total_amount -= 0;
                staker.total_staked -= amount;
    
                if(_staked_by.total_amount > amount) {
                    _staked_by.total_amount -= amount;
                    token == Token.DAD
                    ? _staked_by.dad_amount = 0
                    : _staked_by.mom_amount = 0;
                } else {
                    staked_by_indexes[odyssey_id][staked_by[odyssey_id][staked_by[odyssey_id].length-1].user] = staked_by_indexes[odyssey_id][msg.sender];
                    staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]] = staked_by[odyssey_id][staked_by[odyssey_id].length-1];
                    staked_by[odyssey_id].pop();
                }
            } else {
                staked_by_indexes[odyssey_id][staked_by[odyssey_id][staked_by[odyssey_id].length-1].user] = staked_by_indexes[odyssey_id][msg.sender];
                staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]] = staked_by[odyssey_id][staked_by[odyssey_id].length-1];
                staked_by[odyssey_id].pop();
                
                staking_at_indexes[msg.sender][staking_at[msg.sender][staking_at[msg.sender].length-1].odyssey_id] = staking_at_indexes[msg.sender][odyssey_id];
                staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]] = staking_at[msg.sender][staking_at[msg.sender].length-1];
                staking_at[msg.sender].pop();
                
                odysseys[odyssey_id].total_stakers--;
                odysseys[odyssey_id].total_staked_into -= amount;
            }
        } else {
            delete stakers[msg.sender];
            
            staked_by_indexes[odyssey_id][staked_by[odyssey_id][staked_by[odyssey_id].length-1].user] = staked_by_indexes[odyssey_id][msg.sender];
            staked_by[odyssey_id][staked_by_indexes[odyssey_id][msg.sender]] = staked_by[odyssey_id][staked_by[odyssey_id].length-1];
            staked_by[odyssey_id].pop();
            
            staking_at_indexes[msg.sender][staking_at[msg.sender][staking_at[msg.sender].length-1].odyssey_id] = staking_at_indexes[msg.sender][odyssey_id];
            staking_at[msg.sender][staking_at_indexes[msg.sender][odyssey_id]] = staking_at[msg.sender][staking_at[msg.sender].length-1];
            staking_at[msg.sender].pop();
            
            odysseys[odyssey_id].total_stakers--;
            odysseys[odyssey_id].total_staked_into -= amount;
        }

        total_staked -= amount;

        unstaker.push();
        token == Token.DAD
                    ?  unstaker[unstaker.length-1].dad_amount += amount
                    :  unstaker[unstaker.length-1].mom_amount += amount;
        unstaker[unstaker.length-1].since = block.timestamp;

        emit Unstake(msg.sender, odyssey_id, amount);
    }

    function _restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, Token token) private {
        
    }

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
}
