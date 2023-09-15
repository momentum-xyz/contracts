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

    address mom_token;
    address odyssey_nft;
    address treasury;
    uint256 fee;

    struct Node {
        uint256 node_id;
        string hostname;
        address owner;
        string name;
    }

    struct NodeIndex {
        uint256 node_id;
        uint256 index;
    }

    mapping(uint256 => uint256) nodes_index;
    mapping(uint256 => NodeIndex) node_from_odyssey;
    mapping(uint256 => uint256) odysseys_index;
    mapping(uint256 => uint256[]) odysseys;
    
    Node[] nodes;

    /**
     * @notice storage gap for upgrades
     */
    uint256[50] __gap;

    event FeeUpdated(uint256 old_fee, uint256 new_fee);
    event NodeRemoved(uint256 indexed node_id);
    event NodeUpdated(uint256 indexed node_id, address old_owner, address new_owner, string old_hostname, string new_hostname, string old_name, string new_name);
    event NodeMngmtEvent(uint256 indexed from_node_id , uint256 indexed to_node_id , uint256 indexed odyssey_id);

    function initialize(address _odyssey_nft, address _treasury, uint256 _fee, address _mom_token ) initializer public {
        odyssey_nft = _odyssey_nft;
        treasury = _treasury;
        fee = _fee;
        mom_token = _mom_token;
        nodes.push(Node(0, "", address(0), ""));
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function update_fee(uint256 new_fee) public onlyOwner {
        uint256 old_fee = fee;
        fee = new_fee;
        emit FeeUpdated(old_fee, new_fee);
    }

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

    function prefixed(bytes32 message) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    function getNodeForTheOdyssey(uint256 odyssey_id) public view returns(Node memory) {
        require(odyssey_id != 0, "Invalid input");
        require(node_from_odyssey[odyssey_id].index != 0, "Odyssey not in a node");
        return nodes[node_from_odyssey[odyssey_id].index];
    }

    function getNode(uint256 node_id) public view returns(Node memory) {
        require(node_id != 0,"Invalid input");
        require(nodes_index[node_id] != 0, "Node not mapped");
        return nodes[nodes_index[node_id]];
    }

    function setNodeMaping(uint256 node_id, uint256 odyssey_id, bytes calldata challenge) public {
        require(node_id != 0 && odyssey_id != 0 && challenge.length != 0, "Invalid Input");
        require(OdysseyNFT(odyssey_nft).exists(odyssey_id), "Odyssey dont exists");
        require(nodes_index[node_id] != 0 && nodes[nodes_index[node_id]].owner != msg.sender,
            "Invalid node ID or user is not node owner");
        require(odysseys_index[odyssey_id] == 0, "Odyssey already in a node");

        bytes32 message = prefixed(keccak256(abi.encodePacked(node_id, odyssey_id)));
        address odyssey_owner = OdysseyNFT(odyssey_nft).ownerOf(odyssey_id);
        require(recoverSigner(message, challenge) == odyssey_owner, "Invalid Message");

        if(odysseys[node_id].length == 0) {
            odysseys[node_id].push(0);
        }
        odysseys_index[odyssey_id] = odysseys[node_id].length;
        odysseys[node_id].push(odyssey_id);
        node_from_odyssey[odyssey_id] = NodeIndex(node_id, nodes_index[node_id]);
        
        emit NodeMngmtEvent(0, node_id, odyssey_id);
    }

    function setOdysseyMapping(uint256 node_id, uint256 odyssey_id, bytes calldata challenge) public {
        require(node_id != 0 && odyssey_id != 0 && challenge.length != 0, "Invalid Input");
        require(OdysseyNFT(odyssey_nft).exists(odyssey_id) && OdysseyNFT(odyssey_nft).ownerOf(odyssey_id) == msg.sender,
            "Odyssey dont exists or user is not owner.");
        require(nodes_index[node_id] != 0, "Invalid node ID");
        require(odysseys_index[odyssey_id] == 0, "Odyssey already in a node");

        bytes32 message = prefixed(keccak256(abi.encodePacked(node_id, odyssey_id)));
        require(recoverSigner(message, challenge) == nodes[nodes_index[node_id]].owner, "Invalid Message");

        if(odysseys[node_id].length == 0) {
            odysseys[node_id].push(0);
        }
        odysseys_index[odyssey_id] = odysseys[node_id].length;
        odysseys[node_id].push(odyssey_id);
        node_from_odyssey[odyssey_id] = NodeIndex(node_id, nodes_index[node_id]);
        
        emit NodeMngmtEvent(0, node_id, odyssey_id);
    }

    function removeMapping(uint256 node_id, uint256 odyssey_id) public {
        require(node_id != 0 && odyssey_id != 0, "Invalid Input");
        require(nodes_index[node_id] != 0 && OdysseyNFT(odyssey_nft).exists(odyssey_id), "invalid Node or Odyssey");
        require(msg.sender == nodes[nodes_index[node_id]].owner || OdysseyNFT(odyssey_nft).ownerOf(odyssey_id) == msg.sender,
            "User is not the node owner or the Odyssey owner");
        require(odysseys_index[odyssey_id] != 0 && node_from_odyssey[odyssey_id].node_id == node_id, "Odyssey not in the Node");

        uint256 odyssey_index = odysseys_index[odyssey_id];
        uint256 last_odyssey = odysseys[node_id][odysseys[node_id].length-1];
        odysseys[node_id][odysseys[node_id].length-1] = odyssey_id;
        odysseys[node_id][odyssey_index] = last_odyssey;
        odysseys[node_id].pop();

        odysseys_index[last_odyssey] = odyssey_index;
        odysseys_index[odyssey_id] = 0;
    }

    function updateNodeOwner(uint256 node_id, address new_owner) public {
        require(node_id != 0 && new_owner != address(0), "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node storage node = nodes[node_index];
        require(node.owner == msg.sender, "User is not the node owner");

        node.owner = new_owner;

        emit NodeUpdated(node_id, msg.sender, new_owner, "", "", "", "");
    }

    function updateNode(uint256 node_id, string calldata hostname, string calldata name) public {
        require(node_id != 0 && bytes(hostname).length != 0  && bytes(name).length != 0, "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node storage node = nodes[node_index];
        require(node.owner == msg.sender, "User is not the node owner");
        string memory old_hostname = node.hostname;
        string memory old_name = node.name;
        node.hostname = hostname;
        node.name = name;

        emit NodeUpdated(node_id, msg.sender, address(0), old_hostname, hostname, old_name, name);
    }

    function addNode(uint256 node_id, string calldata hostname, string calldata name) public {
        require(node_id != 0 && bytes(hostname).length != 0  && bytes(name).length != 0 && msg.sender != address(0), "Invalid input" );
        
        IERC20(mom_token).safeTransferFrom(payable(msg.sender), address(this), fee);
        
        nodes_index[node_id] = nodes.length;

        Node memory node = Node(node_id, name, msg.sender, hostname);
        nodes.push(node);

        emit NodeUpdated(node_id, address(0), msg.sender, "", hostname, "", name);
    }

    function removeNode(uint256 node_id) public {
        require(node_id != 0, "Invalid input");
        uint256 node_index = nodes_index[node_id];
        require(node_index != 0, "Node not registered");
        Node memory node = nodes[node_index];
        require(odysseys[node_id].length > 0, "There are Odysseys in this node");

        Node memory last_node = nodes[nodes.length-1];
        nodes[nodes.length-1] = node;
        nodes[node_index] = last_node;
        nodes.pop();

        nodes_index[last_node.node_id] = node_index;
        nodes_index[node.node_id] = 0;

        emit NodeMngmtEvent(node_id, 0, 0);
    }
}
