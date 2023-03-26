// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract is to provide a test purchase currency for Athlete NFT,
// since they are purchased with ERC-20 tokens
contract DummyErc20 is ERC20 {
  constructor() ERC20("Testing ERC20", "TST") {
    _mint(msg.sender, 999999 * 10**18);
  }

  // No need to worry about implications of this
  // In production situations, Athlete NFT contract will likely use USDC or similar as purchase token
  function freeMintToSender(uint256 amount) public {
    _mint(msg.sender, amount);
  }
}
