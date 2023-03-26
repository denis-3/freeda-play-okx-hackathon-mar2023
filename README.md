# Freeda Play
Submission for the OKX Hackathon (March 2023). We are transforming fantasy sports with value-preserving athlete NFTs.
## Smart Contracts
There are three smart contracts:
1. Athlete NFT - NFTs that represent the performance of real-life athletes
2. Freeda Pass - The NFT that allows you to play the prediction game
3. ERC-20 Token - Used for purchasing the Athlete NFT and Freeda Pass (in realistic scenarios, these NFTs will be purchased with USDC)

### Features

#### Athlete NFT

* Athlete NFTs are bought with a configurable ERC-20 token
* You will get back the full amount of these tokens if you decide to sell your NFT back to the contract
* Athlete NFTs can be purchased only when the soccer season is active
* There is a buy-back period after the season where users can sell NFTs back to Freeda (but not buy)
* Each using can only hold up to one of each NFT
* Different NFTs can have different supply caps and purchase values

#### Freeda Pass

* Freeda Pass NFTs grant access to the prediction game
* These NFTs are also purchased with a configurable ERC-20 token
* Each user can only buy up to one Freeda Pass

### Running the Contracts

Clone the repository then `cd` into the `okc_contracts` folder. Install `truffle` and `@openzeppelin/contracts`:
* `npm install truffle -g`
* `npm install @openzeppelin/contracts`

The `truffle-config.js` file comes configured with the OKC Testnet. Make sure to put the deploying wallet's mnemonic in the `wallet_mnemonic.txt` file and then run:

`truffle migrate --network okctestnet`

to deploy all three contracts to the testnet. If you'd like to interact with the contracts, run

`truffle console --network okctestnet`.
The `AthleteNft`, `FreedaPass`, and `DummyErc20` global variables will be present to represent the deployed contracts.
