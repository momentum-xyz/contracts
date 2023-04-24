// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OdysseyNFT
 * @dev Contract to mint and modify odyssey NFTs
 */
contract OdysseyNFT is ERC721URIStorage, Pausable, Ownable {

    uint256 private _maxTokens;
    string private _customBaseURI;

    uint256 public maxOdysseySupply = 21000;
    uint256 public maxOdysseyPerWallet = 1;
    uint256 public mintedOdysseys = 0;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxOdysseySupply_,
        string memory customBaseURI
    ) ERC721(name_, symbol_) {
         _maxTokens = maxOdysseySupply_;
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
    * @notice Returns the maximum number of Odyssey's which can be minted
    * @return _maxTokens
    */
    function maxTokens() public view returns (uint256) {
        return _maxTokens;
    }
    
    /**
    * @notice Mints new OdysseyNFT for the user
    * @return tokenId OdysseyId minted by the user
    */
    function safeMint(address to, uint256 tokenId) public whenNotPaused onlyOwner returns(uint256) {
        require(mintedOdysseys < maxTokens(), "Max Odyssey supply reached");
        require(balanceOf(to) < maxOdysseyPerWallet, "Odyssey mints per wallet exceeded");
        mintedOdysseys++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(Strings.toString(tokenId), ".json")));
        return tokenId;
    }

    /**
    * @notice Transfers OdysseyNFT from owner to buyer
    * @param from Accountid of OdysseyNFT owner
    * @param to Accountid of OdysseyNFT buyer    
    */
    function safeTransferFrom(address from, address to, uint256 tokenId) public whenNotPaused virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
    * @notice Sets the base URI of NFT metadata folder
    * @param baseURI baseURI
    */    
    function setbaseURI(string memory baseURI) public onlyOwner {
        _customBaseURI = baseURI;
    }
    
    /**
    * @notice Returns the baseURI containing NFTs metadata
    * @return _customBaseURI baseURI
    */ 
    function _baseURI() internal view virtual override returns(string memory) {
        return _customBaseURI;
    }

    /**
    * @notice Checks if the tokenId exists
    * @dev Returns whether the given token Id exists.
    * @param tokenId uint256 Id of the token to check
    * @return bool true if the token exists, false otherwise
    */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    /**
    * @notice Burns an OdysseyNFT
    * @param tokenId tokenId of an OdysseyNFT
    */ 
      function burn(uint256 tokenId) public {
        _requireMinted(tokenId);
        require(_isApprovedOrOwner(_msgSender(), tokenId), "caller is not token owner or approved");
        _burn(tokenId);
  }
}
