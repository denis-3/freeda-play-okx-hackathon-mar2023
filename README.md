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

to deploy all three contracts to the testnet. This command also configures 3 athlete NFTs with ids `0`, `1`, and `42`. If you'd like to interact with the contracts manually in the console, run

`truffle console --network okctestnet`.
The `AthleteNft`, `FreedaPass`, and `DummyErc20` global variables will be present to represent the deployed contracts.

The addresses of the deployed contracts on the testnet are:
* Athlete NFT: `0xb479E4bcD1c45245997c83887c75B89f642436d8`
* Freeda Pass: `0x00cA3FeC394D8472A25B2e7358823ECC1946Bf01`
* ERC-20 Token: `0xBcB82aa4f0931D4cec6dB412c5d8740843489AbA`

## Webserver

This project also comes with a webserver to interact with the deployed contracts. The webserver is automatically configured to point to the above testnet contract addresses.

### Features

* Simple UI and UX
* Includes all contract methods that users would interact with (i.e. buy/sell athlete NFT, buy Freeda Pass)
* Easy deployment

### Deploying the Webserver

Make sure to `cd` into the `webserver` folder, and install the required libraries:

```
$ npm install parcel --save-dev
$ npm install @uauth/js --save
```

Then, start the `parcel` webserver:

`npx parcel index.html -p 80`.

Go to [`http://localhost`](http://localhost) to interact with the webserver. You should also install [OKX Wallet](https://www.okx.com/web3) for your browser to interact with the smart contract.

We have deployed an instance of this webserver to a DigitalOcean droplet at [`http://143.244.153.222/`](http://143.244.153.222/).
