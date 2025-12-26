// airdrop-tasks.js

function safeTask(handler) {
  return async () => {
    if (
      typeof window.airdropContract !== "function" ||
      typeof window.getUserAddress !== "function" ||
      !window.getUserAddress()
    ) {
      alert("Pehle wallet connect karo");
      return;
    }

    try {
      const tx = await handler();
      await tx.wait();
      alert("Success 🎉");
      loadAirdropData();
    } catch (err) {
      const msg =
        err?.reason || err?.message || "Transaction failed";
      alert(msg.split("(")[0]);
      console.error(err);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("dailyCheckinBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().dailyCheckin()
      )
    );

  document
    .getElementById("weeklyBonusBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimWeeklyBonus()
      )
    );

  document
    .getElementById("monthlyBonusBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimMonthlyBonus()
      )
    );

  document
    .getElementById("holderBonusBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimHolderBonus()
      )
    );

  document
    .getElementById("nftBonusBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimNFTBonus()
      )
    );

  document
    .getElementById("campaignBonusBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimCampaignBonus()
      )
    );

  document
    .getElementById("claimAirdropBtn")
    ?.addEventListener(
      "click",
      safeTask(() =>
        window.airdropContract().claimAirdrop()
      )
    );

  document
    .getElementById("refreshLeaderboardBtn")
    ?.addEventListener("click", () => {
      if (typeof updateAirdropLeaderboard === "function") {
        updateAirdropLeaderboard();
      }
    });
});