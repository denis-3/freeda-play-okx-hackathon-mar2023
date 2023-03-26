const athleteNFT = artifacts.require("AthleteNft")
const erc20 = artifacts.require("DummyErc20")
const fpass = artifacts.require("FreedaPass")

module.exports = async function (deployer) {
  await deployer.deploy(erc20)
  const erc20Deployment = await erc20.deployed()

  const athleteNftDeployment = await deployer.deploy(athleteNFT,
    2, // init season state
    0, // current season id start range
    100, // current season id end range
    erc20Deployment.address
  );

  await deployer.deploy(fpass,
    erc20Deployment.address,
    BigInt(5*10**18) // default Pass price
  )

  await athleteNftDeployment.configureAthleteNft(42, BigInt(1 * 10**18), 1000)
};
