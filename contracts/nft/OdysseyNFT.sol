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

    /**
     * @dev Odyssey Id incremental counter
     */
    uint256 private _counter = 0;

    /**
     * @dev Max tokens supply
     */
    uint256 private _maxTokens;

    /**
     * @dev UUID Mask for compatibility
     */
    uint256 private _UUIDMask = 0x80008000000000000000;

    /**
     * @dev Custom base URI for the tokens
     */
    string private _customBaseURI;

    /**
     * @notice Max Odysseys per wallet allowed
     */
    uint256 public maxOdysseyPerWallet = 1;

    /**
     * @notice Total number of Odysseys.
     * It will increase when minting, and decrease when burning.
     */
    uint256 public odysseys = 0;

/**
 *  @dev Constructor of the contract
 * @param name_ ERC712 name
 * @param symbol_ ERC721 Symbol
 * @param maxOdysseySupply_ Max Odyssey supply
 * @param customBaseURI The custom base URI
 */
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
     * @notice Returns the current id from the id counter
     * @return uint256 current ID counter value
     */
    function currentId() public view returns (uint256) {
        return _counter;
    }
    
    /**
    * @notice Mints new OdysseyNFT for the user
    * @param to The user address to mint the NFT
    */
    function safeMint(address to) public whenNotPaused onlyOwner {
        require(odysseys < maxTokens(), "Max Odyssey supply reached");
        require(balanceOf(to) < maxOdysseyPerWallet, "Odyssey mints per wallet exceeded");
        _increment();
        uint256 token_id = _counter;
        odysseys++;
        _safeMint(to, token_id);
        _setTokenURI(token_id, Strings.toString(token_id));
    }

    /**
    * @notice Transfers OdysseyNFT from owner to buyer
    * @param from Accountid of OdysseyNFT owner
    * @param to Accountid of OdysseyNFT buyer   
    * @param tokenId The OdysseyId to transfer 
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
        odysseys--;
        _burn(tokenId);
    }
    
    /**
     * @dev increments the ID counter;
     */
    function _increment() internal {
        _counter = (_counter + 1) | _UUIDMask;
    }


}
