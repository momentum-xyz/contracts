# Solidity API

## MOMToken

The Momentum Token

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

Role that can pause/unpause the contract.

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

Role that can mint new tokens.

### BURNER_ROLE

```solidity
bytes32 BURNER_ROLE
```

Role that can burn tokens.

### dad

```solidity
address dad
```

_Address of the DAD token contract_

### vesting

```solidity
address vesting
```

_Address of the Vesting contract_

### constructor

```solidity
constructor(uint256 initialSupply, address _vesting, address _dad) public
```

Constructor of the contract

### pause

```solidity
function pause() public
```

Pauses the contract, no actions will be allowed until it is unpaused

_Only pauser can pause the contract_

### unpause

```solidity
function unpause() public
```

Unpause the contract

_Only pauser can unpause the contract_

### mint

```solidity
function mint(address to, uint256 amount) public
```

Mint new tokens

_Only admin and minter can perform this action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Destination of the new minted tokens |
| amount | uint256 | Amount of tokens to be minted |

### mintDad

```solidity
function mintDad(address to, uint256 amount) public
```

Mint DAD tokens to the user, and MOM tokens to the Vesting contract
In this way, all DADs minted through this function will have the same value
in MOMs on the Vesting contract.

_Only admin and minter can perform this action_

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

_Only burner can burn tokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount of tokens to be burned |

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public
```

Burn the provided amount of tokens from the provided account

_Only burner can burn tokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address of the account that will have the tokens burned |
| amount | uint256 | Amount of tokens to be burned |

