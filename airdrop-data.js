// airdrop-data.js
async function loadAirdropData() {
  if (!window.airdropContract || !window.getUserAddress) {
    console.log("Wallet not connected yet");
    return;
  }

  const contract = window.airdropContract();
  const user = window.getUserAddress();

  try {
    // Pool balance - safe call
    let poolBalance = "0";
    try {
      const tokenContract = new ethers.Contract(
        window.ROX_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
        ["function balanceOf(address) view returns (uint256)"],
        contract.provider
      );
      poolBalance = await tokenContract.balanceOf(window.AIRDROP_CONTRACT_ADDRESS || "0x0");
      document.getElementById("airdropPoolBalance").innerText = ethers.utils.formatEther(poolBalance);
    } catch (e) {
      document.getElementById("airdropPoolBalance").innerText = "N/A";
      console.log("Pool balance failed (token/contract not ready)", e.message);
    }

    // Participants
    let participants = "0";
    try {
      participants = await contract.totalParticipants();
      document.getElementById("airdropParticipants").innerText = participants.toString();
      if (participants.gte(1500)) {
        document.getElementById("airdropFull")?.style = "display: inline";
      }
    } catch (e) {
      document.getElementById("airdropParticipants").innerText = "N/A";
    }

    // User XP
    try {
      const xp = await contract.xpOf(user);
      document.getElementById("userAirdropXP").innerText = ethers.utils.formatUnits(xp, 18);
    } catch (e) {
      document.getElementById("userAirdropXP").innerText = "N/A";
    }

    // Eligibility
    try {
      const eligible = await contract.isEligible(user);
      const elText = document.getElementById("airdropEligible");
      elText.innerText = eligible ? "Yes" : "No";
      elText.style.color = eligible ? "#00FF00" : "#FF0000";
    } catch (e) {
      document.getElementById("airdropEligible").innerText = "N/A";
    }

    // Leaderboard
    await updateAirdropLeaderboard();

  } catch (err) {
    console.error("Load airdrop data error:", err);
  }
}

async function updateAirdropLeaderboard() {
  const leaderboardDiv = document.getElementById("airdropLeaderboard");
  if (!leaderboardDiv) return;

  leaderboardDiv.innerHTML = "<p style='text-align:center; color:#aaa;'>Loading leaderboard...</p>";

  try {
    const contract = window.airdropContract();

    let allParticipants = [];
    try {
      allParticipants = await contract.getAllParticipants();
    } catch (e) {
      leaderboardDiv.innerHTML = "<p style='color:#ccc;'>Contract not deployed or wrong network</p>";
      return;
    }

    if (!Array.isArray(allParticipants) || allParticipants.length === 0) {
      leaderboardDiv.innerHTML = "<p>No participants yet</p>";
      return;
    }

    const data = [];
    for (let addr of allParticipants) {
      try {
        const xp = await contract.xpOf(addr);
        data.push({ addr: addr.toLowerCase(), xp });
      } catch (e) {
        console.log("Failed to get XP for", addr);
      }
    }

    if (data.length === 0) {
      leaderboardDiv.innerHTML = "<p>XP data not available</p>";
      return;
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
      const shortAddr = entry.addr.slice(0, 8) + "..." + entry.addr.slice(-6);

      if (entry.addr === window.getUserAddress()?.toLowerCase()) {
        document.getElementById("userAirdropRank").innerText = rank;
      }

      html += `<p><strong>#${rank}</strong> ${shortAddr} — ${xpNum} XP</p>`;
    });

    leaderboardDiv.innerHTML = html;
  } catch (err) {
    leaderboardDiv.innerHTML = "<p style='color:#ccc;'>Leaderboard unavailable – contract not ready</p>";
    console.error("Leaderboard error:", err);
  }
}

window.loadAirdropData = loadAirdropData;
window.updateAirdropLeaderboard = updateAirdropLeaderboard;