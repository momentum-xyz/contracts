# Solidity API

## Vesting

The Vesting Mechanism
DAD holders can gradually burn those tokens to get MOMs gradually over 2 years.

### UPDATER_ROLE

```solidity
bytes32 UPDATER_ROLE
```

Role that can update structures of the contract.

### Holder

```solidity
struct Holder {
  uint256 last_claim_date;
  uint256 total_tokens;
}
```

### dad_token

```solidity
address dad_token
```

DAD token address

### mom_token

```solidity
address mom_token
```

MOM token address

### starting_date

```solidity
uint256 starting_date
```

Vesting starting date

### end_date

```solidity
uint256 end_date
```

Vesting end date

### holders

```solidity
mapping(address => struct Vesting.Holder) holders
```

Map address to holder

### HolderUpdated

```solidity
event HolderUpdated(address holder, uint256 amount, uint256 last_claim_date)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| holder | address | User address |
| amount | uint256 | Amount updated |
| last_claim_date | uint256 | The last claim date of that holder |

### MOMAddressUpdated

```solidity
event MOMAddressUpdated(address mom)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mom | address | MOM token address |

### Redeemed

```solidity
event Redeemed(address holder, uint256 amount)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| holder | address | User address |
| amount | uint256 | Amount of tokens redeemed |

### constructor

```solidity
constructor(address _dad_token, uint256 _starting_date) public
```

_constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dad_token | address | DAD token address |
| _starting_date | uint256 | Vesting starting date |

### set_mom_address

```solidity
function set_mom_address(address _mom_token) public
```

_Updates the MOM address, this can only be done ONCE by admin_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _mom_token | address | MOM token address |

### update_holder

```solidity
function update_holder(address holder, uint256 amount) public
```

_Update the Holder map by initializing the Holder if necessary_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| holder | address | User address |
| amount | uint256 | Amount to be updated |

### redeem_tokens

```solidity
function redeem_tokens() public
```

Redeem the entitled tokens

_Burns DAD and transfer MOM from this contract address to the user_

