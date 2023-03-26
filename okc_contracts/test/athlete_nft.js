const _athleteNft = artifacts.require("AthleteNft")
const _erc20 = artifacts.require("DummyErc20")
const decimals_18 = "1000000000000000000"

contract("Freeda Play Athlete NFT", (accounts) => {
  it("Update season to be active", async () => {
    const athleteNft = await _athleteNft.deployed()

    // set season to 2 (active)
    await athleteNft.setSeasonState(2)
    const newSeasonState = await athleteNft.seasonState()
    assert.equal(newSeasonState, 2, "Season state should be 2 (active)")
  })

  it("Configure Athlete NFT", async () => {
    const athleteNft = await _athleteNft.deployed()

    await athleteNft.configureAthleteNft(0, decimals_18, 1)
  })

  it("Purchase Athlete NFT", async () => {
    const athleteNft = await _athleteNft.deployed()
    const erc20 = await _erc20.deployed()

    const purchasePrice = await athleteNft.price(0)
    await erc20.approve(athleteNft.address, purchasePrice)

    await athleteNft.buyAthleteNft(0)
    const nftBalance = await athleteNft.balanceOf(accounts[0], 0)
    assert.equal(nftBalance, 1, "Account should have 1 NFT after purchase")

    const erc20Balance = await erc20.balanceOf(accounts[0])
    assert.equal(BigInt(erc20Balance), BigInt(0), "Account should have 0 erc20 token after purchase")
  })

  it("Sell Athlete NFT", async () => {
    const athleteNft = await _athleteNft.deployed()
    const erc20 = await _erc20.deployed()

    const prevBalance = await erc20.balanceOf(accounts[0])

    await athleteNft.sellAthleteNft(0)
    const nftBalance = await athleteNft.balanceOf(accounts[0], 0)
    assert.equal(nftBalance, 0, "Account should have 0 NFTs after sell")

    const newBalance = await erc20.balanceOf(accounts[0])
    const balanceDif = BigInt(newBalance) - BigInt(prevBalance)

    assert.ok(balanceDif == BigInt(decimals_18), "Account did not receive erc20 token back after sell")
  })

  it("Turn off the season", async () => {
    const athleteNft = await _athleteNft.deployed()

    // this should fail since NFT transfers are not allowed during season
    const transferSuccess = await athleteNft.safeTransferFrom(accounts[0], accounts[1])
      .then(() => true)
      .catch(() => false)
    assert.equal(transferSuccess, false, "Transfer should fail during active season")

    await athleteNft.setSeasonState(0)

    const newSeasonState = await athleteNft.seasonState()

    assert.equal(newSeasonState, 0, "Season state should be 0 (off)")
  })
})
