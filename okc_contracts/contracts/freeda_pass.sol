// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FreedaPass is ERC721 {
  IERC20 private purchaseTokenContract;
  uint256 public passCounter;
  uint256 public price;
  address public owner;

  constructor(address purchaseTokenAddress, uint256 _price) ERC721("Testnet Freeda Pass", "TFP") {
    purchaseTokenContract = IERC20(purchaseTokenAddress);
    price = _price;
    owner = msg.sender;
  }

  modifier ownerOnly() {
    require(msg.sender == owner, "Freeda Pass: Caller is not owner");
    _;
  }

  function mintConsecutivePass() public {
    require(balanceOf(msg.sender) == 0, "Freeda Pass: Cannot buy Freeda Pass if already present in wallet");
    require(purchaseTokenContract.transferFrom(msg.sender, address(this), price) == true, "Freeda Pass: Failed to transfer ERC-20 tokens for purchase");
    _mint(msg.sender, passCounter);
    passCounter += 1;
  }

  function getPurchaseTokenAddress() public view returns (address) {
    return address(purchaseTokenContract);
  }

  function setPurchaseTokenAddress(address _address) public ownerOnly {
    purchaseTokenContract = IERC20(_address);
  }

  function setPrice(uint256 newPrice) public ownerOnly {
    price = newPrice;
  }
}
