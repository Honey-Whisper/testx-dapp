// airdrop-tasks.js
function safeTask(handler) {
  return async () => {
    if (!window.airdropContract || !window.getUserAddress) {
      alert("Wallet connect kar pehle bhai!");
      return;
    }

    try {
      const tx = await handler();
      await tx.wait();
      alert("Success! 🎉");
      loadAirdropData();
    } catch (err) {
      const msg = err.reason || err.message || "Transaction failed";
      alert("Failed: " + msg.split("(")[0]); // clean message
      console.error(err);
    }
  };
}

// All tasks safe banaye
document.getElementById("dailyCheckinBtn")?.addEventListener("click", safeTask(() => window.airdropContract().dailyCheckin()));
document.getElementById("weeklyBonusBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimWeeklyBonus()));
document.getElementById("monthlyBonusBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimMonthlyBonus()));
document.getElementById("holderBonusBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimHolderBonus()));
document.getElementById("nftBonusBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimNFTBonus()));
document.getElementById("campaignBonusBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimCampaignBonus()));
document.getElementById("claimAirdropBtn")?.addEventListener("click", safeTask(() => window.airdropContract().claimAirdrop()));

document.getElementById("refreshLeaderboardBtn")?.addEventListener("click", () => {
  if (typeof updateAirdropLeaderboard === "function") {
    updateAirdropLeaderboard();
  }
});