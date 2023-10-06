# Solidity API

## NodeManagement

The Momentum NodeManagement mechanism

### constructor

```solidity
constructor() public
```

### mom_token

```solidity
address mom_token
```

MOM token address

### odyssey_nft

```solidity
address odyssey_nft
```

Odyssey NFT's token address

### treasury

```solidity
address treasury
```

Treasury address

### feeMom

```solidity
uint256 feeMom
```

Fee to register a node in Mom

### feeETH

```solidity
uint256 feeETH
```

Fee to register a node in ETH

### Node

```solidity
struct Node {
  uint256 node_id;
  string name;
  string hostname;
  address owner;
  bytes32 pubkey;
  address node_account;
}
```

### NodeIndex

```solidity
struct NodeIndex {
  uint256 node_id;
  uint256 index;
}
```

### nodes_index

```solidity
mapping(uint256 => uint256) nodes_index
```

Map the Node ID to the it's index in the vector

### node_from_odyssey

```solidity
mapping(uint256 => struct NodeManagement.NodeIndex) node_from_odyssey
```

Map an Odyssey ID to it's node index

### odysseys_index

```solidity
mapping(uint256 => uint256) odysseys_index
```

Map an Odyssey ID to it's index in the vector

### odysseys

```solidity
mapping(uint256 => uint256[]) odysseys
```

Map a Node ID to it's vector of Odysseys

### nodes

```solidity
struct NodeManagement.Node[] nodes
```

Nodes mapped

### __gap

```solidity
uint256[50] __gap
```

storage gap for upgrades

### FeeUpdatedEth

```solidity
event FeeUpdatedEth(uint256 old_fee, uint256 new_fee)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| old_fee | uint256 | Previous set fee |
| new_fee | uint256 | New fee being set |

### FeeUpdatedMom

```solidity
event FeeUpdatedMom(uint256 old_fee, uint256 new_fee)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| old_fee | uint256 | Previous set fee |
| new_fee | uint256 | New fee being set |

### NodeRemoved

```solidity
event NodeRemoved(uint256 node_id)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node ID from the removed node |

### NodeUpdated

```solidity
event NodeUpdated(uint256 node_id, address old_owner, address new_owner, string old_hostname, string new_hostname, string old_name, string new_name)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| old_owner | address | Previous owner of the node |
| new_owner | address | New owner of the node |
| old_hostname | string | Previous hostname of the node |
| new_hostname | string | New hostname of the node |
| old_name | string | Previous Node's name |
| new_name | string | New Node's name |

### NodeMgmtEvent

```solidity
event NodeMgmtEvent(uint256 from_node_id, uint256 to_node_id, uint256 odyssey_id)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from_node_id | uint256 | From this Node ID |
| to_node_id | uint256 | To this Node ID |
| odyssey_id | uint256 | Odyssey's ID |

### initialize

```solidity
function initialize(address _odyssey_nft, address _treasury, uint256 _feeEth, uint256 _feeMom, address _mom_token) public
```

_Initializer of the contract, is called when deploying_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _odyssey_nft | address | Odyssey NFT contract address |
| _treasury | address | Treasury address |
| _feeEth | uint256 | initial fee to map node, in ETH |
| _feeMom | uint256 | initial fee to map node, in MOM |
| _mom_token | address | MOM Token contract address |

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

### update_feeEth

```solidity
function update_feeEth(uint256 new_feeEth) public
```

_Update the current fee in ETH_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| new_feeEth | uint256 | New fee value to map a node |

### update_feeMom

```solidity
function update_feeMom(uint256 new_feeMom) public
```

_Update the current fee_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| new_feeMom | uint256 | New fee value to map a node |

### splitSignature

```solidity
function splitSignature(bytes sig) public pure returns (uint8, bytes32, bytes32)
```

_Splits the signature from a signed message_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sig | bytes | Signed message |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | R part from signature |
| [1] | bytes32 | S part from signature |
| [2] | bytes32 | V part from signature |

### calculateAddress

```solidity
function calculateAddress(bytes32 pubkey) internal pure returns (address)
```

_Calcuate address for given public key_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pubkey | bytes32 | Public key |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | Address that corresponds to public key |

### recoverSigner

```solidity
function recoverSigner(bytes32 message, bytes sig) internal pure returns (address)
```

_Recover's the signer of the message_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| message | bytes32 | Prefixed message |
| sig | bytes | Signed message |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | Address that signed the message |

### prefixed

```solidity
function prefixed(bytes32 message) internal pure returns (bytes32)
```

_Prefix a message with ETH default prefix_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| message | bytes32 | Message without prefix |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | Prefixed message |

### getNodeForTheOdyssey

```solidity
function getNodeForTheOdyssey(uint256 odyssey_id) public view returns (struct NodeManagement.Node)
```

_Get a node from an Odyssey ID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| odyssey_id | uint256 | Odyssey ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeManagement.Node | Node that the Odyssey is mapped to |

### getNode

```solidity
function getNode(uint256 node_id) public view returns (struct NodeManagement.Node)
```

_Get a node from it's ID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeManagement.Node | Node |

### setNodeMapping

```solidity
function setNodeMapping(uint256 node_id, uint256 odyssey_id, bytes challenge) public
```

_Set a new mapping by a Node. This is done by checking a challenge.
The message should be signed by the Odyssey owner and the contents should be "<NodeID><OdysseyID>"_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| odyssey_id | uint256 | Odyssey's ID |
| challenge | bytes | Challange to be checked |

### setOdysseyMapping

```solidity
function setOdysseyMapping(uint256 node_id, uint256 odyssey_id, bytes challenge) public
```

_Set a new mapping by a Node. This is done by checking a challenge.
The message should be signed by the Node owner or node itself and the contents should be "<NodeID><OdysseyID>"_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| odyssey_id | uint256 | Odyssey's ID |
| challenge | bytes | Challange to be checked |

### removeMapping

```solidity
function removeMapping(uint256 node_id, uint256 odyssey_id) public
```

_Removes a mapping. This can be done either by Odyssey or Node owners or node itself._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| odyssey_id | uint256 | Odyssey's ID |

### updateNodeOwner

```solidity
function updateNodeOwner(uint256 node_id, address new_owner) public
```

_Updates the Node Owner_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID to be updated |
| new_owner | address | Address of the new owner |

### updateNodePubkey

```solidity
function updateNodePubkey(uint256 node_id, bytes32 new_pubkey) public
```

_Updates the Node Public key_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID to be updated |
| new_pubkey | bytes32 | new public key |

### updateNode

```solidity
function updateNode(uint256 node_id, string hostname, string name) public
```

_Updates a node info_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| hostname | string | New Node's hostname |
| name | string | New Node's name |

### addNode

```solidity
function addNode(uint256 node_id, string hostname, string name, bytes32 pubkey) internal
```

_Adds(register) a node_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| hostname | string | Node's hostname |
| name | string | Node's name |
| pubkey | bytes32 |  |

### addNodeWithMom

```solidity
function addNodeWithMom(uint256 node_id, string hostname, string name, bytes32 pubkey) public
```

_Adds(register) a node with MOM payment_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| hostname | string | Node's hostname |
| name | string | Node's name |
| pubkey | bytes32 |  |

### addNodeWithEth

```solidity
function addNodeWithEth(uint256 node_id, string hostname, string name, bytes32 pubkey) public
```

_Adds(register) a node with ETH payment_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |
| hostname | string | Node's hostname |
| name | string | Node's name |
| pubkey | bytes32 |  |

### removeNode

```solidity
function removeNode(uint256 node_id) public
```

_Remove a node_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_id | uint256 | Node's ID |

