# Solidity API

## Staking

The Momentum staking mechanism

### constructor

```solidity
constructor() public
```

### MANAGER_ROLE

```solidity
bytes32 MANAGER_ROLE
```

_Manager Role that is able to update the contract structures_

### Token

```solidity
enum Token {
  MOM,
  DAD
}
```

### Staker

```solidity
struct Staker {
  address user;
  uint256 total_rewards;
  uint256 total_staked;
  uint256 dad_amount;
  uint256 mom_amount;
}
```

### Odyssey

```solidity
struct Odyssey {
  uint256 odyssey_id;
  uint256 total_staked_into;
  uint256 total_stakers;
  uint256 total_rewards;
  uint256 staked_odysseys_index;
}
```

### StakedBy

```solidity
struct StakedBy {
  address user;
  uint256 total_amount;
  uint256 dad_amount;
  uint256 mom_amount;
  uint256 timestamp;
  uint256 effective_timestamp;
}
```

### Unstaker

```solidity
struct Unstaker {
  uint256 dad_amount;
  uint256 mom_amount;
  uint256 untaking_timestamp;
}
```

### mom_token

```solidity
address mom_token
```

MOM token address

### dad_token

```solidity
address dad_token
```

DAD token address

### odyssey_nfts

```solidity
address odyssey_nfts
```

Odyssey NFT's token address

### total_staked

```solidity
uint256 total_staked
```

Total number of tokens staked.

### locking_period

```solidity
uint256 locking_period
```

Locking period to claim unstaked tokens

### rewards_timeout

```solidity
uint256 rewards_timeout
```

Timeout to validate the rewards calculation

### last_rewards_calculation

```solidity
uint256 last_rewards_calculation
```

Timestamp of the last rewards calculation

### stakers

```solidity
mapping(address => struct Staking.Staker) stakers
```

Mapping of stakers by respective addresses

### odysseys

```solidity
mapping(uint256 => struct Staking.Odyssey) odysseys
```

Mapping of Odysseys by its ID's

### staked_by

```solidity
mapping(uint256 => struct Staking.StakedBy[]) staked_by
```

Mapping the values of each Staker that the Odyssey is being staked by

### staked_by_indexes

```solidity
mapping(uint256 => mapping(address => uint256)) staked_by_indexes
```

Mapping the indexes of the `StakedBy` list of the Odyssey

### unstakes

```solidity
mapping(address => struct Staking.Unstaker[]) unstakes
```

Mapping the unstake list of the user address

### staked_odysseys

```solidity
uint256[] staked_odysseys
```

list of staked odysseys

### __gap

```solidity
uint256[50] __gap
```

storage gap for upgrades

### ClaimedUnstaked

```solidity
event ClaimedUnstaked(address user, uint256 total_claimed, uint256 total_staked)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| total_claimed | uint256 | Total tokens that were claimed |
| total_staked | uint256 | Total staked by user |

### OdysseyRewardsClaimed

```solidity
event OdysseyRewardsClaimed(uint256 odyssey_id, uint256 total_rewards_claimed)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | uint256 | Odyssey id |
| total_rewards_claimed | uint256 | Total rewards claimed by the user |

### Restake

```solidity
event Restake(address user, uint256 odyssey_from, uint256 odyssey_to, uint256 amount, enum Staking.Token token, uint256 total_staked_from, uint256 total_staked_to)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey_from | uint256 | Odyssey ID that the user is removing stake |
| odyssey_to | uint256 | Odyssey ID that the user is staking into |
| amount | uint256 | Amount that's being restaked |
| token | enum Staking.Token | Token used (MOM or DAD) |
| total_staked_from | uint256 | Total amount of tokens that remains staked on the `odyssey_from` |
| total_staked_to | uint256 | Total amount of tokens staked on `odyssey_to` |

### RewardsClaimed

```solidity
event RewardsClaimed(address user, uint256 total_rewards_claimed)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| total_rewards_claimed | uint256 | Total rewards claimed by the user |

### RewardsUpdated

```solidity
event RewardsUpdated(uint256 timestamp, uint256 blocknumber)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint256 | Timestamp when the rewards were updated |
| blocknumber | uint256 | Blocknumber when the rewards were updated |

### Stake

```solidity
event Stake(address user, uint256 odyssey_id, uint256 amount_staked, enum Staking.Token token, uint256 total_staked)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey_id | uint256 | Odyssey ID that's being staked |
| amount_staked | uint256 | Amount being staked |
| token | enum Staking.Token | Token used (MOM or DAD) |
| total_staked | uint256 | Total being staked by the user on the Odyssey |

### StateUpdated

```solidity
event StateUpdated(string state, uint256 from, uint256 to)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | string | State variable name |
| from | uint256 | from value |
| to | uint256 | to value |

### Unstake

```solidity
event Unstake(address user, uint256 odyssey_id, uint256 amount_unstaked, enum Staking.Token token, uint256 total_staked)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey_id | uint256 | Odyssey ID that's being unstaked |
| amount_unstaked | uint256 | Amount unstaked |
| token | enum Staking.Token | Token used (MOM or DAD) |
| total_staked | uint256 | Total remained staked by the user on that Odyssey |

### initialize

```solidity
function initialize(address _mom_token, address _dad_token, address _odyssey_nfts) public
```

_Initializer of the contract, is called when deploying_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _mom_token | address | MOM Token contract address |
| _dad_token | address | DAD Token contract address |
| _odyssey_nfts | address | Odyssey NFT contract address |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

_Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

```solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
```_

### update_rewards

```solidity
function update_rewards(address[] addresses, uint256[] stakers_amounts, uint256[] odysseys_ids, uint256[] odysseys_amounts, uint256 timestamp) public
```

_Update the staking rewards of the users_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addresses | address[] | list of addresses to update |
| stakers_amounts | uint256[] | amount that will be updated per user |
| odysseys_ids | uint256[] | list of odysseys id to update |
| odysseys_amounts | uint256[] | amount that will be updated per odyssey |
| timestamp | uint256 | timestamp of the reward calculation |

### update_locking_period

```solidity
function update_locking_period(uint256 _locking_period) public
```

_Update the locking period to claim rewards_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _locking_period | uint256 | new locking period |

### update_rewards_timeout

```solidity
function update_rewards_timeout(uint256 _rewards_timeout) public
```

_Update the rewards_timeout to update calculated rewards_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rewards_timeout | uint256 | new rewards_timeout |

### get_staked_odysseys

```solidity
function get_staked_odysseys() external view returns (uint256[])
```

_Returns the list of staked Odysseys_

### get_staked_by

```solidity
function get_staked_by(uint256 odyssey) external view returns (struct Staking.StakedBy[])
```

_Returns the list of Stakers that are staking at the Odyssey_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey | uint256 | the Odyssey ID |

### stake

```solidity
function stake(uint256 odyssey_id, uint256 amount, enum Staking.Token token) public payable
```

Stake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | uint256 | Odyssey id to be staked on |
| amount | uint256 | Amount to be staked in the Odyssey |
| token | enum Staking.Token | Token that will be staked |

### unstake

```solidity
function unstake(uint256 odyssey_id, enum Staking.Token token) public
```

Unstake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | uint256 | Odyssey id that will be unstaked |
| token | enum Staking.Token | token to be unstaked |

### restake

```solidity
function restake(uint256 from_odyssey_id, uint256 to_odyssey_id, uint256 amount, enum Staking.Token token) public
```

Restake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from_odyssey_id | uint256 | Id of the odyssey that the amount will be unstaked |
| to_odyssey_id | uint256 | Id of the odyssey that the amount will be staker |
| amount | uint256 | Amount to be restaked |
| token | enum Staking.Token | Token that will be restaked |

### claim_unstaked_tokens

```solidity
function claim_unstaked_tokens() public
```

Transfer untaked tokens back to the user

### claim_rewards

```solidity
function claim_rewards() public
```

Claim stake rewards

### claim_rewards

```solidity
function claim_rewards(uint256 odyssey_id) public
```

Claim Odyssey rewards

### onlyMintedOdyssey

```solidity
modifier onlyMintedOdyssey(uint256 odyssey_id)
```

