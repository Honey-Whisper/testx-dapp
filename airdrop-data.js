// airdrop-data.js
async function loadAirdropData() {
  if (!window.airdropContract || !window.getUserAddress) return;

  const contract = window.airdropContract();
  const user = window.getUserAddress();

  try {
    // Pool balance
    const tokenContract = new ethers.Contract(
      window.ROX_TOKEN_ADDRESS || "0x228C276d885d254B464B69Dcfbc75Dd96f8a2491",
      ["function balanceOf(address) view returns (uint256)"],
      contract.provider
    );
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

    // Leaderboard
    await updateAirdropLeaderboard();

  } catch (err) {
    console.error("Airdrop data load error:", err);
    document.getElementById("airdropLeaderboard").innerHTML = "<p style='color:red;'>Data load failed – check console</p>";
  }
}

async function updateAirdropLeaderboard() {
  const leaderboardDiv = document.getElementById("airdropLeaderboard");
  leaderboardDiv.innerHTML = "<p style='text-align:center; color:#aaa;'>Loading leaderboard...</p>";

  try {
    const contract = window.airdropContract();

    // SAFETY: getAllParticipants call ko try-catch mein
    let allParticipants;
    try {
      allParticipants = await contract.getAllParticipants();
    } catch (getErr) {
      throw new Error("Failed to get participants – contract not ready or wrong chain?");
    }

    // EXTRA SAFETY: Check if array
    if (!allParticipants || !Array.isArray(allParticipants) || allParticipants.length === 0) {
      leaderboardDiv.innerHTML = "<p>No participants yet or data not available</p>";
      return;
    }

    const data = [];
    for (let addr of allParticipants) {
      const xp = await contract.xpOf(addr);
      data.push({ addr, xp });
    }

    // Safe sort
    data.sort((a, b) => {
      if (b.xp.gt(a.xp)) return -1;
      if (a.xp.gt(b.xp)) return 1;
      return 0;
    });

    let html = "";
    data.slice(0, 50).forEach((entry, i) => {
      const rank = i + 1;
      const xpNum = Number(ethers.utils.formatUnits(entry.xp, 18)).toFixed(0);
      const shortAddr = `\( {entry.addr.substr(0, 8)}... \){entry.addr.substr(-6)}`;

      if (entry.addr.toLowerCase() === window.getUserAddress()?.toLowerCase()) {
        document.getElementById("userAirdropRank").innerText = rank;
      }

      html += `<p><strong>#${rank}</strong> ${shortAddr} — ${xpNum} XP</p>`;
    });

    leaderboardDiv.innerHTML = html || "<p>No data</p>";
  } catch (err) {
    leaderboardDiv.innerHTML = "<p style='color:red;'>Leaderboard error – wrong chain or contract not deployed yet</p>";
    console.error("Leaderboard error:", err);
  }
}

window.loadAirdropData = loadAirdropData;
window.updateAirdropLeaderboard = updateAirdropLeaderboard;