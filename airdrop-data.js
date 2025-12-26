// airdrop-data.js (Fixed Version)

async function loadAirdropData() {
  try {
    if (
      typeof window.airdropContract !== "function" ||
      typeof window.getUserAddress !== "function" ||
      !await window.getUserAddress()
    ) {
      console.log("Wallet not connected yet");
      return;
    }

    const contract = window.airdropContract();
    const user = await window.getUserAddress();

    /* ---------------- Pool Balance (Clean) ---------------- */
    try {
      const token = new ethers.Contract(
        window.ROX_TOKEN_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        contract.provider
      );

      const bal = await token.balanceOf(window.AIRDROP_CONTRACT_ADDRESS);
      const formattedBal = parseFloat(ethers.utils.formatEther(bal)).toLocaleString(); // Clean: 100,000 (no trailing zeros)
      document.getElementById("airdropPoolBalance").innerText = formattedBal;
    } catch (e) {
      document.getElementById("airdropPoolBalance").innerText = "N/A";
    }

    /* ---------------- Participants ---------------- */
    try {
      const participants = await contract.totalParticipants();
      const pNum = Number(participants.toString());

      document.getElementById("airdropParticipants").innerText = pNum;

      if (pNum >= 1500) {
        document.getElementById("airdropFull")?.style.display = "inline";
      }
    } catch (e) {
      document.getElementById("airdropParticipants").innerText = "N/A";
    }

    /* ---------------- User XP (Clean Integer) ---------------- */
    try {
      const xp = await contract.xpOf(user);
      document.getElementById("userAirdropXP").innerText = xp.toString(); // Clean: 505 (no decimals/zeros)
    } catch (e) {
      document.getElementById("userAirdropXP").innerText = "N/A";
    }

    /* ---------------- Eligibility ---------------- */
    try {
      const eligible = await contract.isEligible(user);
      const el = document.getElementById("airdropEligible");

      el.innerText = eligible ? "Yes" : "No";
      el.style.color = eligible ? "#00FF00" : "#FF4444";
    } catch (e) {
      document.getElementById("airdropEligible").innerText = "N/A";
    }

    await updateAirdropLeaderboard();
  } catch (err) {
    console.error("Airdrop load error:", err);
  }
}

/* ================= LEADERBOARD (Clean XP) ================= */

async function updateAirdropLeaderboard() {
  const div = document.getElementById("airdropLeaderboard");
  if (!div) return;

  div.innerHTML =
    "<p style='text-align:center;color:#aaa'>Loading leaderboard...</p>";

  try {
    const contract = window.airdropContract();

    let participants;
    try {
      participants = await contract.getAllParticipants();
      if (!Array.isArray(participants)) throw "Invalid list";
    } catch {
      div.innerHTML =
        "<p style='color:#ccc'>Leaderboard not available</p>";
      return;
    }

    const rows = [];

    for (const addr of participants) {
      try {
        const xp = await contract.xpOf(addr);
        rows.push({ addr: addr.toLowerCase(), xp });
      } catch {}
    }

    if (!rows.length) {
      div.innerHTML = "<p>No participants yet</p>";
      return;
    }

    rows.sort((a, b) =>
      b.xp.gt(a.xp) ? 1 : a.xp.gt(b.xp) ? -1 : 0
    );

    let html = "";
    rows.slice(0, 50).forEach((r, i) => {
      const rank = i + 1;
      const xpClean = r.xp.toString(); // Clean integer: 505 (no formatUnits)

      const short = r.addr.slice(0, 6) + "..." + r.addr.slice(-4);

      if (r.addr === (await window.getUserAddress())?.toLowerCase()) {
        document.getElementById("userAirdropRank").innerText = rank;
      }

      html += `<p><strong>#${rank}</strong> ${short} — ${xpClean} XP</p>`;
    });

    div.innerHTML = html;
  } catch (e) {
    div.innerHTML =
      "<p style='color:#ccc'>Leaderboard error</p>";
    console.error(e);
  }
}

window.loadAirdropData = loadAirdropData;
window.updateAirdropLeaderboard = updateAirdropLeaderboard;