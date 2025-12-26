// airdrop-tasks.js
document.getElementById("dailyCheckinBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().dailyCheckin();
    await tx.wait();
    alert("Daily check-in successful! +5 XP");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("weeklyBonusBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimWeeklyBonus();
    await tx.wait();
    alert("Weekly bonus claimed! +30 XP");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("monthlyBonusBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimMonthlyBonus();
    await tx.wait();
    alert("Monthly bonus claimed! +80 XP");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("holderBonusBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimHolderBonus();
    await tx.wait();
    alert("Holder bonus claimed!");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("nftBonusBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimNFTBonus();
    await tx.wait();
    alert("NFT bonus claimed! +500 XP");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("campaignBonusBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimCampaignBonus();
    await tx.wait();
    alert("Campaign bonus claimed! +100 XP");
    loadAirdropData();
  } catch (err) {
    alert("Failed: " + (err.reason || err.message));
  }
});

document.getElementById("claimAirdropBtn")?.addEventListener("click", async () => {
  try {
    const tx = await window.airdropContract().claimAirdrop();
    await tx.wait();
    alert("Airdrop claimed! 60% received.");
    loadAirdropData();
  } catch (err) {
    alert("Claim failed: " + (err.reason || err.message));
  }
});

document.getElementById("refreshLeaderboardBtn")?.addEventListener("click", updateAirdropLeaderboard);