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
    uint256 constant private _UUIDMask = 0x80008000000000000000;

    /**
     * @dev Custom base URI for the tokens
     */
    string private _customBaseURI;

    /**
     * @notice Max Odysseys per wallet allowed
     */
    uint256 private _maxOdysseysPerWallet;

    /**
     * @notice Total number of Odysseys.
     * It will increase when minting, and decrease when burning.
     */
    uint256 public odysseys = 0;

    /**
     * 
     * @param state State variable name
     * @param from from value
     * @param to to value
     */
    event StateUpdated(string indexed state, uint256 from, uint256 to);

    /**
     * @dev Overloading StateUpdated event to log string
     * @param state State variable name
     * @param from from value
     * @param to to value
     */
    event StateUpdated(string indexed state, string from, string to);

/**
 * @dev Constructor of the contract
 * @param name_ ERC712 name
 * @param symbol_ ERC721 Symbol
 * @param maxTokens_ Max Odyssey supply
 * @param maxOdysseysPerWallet_ Max Odysseys per wallet
 * @param customBaseURI The custom base URI
 */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxTokens_,
        uint256 maxOdysseysPerWallet_,
        string memory customBaseURI
    ) ERC721(name_, symbol_) {
         _maxTokens = maxTokens_;
         _maxOdysseysPerWallet = maxOdysseysPerWallet_;
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
        uint256 old_value = _maxTokens;
        _maxTokens = maxTokens_;
        emit StateUpdated("Max Tokens", old_value, _maxTokens);
    }

    /**
    * @notice Returns the maximum number of Odyssey's which can be minted
    * @return _maxTokens
    */
    function maxTokens() public view returns (uint256) {
        return _maxTokens;
    }

    /**
    * @notice Sets the maximum number of Odysseys which can be minted per wallet
    * @param maxOdysseysPerWallet_ Maximum limit for number of odysseys per wallet
    */
    function setMaxOdysseysPerWallet(uint256 maxOdysseysPerWallet_) public onlyOwner {
        uint256 old_value = _maxOdysseysPerWallet;
        _maxOdysseysPerWallet = maxOdysseysPerWallet_;
        emit StateUpdated("Max Odysseys per Wallet", old_value, _maxOdysseysPerWallet);
    }

    /**
    * @notice Returns the maximum number of Odyssey's which can be minted per wallet
    * @return _maxOdysseysPerWallet
    */
    function maxOdysseysPerWallet() public view returns (uint256) {
        return _maxOdysseysPerWallet;
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
        require(balanceOf(to) < _maxOdysseysPerWallet, "Odyssey mints per wallet exceeded");
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
    function safeTransferFrom(address from, address to, uint256 tokenId) public whenNotPaused virtual override(ERC721, IERC721) {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
    * @notice Sets the base URI of NFT metadata folder
    * @param baseURI baseURI
    */    
    function setbaseURI(string calldata baseURI) public onlyOwner {
        string memory old_value = _customBaseURI;
        _customBaseURI = baseURI;
        emit StateUpdated("Base URI", old_value, _customBaseURI);
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
