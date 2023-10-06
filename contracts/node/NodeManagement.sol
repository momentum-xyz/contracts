// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../token/MomToken.sol";
import "../nft/OdysseyNFT.sol";



/** 
* @title NodeManagement Contract
* @author Odyssey
* @notice The Momentum NodeManagement mechanism
*/
contract NodeManagement is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice MOM token address
     */
    address mom_token;

    /**
     * @notice Odyssey NFT's token address
     */
    address odyssey_nft;

    /**
     * @notice Treasury address
     */
    address treasury;

    /**
     * @notice Fee to register a node in Mom
     */
    uint256 feeMom;

    /**
     * @notice Fee to register a node in ETH
     */
    uint256 feeETH;

    /**
     * @dev Node struct with info about the node
     */
    struct Node {
        uint256 node_id;
        string name;
        string hostname;
        address owner;
        bytes32 pubkey;
        address node_account;
    }

    /**
     * @dev Struct to facilitate the search of a Node
     */
    struct NodeIndex {
        uint256 node_id;
        uint256 index;
    }

    /**
     * @notice Map the Node ID to the it's index in the vector
     */
    mapping(uint256 => uint256) nodes_index;

    /**
     * @notice Map an Odyssey ID to it's node index
     */
    mapping(uint256 => NodeIndex) node_from_odyssey;

    /**
     * @notice Map an Odyssey ID to it's index in the vector
     */
    mapping(uint256 => uint256) odysseys_index;

    /**
     * @notice Map a Node ID to it's vector of Odysseys
     */
    mapping(uint256 => uint256[]) odysseys;

    /**
     * @notice Nodes mapped
     */
    Node[] nodes;

    /**
     * @notice storage gap for upgrades
     */
    uint256[50] __gap;

    /**
     * 
     * @param old_fee Previous set fee
     * @param new_fee New fee being set
     */
    event FeeUpdatedEth(uint256 old_fee, uint256 new_fee);


    /**
     *
     * @param old_fee Previous set fee
     * @param new_fee New fee being set
     */
    event FeeUpdatedMom(uint256 old_fee, uint256 new_fee);

    /**
     * 
     * @param node_id Node ID from the removed node
     */
    event NodeRemoved(uint256 indexed node_id);

    /**
     * 
     * @param node_id Node's ID
     * @param old_owner Previous owner of the node
     * @param new_owner New owner of the node
     * @param old_hostname Previous hostname of the node
     * @param new_hostname New hostname of the node
     * @param old_name Previous Node's name
     * @param new_name New Node's name
     */
    event NodeUpdated(uint256 indexed node_id, address old_owner, address new_owner, string old_hostname, string new_hostname, string old_name, string new_name);

    /**
     * 
     * @param from_node_id From this Node ID
     * @param to_node_id To this Node ID
     * @param odyssey_id Odyssey's ID
     */
    event NodeMgmtEvent(uint256 indexed from_node_id, uint256 indexed to_node_id, uint256 indexed odyssey_id);

    /**
     * @dev Initializer of the contract, is called when deploying
     * @param _odyssey_nft Odyssey NFT contract address
     * @param _treasury Treasury address
     * @param _feeEth initial fee to map node, in ETH
     * @param _feeMom initial fee to map node, in MOM
     * @param _mom_token MOM Token contract address
     */
    function initialize(address _odyssey_nft, address _treasury, uint256 _feeEth, uint256 _feeMom, address _mom_token) initializer public {
        odyssey_nft = _odyssey_nft;
        treasury = _treasury;
        feeETH = _feeEth;
        feeMom = _feeMom;
        mom_token = _mom_token;
        nodes.push(Node(0, "", "", address(0),bytes32(0),address(0)));
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyOwner
    override
    {}

    /**
     * @dev Update the current fee in ETH
     * @param new_feeEth New fee value to map a node
     */
    function update_feeEth(uint256 new_feeEth) public onlyOwner {
        uint256 old_feeEth = feeETH;
        feeETH = new_feeEth;
        emit FeeUpdatedEth(old_feeEth, new_feeEth);
    }

    /**
     * @dev Update the current fee
     * @param new_feeMom New fee value to map a node
     */
    function update_feeMom(uint256 new_feeMom) public onlyOwner {
        uint256 old_feeMom = feeMom;
        feeMom = new_feeMom;
        emit FeeUpdatedMom(old_feeMom, new_feeMom);
    }

    /**
     * @dev Splits the signature from a signed message
     * @param sig Signed message
     * @return R part from signature
     * @return S part from signature
     * @return V part from signature
     */
    function splitSignature(bytes memory sig)
    public
    pure
    returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
        // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
        // second 32 bytes
            s := mload(add(sig, 64))
        // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    /**
     * @dev Calcuate address for given public key
     * @param pubkey Public key
     * @return Address that corresponds to public key
    */
    function calculateAddress(bytes32 pubkey)
    internal
    pure
    returns (address){
        return address(bytes20(keccak256( abi.encodePacked(pubkey))));
    }

    /**
     * @dev Recover's the signer of the message
     * @param message Prefixed message
     * @param sig Signed message
     * @return Address that signed the message
     */
    function recoverSigner(bytes32 message, bytes calldata sig)
    internal
    pure
    returns (address)
    {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /**
     * @dev Prefix a message with ETH default prefix
     * @param message Message without prefix
     * @return Prefixed message
     */
    function prefixed(bytes32 message) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    /**
     * @dev Get a node from an Odyssey ID
     * @param odyssey_id Odyssey ID
     * @return Node that the Odyssey is mapped to
     */
    function getNodeForTheOdyssey(uint256 odyssey_id) public view returns (Node memory) {
        require(odyssey_id != 0, "Invalid input");
        require(node_from_odyssey[odyssey_id].index != 0 && odysseys_index[odyssey_id] != 0, "Odyssey not in a node");
        return nodes[node_from_odyssey[odyssey_id].index];
    }

    /**
     * @dev Get a node from it's ID
     * @param node_id Node's ID 
     * @return Node 
     */
    function getNode(uint256 node_id) public view returns (Node memory) {
        require(node_id != 0, "Invalid input");
        require(nodes_index[node_id] != 0, "Node not mapped");
        return nodes[nodes_index[node_id]];
    }

    /**
     * @dev Set a new mapping by a Node. This is done by checking a challenge.
     * The message should be signed by the Odyssey owner and the contents should be "<NodeID><OdysseyID>"
     * @param node_id Node's ID
     * @param odyssey_id Odyssey's ID
     * @param challenge Challange to be checked
     */
    function setNodeMapping(uint256 node_id, uint256 odyssey_id, bytes calldata challenge) public {
        require(node_id != 0 && odyssey_id != 0 && challenge.length != 0, "Invalid Input");
        require(OdysseyNFT(odyssey_nft).exists(odyssey_id), "Odyssey dont exists");
        require(nodes_index[node_id] != 0 && (nodes[nodes_index[node_id]].owner == msg.sender
            || nodes[nodes_index[node_id]].node_account == msg.sender),
            "Invalid node ID or user is not node owner");
        require(odysseys_index[odyssey_id] == 0, "Odyssey already in a node");

        bytes32 message = prefixed(keccak256(abi.encodePacked(node_id, odyssey_id)));
        address odyssey_owner = OdysseyNFT(odyssey_nft).ownerOf(odyssey_id);
        require(recoverSigner(message, challenge) == odyssey_owner, "Invalid Message");

        if (odysseys[node_id].length == 0) {
            odysseys[node_id].push(0);
        }
        odysseys_index[odyssey_id] = odysseys[node_id].length;
        odysseys[node_id].push(odyssey_id);
        node_from_odyssey[odyssey_id] = NodeIndex(node_id, nodes_index[node_id]);

        emit NodeMgmtEvent(0, node_id, odyssey_id);
    }

    /**
     * @dev Set a new mapping by a Node. This is done by checking a challenge.
     * The message should be signed by the Node owner or node itself and the contents should be "<NodeID><OdysseyID>"
     * @param node_id Node's ID
     * @param odyssey_id Odyssey's ID
     * @param challenge Challange to be checked
     */
    function setOdysseyMapping(uint256 node_id, uint256 odyssey_id, bytes calldata challenge) public {
        require(node_id != 0 && odyssey_id != 0 && challenge.length != 0, "Invalid Input");
        require(OdysseyNFT(odyssey_nft).exists(odyssey_id) && OdysseyNFT(odyssey_nft).ownerOf(odyssey_id) == msg.sender,
            "Odyssey dont exists or user is not owner.");
        require(nodes_index[node_id] != 0, "Invalid node ID");
        require(odysseys_index[odyssey_id] == 0, "Odyssey already in a node");

        bytes32 message = prefixed(keccak256(abi.encodePacked(node_id, odyssey_id)));
        address signer = recoverSigner(message, challenge);
        require(signer == nodes[nodes_index[node_id]].owner || signer == nodes[nodes_index[node_id]].node_account, "Invalid Message");

        if (odysseys[node_id].length == 0) {
            odysseys[node_id].push(0);
        }
        odysseys_index[odyssey_id] = odysseys[node_id].length;
        odysseys[node_id].push(odyssey_id);
        node_from_odyssey[odyssey_id] = NodeIndex(node_id, nodes_index[node_id]);

        emit NodeMgmtEvent(0, node_id, odyssey_id);
    }

    /**
     * @dev Removes a mapping. This can be done either by Odyssey or Node owners or node itself.
     * @param node_id Node's ID
     * @param odyssey_id Odyssey's ID
     */
    function removeMapping(uint256 node_id, uint256 odyssey_id) public {
        require(node_id != 0 && odyssey_id != 0, "Invalid Input");
        require(nodes_index[node_id] != 0 && OdysseyNFT(odyssey_nft).exists(odyssey_id), "invalid Node or Odyssey");
        require(msg.sender == nodes[nodes_index[node_id]].owner || msg.sender == nodes[nodes_index[node_id]].node_account ||
            OdysseyNFT(odyssey_nft).ownerOf(odyssey_id) == msg.sender,
            "User is not the node owner or the Odyssey owner");
        require(odysseys_index[odyssey_id] != 0 && node_from_odyssey[odyssey_id].node_id == node_id, "Odyssey not in the Node");

        uint256 odyssey_index = odysseys_index[odyssey_id];
        uint256 last_odyssey = odysseys[node_id][odysseys[node_id].length - 1];
        odysseys[node_id][odysseys[node_id].length - 1] = odyssey_id;
        odysseys[node_id][odyssey_index] = last_odyssey;
        odysseys[node_id].pop();

        odysseys_index[last_odyssey] = odyssey_index;
        odysseys_index[odyssey_id] = 0;
    }

    /**
     * @dev Updates the Node Owner
     * @param node_id Node's ID to be updated
     * @param new_owner Address of the new owner
     */
    function updateNodeOwner(uint256 node_id, address new_owner) public {
        require(node_id != 0 && new_owner != address(0), "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node storage node = nodes[node_index];
        require(node.owner == msg.sender, "User is not the node owner");

        node.owner = new_owner;

        emit NodeUpdated(node_id, msg.sender, new_owner, "", "", "", "");
    }

    /**
     * @dev Updates the Node Public key
     * @param node_id Node's ID to be updated
     * @param new_pubkey new public key
     */
    function updateNodePubkey(uint256 node_id, bytes32 new_pubkey) public {
        require(node_id != 0 && new_pubkey != bytes32(0), "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node storage node = nodes[node_index];
        require(node.owner == msg.sender, "User is not the node owner");

        node.pubkey = new_pubkey;
        node.node_account = calculateAddress(new_pubkey);
    }

    /**
     * @dev Updates a node info
     * @param node_id Node's ID
     * @param hostname New Node's hostname
     * @param name New Node's name
     */
    function updateNode(uint256 node_id, string calldata hostname, string calldata name) public {
        require(node_id != 0 && bytes(hostname).length != 0 && bytes(name).length != 0, "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node storage node = nodes[node_index];
        require(node.owner == msg.sender && node.node_account == msg.sender, "Must be called by node or owner");
        string memory old_hostname = node.hostname;
        string memory old_name = node.name;
        node.hostname = hostname;
        node.name = name;

        emit NodeUpdated(node_id, msg.sender, address(0), old_hostname, hostname, old_name, name);
    }

    /**
     * @dev Adds(register) a node
     * @param node_id Node's ID
     * @param hostname Node's hostname
     * @param name Node's name
     */
    function addNode(uint256 node_id, string calldata hostname, string calldata name, bytes32 pubkey) internal {
        nodes_index[node_id] = nodes.length;

        Node memory node = Node(node_id, name, hostname, msg.sender, pubkey,calculateAddress(pubkey));
        nodes.push(node);

        emit NodeUpdated(node_id, address(0), msg.sender, "", hostname, "", name);
    }


    /**
     * @dev Adds(register) a node with MOM payment
     * @param node_id Node's ID
     * @param hostname Node's hostname
     * @param name Node's name
     */
    function addNodeWithMom(uint256 node_id, string calldata hostname, string calldata name, bytes32 pubkey) public {
        require(node_id != 0 && bytes(hostname).length != 0 && bytes(name).length != 0 && msg.sender != address(0), "Invalid input");
        require(nodes_index[node_id] == 0, "Node already mapped");
        IERC20(mom_token).safeTransferFrom(payable(msg.sender), address(this), feeMom);
        addNode(node_id,hostname,name,pubkey);

    }

    /**
     * @dev Adds(register) a node with ETH payment
     * @param node_id Node's ID
     * @param hostname Node's hostname
     * @param name Node's name
     */
    function addNodeWithEth(uint256 node_id, string calldata hostname, string calldata name, bytes32 pubkey) public {
        require(node_id != 0 && bytes(hostname).length != 0 && bytes(name).length != 0 && msg.sender != address(0), "Invalid input");
        require(nodes_index[node_id] == 0, "Node already mapped");
//
//        E.safeTransferFrom(payable(msg.sender), address(this), feeETH);

        addNode(node_id,hostname,name,pubkey);
    }

    /**
     * @dev Remove a node
     * @param node_id Node's ID
     */
    function removeNode(uint256 node_id) public {
        require(node_id != 0, "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node memory node = nodes[node_index];
        // The first Odyssey on the mapping is a dummy one
        require(odysseys[node_id].length <= 1, "There are Odysseys mapped to this node");

        Node memory last_node = nodes[nodes.length - 1];
        nodes[nodes.length - 1] = node;
        nodes[node_index] = last_node;
        nodes.pop();

        nodes_index[last_node.node_id] = node_index;
        nodes_index[node.node_id] = 0;

        emit NodeMgmtEvent(node_id, 0, 0);
    }
}

