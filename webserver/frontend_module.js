import UAuth from '@uauth/js'

const uauth = new UAuth({
  clientID: "18cc770a-bd23-4454-aca6-0f145d881f0d",
  redirectUri: "http://localhost",
  scope: "openid wallet email profile:optional social:optional"
})

var okxw = window.okxwallet

var mainAccountHtml,
  domainHtml,
  mainAccount,
  domain,
  web3,
  athleteNftContract,
  dummyErc20Contract,
  freedaPassContract,
  loginProvider // can be "u" for Unstoppable, or "o" for OKX Wallet


console.log("Hello, there! Please see this project's GitHub page at https://github.com/denis-levine/freeda-play-okx-hackathon-mar2023")


function insertCharacterFromEnd(str, char, positionFromEnd) {
  if (positionFromEnd < 0 || positionFromEnd > str.length) {
    // Invalid position; soft error and return original string
    return str
  }
  const positionFromStart = str.length - positionFromEnd;
  return str.slice(0, positionFromStart) + char + str.slice(positionFromStart);
}

async function createTransactionFromInteraction(contractMethod, fromAddress, contractAddress) {
  const encodedData = contractMethod.encodeABI();
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await contractMethod.estimateGas({ from: fromAddress });
  const tx = {
    from: fromAddress,
    to: contractAddress,
    nonce: "0x0", // Ignored by OKX Wallet
    gasPrice: `0x${gasPrice.toString(16)}`,
    gas: `0x${gasLimit.toString(16)}`,
    data: encodedData
  };
  return tx;
}

function fillArrayWithConsecutiveNumbers(length) {
  let arr = new Array(length);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = i;
  }

  return arr;
}

async function showProfileTab(tab) {
  if (tab == "prediction") {
    const passBalance = await freedaPassContract.methods.balanceOf(mainAccount).call()
    if (passBalance == 0) {
      return alert("You need a Freeda Pass to participate in prediction game! Buy one at the marketplace.")
    }
  }

  document.getElementById("profile-section-wallet").style.display = tab == "wallet" ? "" : "none"
  document.getElementById("profile-tab-wallet").className = tab == "wallet" ? "profile-side-nav-tab-active" : "profile-side-nav-tab-inactive"

  document.getElementById("profile-section-marketplace").style.display = tab == "marketplace" ? "" : "none"
  document.getElementById("profile-tab-marketplace").className = tab == "marketplace" ? "profile-side-nav-tab-active" : "profile-side-nav-tab-inactive"

  document.getElementById("profile-section-prediction").style.display = tab == "prediction" ? "" : "none"
  document.getElementById("profile-tab-prediction").className = tab == "prediction" ? "profile-side-nav-tab-active" : "profile-side-nav-tab-inactive"

  document.getElementById("profile-main-header").textContent = (function() {
    'use strict';
    if (tab == "wallet") {
      return "Your Wallet";
    } else if (tab == "marketplace") {
      return "Marketplace"
    } else if (tab == "prediction") {
      return "Prediction Game"
    }
  }());
}

// TODO: Add method here that takes in a smart contract interaction then returns a TX object
// with estimated gas, the data (encodeAbi), and to (contract address) fields

const ATHLETE_NFT_CONTRACT_ADDRESS = "0xb479E4bcD1c45245997c83887c75B89f642436d8"
const DUMMY_ERC20_CONTRACT_ADDRESS = "0xBcB82aa4f0931D4cec6dB412c5d8740843489AbA"
const FREEDA_PASS_CONTRACT_ADDRESS = "0x00cA3FeC394D8472A25B2e7358823ECC1946Bf01"


window.initFreedaPlayModule = () => {
  const FREEDA_PLAY_ABI = require("./freeda_play_abi.json");
  const ERC20_ABI = require("./dummy_erc20_abi.json");
  const FREEDA_PASS_ABI = require("./freeda_pass_abi.json")
  web3 = new Web3("https://exchaintestrpc.okex.org/")
  athleteNftContract = new web3.eth.Contract(FREEDA_PLAY_ABI, ATHLETE_NFT_CONTRACT_ADDRESS)
  dummyErc20Contract = new web3.eth.Contract(ERC20_ABI, DUMMY_ERC20_CONTRACT_ADDRESS)
  freedaPassContract = new web3.eth.Contract(FREEDA_PASS_ABI, FREEDA_PASS_CONTRACT_ADDRESS)

  mainAccountHtml = document.getElementById("hidden-main-account")
  domainHtml = document.getElementById("hidden-domain")
  mainAccount = null
  domain = null
}

window.renderProfile = async () => {
  // If user doesn't have OKX wallet installed, fall back to window.ethereum
  if (!window.okxwallet) {
    okxw = window.ethereum
  }
  // re-request accounts to make sure that the user's Unstoppable Domains account matches their wallet account
  const accounts = await okxw.request({ method: 'eth_requestAccounts' });
  if (accounts[0].toLowerCase() !== mainAccount.toLowerCase() && loginProvider == "u") {
    alert(`Your Unstoppable Domains Ethereum wallet does not match that from your wallet provider.
Make sure that the wallet address that owns ${domain} is selected in your Web3 wallet extension (e.g. MetaMask, OKX Wallet).`)
    window.location.reload()
  }
  document.body.style.background = "#F5F5F5"
  document.getElementById("login-div").style.display = "none"
  document.getElementById("profile-div").style.display = ""
  const sideNavWidth = document.getElementById("profile-side-nav").clientWidth
  document.getElementById("profile-div").style.paddingLeft = sideNavWidth + 80 + "px"
  document.getElementById("profile-div").style.width = `calc(100vw - ${sideNavWidth+80}px)`
  const greyRect = document.getElementById("background-grey-rect")
  greyRect.style.left = sideNavWidth + "px"
  greyRect.style.width = `calc(100% - ${sideNavWidth}px)`
  document.getElementById("profile-name-display").textContent = domain ? domain : mainAccount.substring(0,12) + "..."

  web3.eth.defaultAccount = mainAccount

  const erc20Balance = await dummyErc20Contract.methods.balanceOf(mainAccount).call()
  const erc20Decimals = await dummyErc20Contract.methods.decimals().call()
  document.getElementById("dummy-erc20-balance-display").textContent = Math.round(
    Number(insertCharacterFromEnd(erc20Balance, ".", erc20Decimals)) * 10**3
  ) / 10**3

  const oktBalance = await web3.eth.getBalance(mainAccount)
  // OKT has 18 decimals
  document.getElementById("okc-token-display").textContent = Math.round(
    Number(insertCharacterFromEnd(oktBalance, ".", 18)) * 10**3
  ) / 10**3

  document.getElementById("loading-indicator").style.display = "none"

  const seasonIdRange = await athleteNftContract.methods.getCurrentSeasonIdRange().call()
  const addrArr = new Array(Number(seasonIdRange[1]) + 1)
  addrArr.fill(mainAccount)
  const idsArr = fillArrayWithConsecutiveNumbers(Number(seasonIdRange[1]) + 1)
  const balances = await athleteNftContract.methods.balanceOfBatch(addrArr, idsArr).call()
  balances.forEach((item, i) => {
    if (Number(item) > 0) {
      const div = document.createElement("div")
      const img = document.createElement("img")
      const p = document.createElement("p")
      div.className = "profile-nft-card"
      img.src = document.getElementById(`athlete-nft-${i}`).src
      p.innerHTML = document.getElementById(`athlete-nft-${i}`).getAttribute("data-athlete-text")
      div.onclick = async () => {
        // sell the NFT
        const params = await createTransactionFromInteraction(
          athleteNftContract.methods.sellAthleteNft(i),
          mainAccount,
          ATHLETE_NFT_CONTRACT_ADDRESS
        )
        const txHash = await okxw.request({
          method: "eth_sendTransaction",
          params: [params]
        })
        console.log(txHash)
      }
      div.appendChild(img)
      div.appendChild(p)
      document.getElementsByClassName("profile-nft-display")[0].appendChild(div)
    }
  });

  const passBalance = await freedaPassContract.methods.balanceOf(mainAccount).call()
  if (passBalance > 0) {
    const div = document.createElement("div")
    const img = document.createElement("img")
    const p = document.createElement("p")
    div.id = "profile-freeda-pass-card"
    div.className = "profile-nft-card"
    img.src = document.getElementById(`freeda-pass-nft`).src
    p.innerHTML = document.getElementById(`freeda-pass-nft`).getAttribute("data-nft-text")
    div.appendChild(img)
    div.appendChild(p)
    document.getElementsByClassName("profile-nft-display")[1].appendChild(div)
  }

  document.getElementById("buy-freeda-pass").onclick = async () => {
    const allowance = await dummyErc20Contract.methods.allowance(mainAccount, FREEDA_PASS_CONTRACT_ADDRESS).call()
    const passPrice = await freedaPassContract.methods.price().call()
    // if user hasn't allowed Pass contract to spend tokens, set up allowance
    if (BigInt(passPrice) > BigInt(allowance)) {
      const params = await createTransactionFromInteraction(
        dummyErc20Contract.methods.approve(FREEDA_PASS_CONTRACT_ADDRESS, BigInt(9999 * 10**18)),
        mainAccount,
        DUMMY_ERC20_CONTRACT_ADDRESS
      )
      await okxw.request({
        method: "eth_sendTransaction",
        params: [params]
      })
      return alert("Please wait for allowance tx to confirm, then buy Freeda Pass.")
    }

    // finally, buy the NFT
    const params2 = await createTransactionFromInteraction(
      freedaPassContract.methods.mintConsecutivePass(),
      mainAccount,
      FREEDA_PASS_CONTRACT_ADDRESS
    )
    .catch((e) => {console.error(e); return null;})
    if (params2 === null) return alert(`There was a problem with the transaction (check the console).
You probably already have a Freeda Pass and are trying to obtain another one.`)
    const txHash = await okxw.request({
      method: "eth_sendTransaction",
      params: [params2]
    })
    console.log(txHash)
  }

  document.getElementById("get-erc20-token").onclick = async () => {
    // mint some ERC-20 tokens
    const params = await createTransactionFromInteraction(
      dummyErc20Contract.methods.freeMintToSender(BigInt(100 * 10**18)),
      mainAccount,
      DUMMY_ERC20_CONTRACT_ADDRESS
    )
    const txHash = await okxw.request({
      method: "eth_sendTransaction",
      params: [params]
    })
    console.log(txHash)
  }

  document.getElementById("profile-tab-wallet").onclick = () => {
    showProfileTab("wallet")
  }

  document.getElementById("profile-tab-marketplace").onclick = () => {
    showProfileTab("marketplace")
  }

  const nftIds = [0, 1, 42]
  const profileNfts = [... document.getElementsByClassName("profile-nft-card")].filter(x => x.parentNode.className == "marketplace-nft-display")
  nftIds.forEach((id, i) => {
    profileNfts[i].onclick = async () => {
      const allowance = await dummyErc20Contract.methods.allowance(mainAccount, ATHLETE_NFT_CONTRACT_ADDRESS).call()
      const athletePrice = await athleteNftContract.methods.price(id).call()
      // if user hasn't allowed NFT contract to spend tokens, set up allowance
      if (BigInt(athletePrice) > BigInt(allowance)) {
        const params = await createTransactionFromInteraction(
          dummyErc20Contract.methods.approve(ATHLETE_NFT_CONTRACT_ADDRESS, BigInt(9999 * 10**18)),
          mainAccount,
          DUMMY_ERC20_CONTRACT_ADDRESS
        )
        await okxw.request({
          method: "eth_sendTransaction",
          params: [params]
        })
        return alert("Please wait for allowance tx to confirm, then buy Athlete NFT.")
      }

      // finally, buy the NFT
      const params2 = await createTransactionFromInteraction(
        athleteNftContract.methods.buyAthleteNft(id),
        mainAccount,
        ATHLETE_NFT_CONTRACT_ADDRESS
      )
      .catch((e) => {console.error(e); return null;})
      if (params2 === null) return alert(`There was a problem with the transaction (check the console).
  You probably already have this athlete card and are trying to obtain another one.`)
      const txHash = await okxw.request({
        method: "eth_sendTransaction",
        params: [params2]
      })
      console.log(txHash)
    }
  });

  document.getElementById("profile-tab-prediction").onclick = () => {
    showProfileTab("prediction")
  }

  // Team 1 - Team 2 - Winner Team (0, 1, or 2) - Score
  const predictionMatches = [
    ["Nashville", "New York City", 0, "2:1"],
    ["Inter Miama", "Montreal", 0, "2:0"],
    ["Philadelphia", "Columbus", 0, "4:1"],
    ["Cincinnati", "Houston Dynamo", 0, "2:1"]
  ]
  for (var i = 0; i < predictionMatches.length; i++) {
    const j = i
    function resolvePrediction(prediction) {
      document.getElementsByClassName("prediction-card-middle-text")[j].textContent = predictionMatches[j][3]
      document.getElementsByClassName("prediction-card-footer")[j].textContent = `Your prediction was ${
        prediction == 2 ? "tie" :predictionMatches[j][prediction]}`
      document.getElementsByClassName("prediction-card-footer")[j].style.color = "black"
      document.getElementsByClassName("tie-predict-button")[j].style.display = "none"

      const span = document.createElement("span")
      span.style.borderRadius = "18px"
      span.style.outlineWidth = "11px"
      span.style.outlineStyle = "solid"
      span.style.marginRight = "30px"

      // correct prediction
      if (prediction == predictionMatches[j][2]) {
        span.textContent = "You won"
        span.style.color = "#00D315"
        span.style.outlineColor = "rgba(0, 211, 21, 0.15)"
        document.getElementsByClassName("prediction-card")[j].style.background = "rgba(0, 211, 21, 0.1)"
        document.getElementsByClassName("prediction-card")[j].style.borderColor = "#00D315"
      } else { // incorrect prediction
        span.textContent = "You lost"
        span.style.color = "#FB3434"
        span.style.outlineColor = "rgba(251, 52, 52, 0.1)"
        document.getElementsByClassName("prediction-card")[j].style.background = "rgba(251, 52, 52, 0.1)"
        document.getElementsByClassName("prediction-card")[j].style.borderColor = "#FB3434"
      }
      span.style.background = span.style.outlineColor
      const p = document.createElement("p")
      const span2 = document.createElement("span")
      span2.textContent = span.textContent == "You won" ? "+3 Points" : "-1 Points"
      span2.style.color = span.style.color
      p.append(span, span2)
      document.getElementsByClassName("prediction-card")[j].childNodes[1].appendChild(p)
    }
    document.getElementsByClassName("team-predict-button")[j*2].onclick = () => {
      if (confirm(`Are you sure you want to predict: ${predictionMatches[j][0]} win?`)) {
        resolvePrediction(0)
      }
    }
    document.getElementsByClassName("team-predict-button")[j*2+1].onclick = () => {
      if (confirm(`Are you sure you want to predict: ${predictionMatches[j][1]} win?`)) {
        resolvePrediction(1)
      }
    }
    document.getElementsByClassName("tie-predict-button")[j].onclick = () => {
      if (confirm(`Are you sure you want to predict: tie?`)) {
        resolvePrediction(2)
      }
    }
  }
}

window.continueLogin = () => {
  // The email cookie isn't present; prompt user for email
  // In realistic scenarios, we would save this email to a database somewhere
  // For this testing scenario, we can just save to a cookie to indicate that the user has entered his email address
  if (!document.cookie.includes("email") && !document.cookie.includes("newsletter")){
    document.getElementById("login-main-action").style.display = "none"
    document.getElementById("login-enter-email").style.display = ""
    document.getElementById("sign-in-button").onclick = () => {
      const email = document.getElementById("email-input").value.trim()
      const newsletter = String(document.getElementById("newsletter-checkbox").checked).trim()
      if (email.length == 0) return
      document.cookie = `email=${email}; SameSite=strict`
      document.cookie = `newsletter=${newsletter}; SameSite=strict`
      window.renderProfile()
    }
  } else {
    window.renderProfile()
  }
}

window.loginWithUnstoppable = async () => {
  // Login with Unstoppable Domains does not work with the external droplet since it is not https (which is required by Unstoppable)
  if (!window.location.href.startsWith("http://localhost/")) {
    return alert("Unfortunatley, login with Unstoppable Domains does not work on the droplet. Please see this project's GitHub page to deploy your own webserver and enable login with Unstoppable Domains.")
  }
  try {
    const authorization = await uauth.loginWithPopup()
    mainAccount = authorization.idToken.wallet_address
    mainAccountHtml.textContent = mainAccount
    domain = authorization.idToken.name
    domainHtml.textContent = domain
    console.log(`Loggined in with Unstoppable\nWallet Address: ${mainAccount}\nDomain: ${domain}`)
    loginProvider = "u"
    window.continueLogin()
  } catch (error) {
    console.error(error)
  }
}

window.logout = async () => {
  try {
    await uauth.logout()
  } catch(e) {}
  finally {
    // Reloading the window will reset login
    window.location.reload()
  }
}

window.loginWithOkxWallet = async () => {
  if (!okxw) {
    return alert("OKX Wallet is not installed or not present")
  }
  const accounts = await okxw.request({ method: 'eth_requestAccounts' });
  try {
    await okxwallet.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x41' }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to OKX.
    if (switchError.code === 4902) {
      await okxwallet.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x41',
            chainName: 'OKX Chain Testnet',
            rpcUrls: ["https://exchaintestrpc.okex.org/"],
          },
        ],
      });
      throw Error("Try connecting with your Ethereum wallet again!")
    }
  }
  mainAccount = accounts[0]
  mainAccountHtml.textContent = mainAccount
  domainHtml.textContent = "null"
  loginProvider = "o"
  console.log(`Loggined in with OKX Wallet\nWallet Address: ${mainAccount}\nDomain: ${domain}`)
  window.continueLogin()
}
