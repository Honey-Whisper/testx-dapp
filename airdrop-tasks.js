if (window.signer) {
    const airdrop = window.airdropContract();
    const userBtnIds = {
        dailyCheckinBtn: "dailyCheckin",
        weeklyBonusBtn: "claimWeeklyBonus",
        monthlyBonusBtn: "claimMonthlyBonus",
        holderBonusBtn: "claimHolderBonus",
        nftBonusBtn: "claimNFTBonus",
        campaignBonusBtn: "claimCampaignBonus",
        claimAirdropBtn: "claimAirdrop"
    };

    // Attach click events for all task buttons
    Object.keys(userBtnIds).forEach(btnId => {
        const funcName = userBtnIds[btnId];
        document.getElementById(btnId).addEventListener("click", async () => {
            try {
                const tx = await airdrop[funcName]();
                await tx.wait();
                loadAirdropData(); // refresh XP & eligibility after completion
            } catch (err) {
                console.error("Airdrop Task Error:", err);
                alert("Transaction failed or rejected");
            }
        });
    });
}

// --------------------------
// Sybil-proof Eligibility
// --------------------------
async function updateEligibility() {
    if (!window.signer) return;

    const airdrop = window.airdropContract();
    const user = await window.signer.getAddress();

    // NFT Task
    const nftDone = await airdrop.xpOf(user) >= 500; // NFT task gives 500 XP
    document.getElementById("nftTaskStatus").innerHTML = `NFT Task: <span style="color:${nftDone ? '#00FF00' : '#FF0000'};">${nftDone ? 'Completed' : 'Pending'}</span>`;

    // Price Prediction Campaign Task
    const campaignDone = await airdrop.isEligible(user); // checks if campaign task done
    document.getElementById("campaignTaskStatus").innerHTML = `Price Prediction Campaign: <span style="color:${campaignDone ? '#00FF00' : '#FF0000'};">${campaignDone ? 'Completed' : 'Pending'}</span>`;

    // Overall Eligibility
    document.getElementById("airdropEligible").innerText = (nftDone && campaignDone) ? '✅ Eligible for Airdrop!' : '❌ Not eligible yet';

    // Optionally enable claim button only if eligible
    document.getElementById("claimAirdropBtn").disabled = !(nftDone && campaignDone);
}

// Attach refresh button
document.getElementById("refreshEligibilityBtn").addEventListener("click", updateEligibility);

// Auto load data on wallet connect
window.addEventListener("walletConnected", () => {
    loadAirdropData();
});