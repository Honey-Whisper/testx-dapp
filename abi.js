// =====================================
// abi.js — FINAL (NO ABI CONFLICT)
// =====================================

// -------------------------------------
// 1️⃣ ROX TOKEN ABI (ERC20)
// -------------------------------------
window.ROX_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address) returns (bool)"
];

// -------------------------------------
// 2️⃣ AIRDROP ABI
// -------------------------------------
window.AIRDROP_ABI = [
  "function totalParticipants() view returns (uint256)",
  "function getAllParticipants() view returns (address[])",
  "function xpOf(address) view returns (uint256)",
  "function isEligible(address) view returns (bool)",

  "function dailyCheckin()",
  "function claimWeeklyBonus()",
  "function claimMonthlyBonus()",
  "function claimHolderBonus()",
  "function claimNFTBonus()",
  "function claimCampaignBonus()",
  "function claimAirdrop()"
];

// -------------------------------------
// 3️⃣ PRICE PREDICTION / CAMPAIGN ABI
// -------------------------------------
window.CAMPAIGN_ABI = [
  "function MIN_PRICE() view returns (uint256)",
  "function MAX_PRICE() view returns (uint256)",
  "function actualPrice() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function owner() view returns (address)",
  "function roxToken() view returns (address)",

  "function predictions(uint256) view returns (address user,uint256 predictedPrice,string message,uint256 timestamp)",
  "function rewards(uint256) view returns (uint256)",
  "function winners(uint256) view returns (address)",

  "function predict(uint256,string)",
  "function claim(uint256)",
  "function resolve(uint256)",
  "function withdrawTokens(uint256)",
  "function transferOwnership(address)",
  "function renounceOwnership()"
];

// -------------------------------------
// 4️⃣ PRESALE / AUTO-STAKE ABI
// -------------------------------------
window.PRESALE_ABI = [
  "function autoStake(address user,uint256 amount)",
  "function transfer(address to,uint256 amount) returns (bool)"
];

// -------------------------------------
// 📌 CONTRACT ADDRESSES (FINAL)
// -------------------------------------
window.ROX_TOKEN_ADDRESS        = "0x228C276d885d254B464B69Dcfbc75Dd96f8a2491";
window.AIRDROP_CONTRACT_ADDRESS = "0x3Cf099E1237272e6cD6591Bd6460367A5D074683";
window.PRESALE_CONTRACT_ADDRESS = "0x5506bb214e69a1c5184d91a6e2E7972B83304D2B";
window.CAMPAIGN_CONTRACT_ADDRESS= "0xB2637F913734304211FCC88bE876e9097C5b818A";