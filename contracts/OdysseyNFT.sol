// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


/**
 * @title OdysseyNFT
 * @dev Contract to mint and modify odyssey NFTs
 */
contract OdysseyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _odysseyIds;

    uint256 private _tokenIdCounter;
    uint256 private _maxTokens;
    uint256 private _mintPrice;
    bool private _mintingPaused;
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
        _mintingPaused = false;
        _customBaseURI = customBaseURI;

    }

    /**
    * @notice Pauses minting of new OdysseyNFT's
    */
    function pauseMinting() public onlyOwner {
        _mintingPaused = true;
    }

    /**
    * @notice Enables minting of new OdysseyNFT's
    */
    function unpauseMinting() public onlyOwner {
        _mintingPaused = false;
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
    * @notice Returns the state of miniting process 
    * @return _mintingPaused
    */
    function mintingPaused() public view returns (bool) {
        return _mintingPaused;
    }
    
    /**
    * @notice Mints new OdysseyNFT for the user
    * @return tokenId OdysseyId minted by the user
    */
    function mintNFT() public payable returns(uint256) {
        require(!_mintingPaused, "Odyssey Minting is paused");
        require( _mintPrice == msg.value, "wrong amount sent");
        require(walletMints[msg.sender] < maxOdysseyPerWallet, "Odyssey mints per wallet exceeded");
        walletMints[msg.sender] += 1;
        _odysseyIds.increment();
        uint256 tokenId = _odysseyIds.current();
        require(tokenId < maxTokens(), "Max Odyssey supply reached");
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId);
        return tokenId;
    }

    /**
    * @notice Transfers OdysseyNFT from owner to buyer
    * @param from Accountid of OdysseyNFT owner
    * @param to Accountid of OdysseyNFT buyer    
    */
    function transferOdyssey(address from, address to, uint256 tokenId)
        public
    {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(to != address(0), "ERC721: transfer to the zero address");
        safeTransferFrom(from, to, tokenId);
    }


    /**
    * @notice Sets the base URI of NFT folder in IPFS
    * @param baseURI Accountid of OdysseyNFT owner
    */    
    function setbaseURI(string memory baseURI) public onlyOwner {
        _customBaseURI = baseURI;
    }
    
    /**
    * @notice Returns the baseURI of the IPFS containing NFTs
    * @return _customBaseURI Accountid of OdysseyNFT owner
    */ 
    function _baseURI() internal view virtual override returns(string memory) {
        return _customBaseURI;
    }

    /**
    * @notice Burns an OdysseyNFT
    * @param tokenId tokenId of the OdysseyNFT
    */ 
      function burnToken(uint256 tokenId) public onlyOwner {
      _burn(tokenId);
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