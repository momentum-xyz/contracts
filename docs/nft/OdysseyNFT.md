# Solidity API

## OdysseyNFT

_Contract to mint and modify odyssey NFTs_

### maxOdysseyPerWallet

```solidity
uint256 maxOdysseyPerWallet
```

Max Odysseys per wallet allowed

### odysseys

```solidity
uint256 odysseys
```

Total number of Odysseys.
It will increase when minting, and decrease when burning.

### constructor

```solidity
constructor(string name_, string symbol_, uint256 maxOdysseySupply_, string customBaseURI) public
```

_Constructor of the contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name_ | string | ERC712 name |
| symbol_ | string | ERC721 Symbol |
| maxOdysseySupply_ | uint256 | Max Odyssey supply |
| customBaseURI | string | The custom base URI |

### pause

```solidity
function pause() public
```

Pauses minting of new OdysseyNFT's

### unpause

```solidity
function unpause() public
```

Enables minting of new OdysseyNFT's

### setMaxTokens

```solidity
function setMaxTokens(uint256 maxTokens_) public
```

Sets the maximum number of Odysseys which can be minted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| maxTokens_ | uint256 | Maximum limit for number of odysseys |

### maxTokens

```solidity
function maxTokens() public view returns (uint256)
```

Returns the maximum number of Odyssey's which can be minted

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | _maxTokens |

### currentId

```solidity
function currentId() public view returns (uint256)
```

Returns the current id from the id counter

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 current ID counter value |

### safeMint

```solidity
function safeMint(address to) public
```

Mints new OdysseyNFT for the user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The user address to mint the NFT |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

Transfers OdysseyNFT from owner to buyer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Accountid of OdysseyNFT owner |
| to | address | Accountid of OdysseyNFT buyer |
| tokenId | uint256 | The OdysseyId to transfer |

### setbaseURI

```solidity
function setbaseURI(string baseURI) public
```

Sets the base URI of NFT metadata folder

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseURI | string | baseURI |

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

Returns the baseURI containing NFTs metadata

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | _customBaseURI baseURI |

### exists

```solidity
function exists(uint256 tokenId) public view returns (bool)
```

Checks if the tokenId exists

_Returns whether the given token Id exists._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 Id of the token to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool true if the token exists, false otherwise |

### burn

```solidity
function burn(uint256 tokenId) public
```

Burns an OdysseyNFT

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | tokenId of an OdysseyNFT |

### _increment

```solidity
function _increment() internal
```

_increments the ID counter;_

