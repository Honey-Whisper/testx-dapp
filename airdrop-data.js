// airdrop-data.js
async function loadAirdropData() {
  if (!window.airdropContract || !window.getUserAddress) return;

  const contract = window.airdropContract();
  const user = window.getUserAddress();

  try {
    // Pool balance
    const tokenContract = new ethers.Contract(window.ROX_TOKEN_ADDRESS || "0x228C276d885d254B464B69Dcfbc75Dd96f8a2491", ["function balanceOf(address) view returns (uint256)"], contract.provider);
    const poolBalance = await tokenContract.balanceOf(window.AIRDROP_CONTRACT_ADDRESS);
    document.getElementById("airdropPoolBalance").innerText = ethers.utils.formatEther(poolBalance);

    // Participants
    const participants = await contract.totalParticipants();
    document.getElementById("airdropParticipants").innerText = participants.toString();
    if (participants.gte(1500)) {
      document.getElementById("airdropFull").style.display = "inline";
    }

    // User data
    const xp = await contract.xpOf(user);
    document.getElementById("userAirdropXP").innerText = ethers.utils.formatUnits(xp, 18);

    const eligible = await contract.isEligible(user);
    document.getElementById("airdropEligible").innerText = eligible ? "Yes" : "No";
    document.getElementById("airdropEligible").style.color = eligible ? "#00FF00" : "#FF0000";

    // Leaderboard (top 50)
    await updateAirdropLeaderboard();

  } catch (err) {
    console.error("Airdrop data load error:", err);
  }
}

async function updateAirdropLeaderboard() {
  const leaderboardDiv = document.getElementById("airdropLeaderboard");
  leaderboardDiv.innerHTML = "<p style='text-align:center; color:#aaa;'>Loading...</p>";

  try {
    const contract = window.airdropContract();
    const allParticipants = await contract.getAllParticipants();
    const data = [];

    for (let addr of allParticipants) {
      const xp = await contract.xpOf(addr);
      data.push({ addr, xp: xp });
    }

    data.sort((a, b) => b.xp.sub(a.xp));

    let html = "";
    data.slice(0, 50).forEach((entry, i) => {
      const rank = i + 1;
      const xpNum = Number(ethers.utils.formatUnits(entry.xp, 18)).toFixed(0);
      const shortAddr = entry.addr.slice(0, 8) + "..." + entry.addr.slice(-6);

      if (entry.addr.toLowerCase() === window.getUserAddress()?.toLowerCase()) {
        document.getElementById("userAirdropRank").innerText = rank;
      }

      html += `<p><strong>#${rank}</strong> ${shortAddr} — ${xpNum} XP</p>`;
    });

    leaderboardDiv.innerHTML = html || "<p>No participants yet</p>";
  } catch (err) {
    leaderboardDiv.innerHTML = "<p style='color:red;'>Error loading leaderboard</p>";
    console.error(err);
  }
}

window.loadAirdropData = loadAirdropData;
window.updateAirdropLeaderboard = updateAirdropLeaderboard;