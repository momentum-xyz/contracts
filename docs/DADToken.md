# Solidity API

## DADToken

DAD Token for vesting. Future MOM Tokens. These tokens
cannot be transfered between accounts and only be used to stake and 
redeem MOM tokens after the lockup period

### BURNER_ROLE

```solidity
bytes32 BURNER_ROLE
```

Role that can burn tokens.

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

Role that can transfer tokens.

### constructor

```solidity
constructor() public
```

Constructor of the contract

### pause

```solidity
function pause() public
```

Pauses the contract, no actions will be allowed until it is unpaused

### unpause

```solidity
function unpause() public
```

Unpause the contract

### mint

```solidity
function mint(address to, uint256 amount) public
```

Mint new tokens

_Only admin can perform this action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Destination of the new minted tokens |
| amount | uint256 | Amount of tokens to be minted |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal
```

_Overriding default function, only adding the 'whenNotPaused' modifier_

### burn

```solidity
function burn(uint256 amount) public
```

Burn the provided certain amount of tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount of tokens to be burned |

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public
```

Burn the provided amount of tokens from the provided account

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the account that will have the tokens burned |
| amount | uint256 | Amount of tokens to be burned |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) public virtual returns (bool)
```

_Overriding default function, only adding the 'onlyRole' modifier_

### transfer

```solidity
function transfer(address to, uint256 amount) public virtual returns (bool)
```

_Overriding default function, only adding the 'onlyRole' modifier_

