// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract AthleteNft is ERC1155Pausable {
  event athleteNftBought(address buyer, uint256 id);
  event athleteNftSold(address seller, uint256 id);

  IERC20 public purchaseTokenContract;
  // Define start and end range for NFT ids for current season
  uint256 public currentSeasonIdRangeStart;
  uint256 public currentSeasonIdRangeEnd;
  /* Season states:
    0 - Season inactive and buy-back period is over
    1 - Season inactive and buy-back period is active (users can sell NFTs back to freeda) (30 days)
    2 - Season active
  */
  uint8 public seasonState;
  address public owner;

  mapping(address => uint256) private _whitelist; // whitelist for contract and nft config
  mapping(uint256 => uint256) public mintCount; // nfts in existence
  mapping(uint256 => uint256) public price; // price of athlete nft
  mapping(uint256 => uint256) public maxSupply; // max supply of athlete nft

  constructor(
      uint8 _seasonState,
      uint256 _currentSeasonIdRangeStart,
      uint256 _currentSeasonIdRangeEnd,
      address _purchaseTokenContract) ERC1155("http://localhost/uri/{id}.json") {
    seasonState = _seasonState;
    currentSeasonIdRangeStart = _currentSeasonIdRangeStart;
    currentSeasonIdRangeEnd = _currentSeasonIdRangeEnd;
    purchaseTokenContract = IERC20(_purchaseTokenContract);
    owner = msg.sender;
    _whitelist[msg.sender] = 999;
  }


  modifier ownerOnly() {
    require(msg.sender == owner, "Freeda Play Athlete NFT: Caller is not owner");
    _;
  }

  modifier requireWhitelistLevel(uint256 level) {
    require(_whitelist[msg.sender] > level, "Freeda Play Athlete NFT: Whitelist level not high enough");
    _;
  }

  modifier requireSeasonStateEither(uint8 _state1, uint8 _state2) {
    require(seasonState == _state1 || seasonState == _state2, "Freeda Play Athlete NFT: Current season is in invalid state for function call");
    _;
  }

  modifier requireActiveAthleteNft(uint256 _id) {
    (uint256 lowerBound, uint256 upperBound) = getCurrentSeasonIdRange();
    require(_id >= lowerBound && _id <= upperBound,
      "Freeda Athlete NFT: NFT is not active for this season");
    _;
  }


  // Main Functions
  // Athlete nfts can only be bought during season
  function buyAthleteNft(uint256 _id) public requireSeasonStateEither(2, 2) requireActiveAthleteNft(_id) {
    require(price[_id] > 0, "Freeda Athlete NFT: This NFT has not been configured yet");
    require(mintCount[_id] < maxSupply[_id], "Freeda Athlete NFT: This NFT is at its supply cap");
    require(balanceOf(msg.sender, _id) == 0, "Freeda Athlete NFT: Cannot buy NFT when one is present in wallet");
    require(purchaseTokenContract.transferFrom(msg.sender, address(this), price[_id]) == true, "Freeda Athlete NFT: Failed to transfer ERC-20 tokens for purchase");

    _mint(msg.sender, _id, 1, "");
    mintCount[_id] += 1;
    emit athleteNftBought(msg.sender, _id);
  }

  // Athlete nfts can be sold during season and during buy-back period
  function sellAthleteNft(uint256 _id) public requireSeasonStateEither(1, 2) requireActiveAthleteNft(_id) {
    require(balanceOf(msg.sender, _id) > 0, "Freeda Athlete NFT: No Athlete NFT in account to sell");

    purchaseTokenContract.transfer(msg.sender, price[_id]);
    _burn(msg.sender, _id, 1);
    mintCount[_id] -= 1;
    emit athleteNftSold(msg.sender, _id);
  }


  // Contract Meta Read Functions
  function getWhitelistLevel(address who) public view returns (uint256) {
    return _whitelist[who];
  }

  function getCurrentSeasonIdRange() public view returns (uint256, uint256) {
    return (currentSeasonIdRangeStart, currentSeasonIdRangeEnd);
  }

  function getPurchaseTokenAddress() public view returns (address) {
    return address(purchaseTokenContract);
  }


  // Contract Meta Write Functions
  function setWhitelistLevel(address who, uint256 level) public ownerOnly {
    _whitelist[who] = level;
  }

  function setCurrentSeasonIdRange(uint256 start, uint256 end) public requireWhitelistLevel(1) {
    currentSeasonIdRangeStart = start;
    currentSeasonIdRangeEnd = end;
  }

  function configureAthleteNft(uint256 _id, uint256 _price, uint256 _maxSupply) public requireWhitelistLevel(1) {
    price[_id] = _price;
    maxSupply[_id] = _maxSupply;
  }

  function setSeasonState(uint8 _state) public requireWhitelistLevel(1) {
    seasonState = _state;
  }

  function setPurchaseTokenAddress(address _address) public requireWhitelistLevel(1) {
    purchaseTokenContract = IERC20(_address);
  }


  // Hooks
  function _beforeTokenTransfer(
      address /*operator*/,
      address from,
      address to,
      uint256[] memory /*ids*/,
      uint256[] memory /*amounts*/,
      bytes memory /*data*/) internal view override {
    // mints come from the zero address
    if (from != address(0) && to != address(0)) {
      require(seasonState != 2, "Freeda Athlete NFT: Season is active and transfers are not allowed");
    }
  }
}
