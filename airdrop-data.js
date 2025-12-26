// Ensure signer exists
async function loadAirdropData() {
    if (!window.signer) return;

    const airdrop = window.airdropContract();
    const user = await window.signer.getAddress();

    // Load airdrop pool balance
    const poolBalance = await window.ROX_ABI.balanceOf(window.AIRDROP_CONTRACT_ADDRESS);
    document.getElementById("airdropPoolBalance").innerText = ethers.utils.formatUnits(poolBalance, 18);

    // Load participants
    const participants = await airdrop.getAllParticipants();
    document.getElementById("airdropParticipants").innerText = participants.length;

    if (participants.length >= 1500) {
        document.getElementById("airdropFull").style.display = "inline";
    } else {
        document.getElementById("airdropFull").style.display = "none";
    }

    // Load user XP
    const userXP = await airdrop.xpOf(user);
    document.getElementById("userAirdropXP").innerText = userXP;

    // Load eligibility
    updateEligibility();
}