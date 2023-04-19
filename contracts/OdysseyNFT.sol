// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title OdysseyNFT
 * @dev Contract to mint and modify odyssey NFTs
 */
contract OdysseyNFT is ERC721URIStorage, Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _odysseyIds;

    uint256 private _tokenIdCounter;
    uint256 private _maxTokens;
    uint256 private _mintPrice;
    string private _customBaseURI;

    // uint256 public mintPrice = 1 ether;
    uint256 public maxOdysseySupply = 21000;
    uint256 public maxOdysseyPerWallet = 1;

    mapping(address => uint256) public walletMints;

    mapping (uint256 => string) private _tokenURIs;


    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxOdysseySupply_,
        uint256 mintPrice_,
        string memory customBaseURI
    ) ERC721(name_, symbol_) {
         _maxTokens = maxOdysseySupply_;
        _mintPrice = mintPrice_;
        _customBaseURI = customBaseURI;

    }

    /**
    * @notice Pauses minting of new OdysseyNFT's
    */
    function pause() public onlyOwner {
        _pause();
    }

    /**
    * @notice Enables minting of new OdysseyNFT's
    */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
    * @notice Sets the maximum number of Odysseys which can be minted
    * @param maxTokens_ Maximum limit for number of odysseys
    */
    function setMaxTokens(uint256 maxTokens_) public onlyOwner {
        _maxTokens = maxTokens_;
    }

    /**
    * @notice Sets the price of minting one Odyssey
    * @param mintPrice_ Price of one Odyssey
    */
    function setMintPrice(uint256 mintPrice_) public onlyOwner {
        _mintPrice = mintPrice_;
    }

    /**
    * @notice Returns the maximum number of Odyssey's which can be minted
    * @return _maxTokens
    */
    function maxTokens() public view returns (uint256) {
        return _maxTokens;
    }

    /**
    * @notice Returns minting price of one Odyssey
    * @return _mintPrice
    */
    function mintPrice() public view returns (uint256) {
        return _mintPrice;
    }
    
    /**
    * @notice Mints new OdysseyNFT for the user
    * @return tokenId OdysseyId minted by the user
    */
    function safeMint(address to, uint256 tokenId) public whenNotPaused onlyOwner returns(uint256) {
        require(walletMints[to] <= maxOdysseyPerWallet, "Odyssey mints per wallet exceeded");
        walletMints[to] += 1;
        _odysseyIds.increment();
        require(tokenId < maxTokens(), "Max Odyssey supply reached");
        _safeMint(to, tokenId);
        _setTokenURI(tokenId);
        return tokenId;
    }

    /**
    * @notice Transfers OdysseyNFT from owner to buyer
    * @param from Accountid of OdysseyNFT owner
    * @param to Accountid of OdysseyNFT buyer    
    */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(!paused(), "Contract is paused");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(to != address(0), "ERC721: transfer to the zero address");
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
    * @notice Sets the base URI of NFT folder in IPFS
    * @param baseURI IPFS baseURI
    */    
    function setbaseURI(string memory baseURI) public onlyOwner {
        _customBaseURI = baseURI;
    }
    
    /**
    * @notice Returns the baseURI of the IPFS folder containing NFTs
    * @return _customBaseURI IPFS baseURI
    */ 
    function _baseURI() internal view virtual override returns(string memory) {
        return _customBaseURI;
    }

        function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    /**
    * @notice Burns an OdysseyNFT
    * @param tokenId tokenId of an OdysseyNFT
    */ 
      function burnToken(uint256 tokenId) public onlyOwner returns(bool) {
        require(exists(tokenId), "token does not exist");
        delete _tokenURIs[tokenId];
        _burn(tokenId);
        return true;
  }


    /**
    * @notice Set the tokenURI
    * @param tokenId tokenId of the OdysseyNFT
    */ 
    function _setTokenURI(uint256 tokenId) internal virtual {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = tokenURI(tokenId);
    }



}