// ROX Token
window.roxTokenContract = () => {
  if (!window.signer) return null;
  return new ethers.Contract(
    window.ROX_TOKEN_ADDRESS,
    window.ROX_ABI,
    window.signer
  );
};

// Airdrop
window.airdropContract = () => {
  if (!window.signer) return null;
  return new ethers.Contract(
    window.AIRDROP_CONTRACT_ADDRESS,
    window.AIRDROP_ABI,
    window.signer
  );
};

// Campaign / Price Prediction
window.campaignContract = () => {
  if (!window.signer) return null;
  return new ethers.Contract(
    window.CAMPAIGN_CONTRACT_ADDRESS,
    window.CAMPAIGN_ABI,
    window.signer
  );
};

// Presale / Auto-Stake
window.presaleContract = () => {
  if (!window.signer) return null;
  return new ethers.Contract(
    window.PRESALE_CONTRACT_ADDRESS,
    window.PRESALE_ABI,
    window.signer
  );
};