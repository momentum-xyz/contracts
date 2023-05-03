# Solidity API

## Staking

The Momentum staking mechanism

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

### StakingAt

```solidity
struct StakingAt {
  bytes16 odyssey_id;
  uint256 total_amount;
  uint256 dad_amount;
  uint256 mom_amount;
  uint256 timestamp;
  uint256 effective_timestamp;
}
```

### Odyssey

```solidity
struct Odyssey {
  bytes16 odyssey_id;
  uint256 total_staked_into;
  uint256 total_stakers;
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
mapping(bytes16 => struct Staking.Odyssey) odysseys
```

Mapping of Odysseys by its ID's

### staking_at

```solidity
mapping(address => struct Staking.StakingAt[]) staking_at
```

Mapping the values of each Odyssey that the user is staking
Should match respective StakedBy

### staking_at_indexes

```solidity
mapping(address => mapping(bytes16 => uint256)) staking_at_indexes
```

Mapping the indexes of the `StakingAt` list of the user

### staked_by

```solidity
mapping(bytes16 => struct Staking.StakedBy[]) staked_by
```

Mapping the values of each Staker that the Odyssey is being staked by
Should match respective StakingAt

### staked_by_indexes

```solidity
mapping(bytes16 => mapping(address => uint256)) staked_by_indexes
```

Mapping the indexes of the `StakedBy` list of the Odyssey

### unstakes

```solidity
mapping(address => struct Staking.Unstaker[]) unstakes
```

Mapping the unstake list of the user address

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

### Restake

```solidity
event Restake(address user, bytes16 odyssey_from, bytes16 odyssey_to, uint256 amount, enum Staking.Token token, uint256 total_staked_from, uint256 total_staked_to)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey_from | bytes16 | Odyssey ID that the user is removing stake |
| odyssey_to | bytes16 | Odyssey ID that the user is staking into |
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
event Stake(address user, bytes16 odyssey, uint256 amount_staked, enum Staking.Token token, uint256 total_staked)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey | bytes16 | Odyssey ID that's being staked |
| amount_staked | uint256 | Amount being staked |
| token | enum Staking.Token | Token used (MOM or DAD) |
| total_staked | uint256 | Total being staked by the user on the Odyssey |

### Unstake

```solidity
event Unstake(address user, bytes16 odyssey, uint256 amount_unstaked, enum Staking.Token token, uint256 total_staked)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | User address |
| odyssey | bytes16 | Odyssey ID that's being unstaked |
| amount_unstaked | uint256 | Amount unstaked |
| token | enum Staking.Token | Token used (MOM or DAD) |
| total_staked | uint256 | Total remained staked by the user on that Odyssey |

### initialize

```solidity
function initialize(address _mom_token, address _dad_token) public
```

_Initializer of the contract, is called when deploying_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _mom_token | address | MOM Token contract address |
| _dad_token | address | DAD Token contract address |

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

### update_mom_token_contract

```solidity
function update_mom_token_contract(address _mom_token) public
```

_Updates the MOM token contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _mom_token | address | new address for the MOM token contract |

### update_dad_token_contract

```solidity
function update_dad_token_contract(address _dad_token) public
```

_Updates the DAD token contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dad_token | address | new address for the DAD token contract |

### update_rewards

```solidity
function update_rewards(address[] addresses, uint256[] amounts, uint256 timestamp) public
```

_Update the staking rewards of the users_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| addresses | address[] | list of addresses to update |
| amounts | uint256[] | amount that will be updated per user |
| timestamp | uint256 |  |

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

### stake

```solidity
function stake(bytes16 odyssey_id, uint256 amount, enum Staking.Token token) public payable
```

Stake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | bytes16 | Odyssey id to be staked on |
| amount | uint256 | Amount to be staked in the Odyssey |
| token | enum Staking.Token | Token that will be staked |

### unstake

```solidity
function unstake(bytes16 odyssey_id, enum Staking.Token token) public
```

Unstake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | bytes16 | Odyssey id that will be unstaked |
| token | enum Staking.Token | token to be unstaked |

### restake

```solidity
function restake(bytes16 from_odyssey_id, bytes16 to_odyssey_id, uint256 amount, enum Staking.Token token) public
```

Restake operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from_odyssey_id | bytes16 | Id of the odyssey that the amount will be unstaked |
| to_odyssey_id | bytes16 | Id of the odyssey that the amount will be staker |
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

Claim stake / Odyssey rewards

