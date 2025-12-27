async function loadAllData() {
    if (!contract || !userAddress) return;

    try {
        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(ROX_CONTRACT_ADDRESS);
        const treasuryBal = await contract.balanceOf(TREASURY_ADDRESS); // Use correct constant
        const campaignBal = await contract.balanceOf(CAMPAIGN_ADDRESS);

        let ownerReleased = ethers.BigNumber.from("0");
        try { 
            ownerReleased = await contract.ownerVestedReleased(); 
        } catch (e) {
            console.warn("ownerVestedReleased not available or failed", e);
        }

        // Assume OWNER_VESTED_TOTAL is the full vested amount for owner/team (define in constants.js)
        const totalLocked = contractBal
            .add(treasuryBal)
            .add(campaignBal)
            .add(ethers.BigNumber.from(OWNER_VESTED_TOTAL || "0"))
            .sub(ownerReleased);

        let safeCirculating = totalSupply.sub(totalLocked);
        if (safeCirculating.lt(0)) safeCirculating = ethers.BigNumber.from("0");

        const safeNum = formatNumber(safeCirculating); // Your formatNumber function (e.g., adds commas, removes decimals)

        // Update Circulating Supply section
        if (document.getElementById('circulatingSupply')) {
            document.getElementById('circulatingSupply').innerHTML = `
                <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
                <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
            `;
        }

        // Update Transparency Vault
        if (document.getElementById('vaultCirculating')) document.getElementById('vaultCirculating').textContent = safeNum;
        if (document.getElementById('treasuryBalance')) document.getElementById('treasuryBalance').textContent = formatNumber(treasuryBal);
        if (document.getElementById('campaignBalance')) document.getElementById('campaignBalance').textContent = formatNumber(campaignBal);
        if (document.getElementById('contractBalance')) document.getElementById('contractBalance').textContent = formatNumber(contractBal);
        if (document.getElementById('ownerReleased')) document.getElementById('ownerReleased').textContent = formatNumber(ownerReleased);

        // Update Legacy Vault contest prize
        await updateContestPrize();
    } catch (err) {
        console.error("Error loading transparency/circulating data:", err);
        if (document.getElementById('circulatingSupply')) {
            document.getElementById('circulatingSupply').innerHTML = '<p style="color:red;">Error loading data – try again</p>';
        }
    }
}

async function updateContestPrize() {
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT_ADDRESS);
        const formatted = formatNumber(balance);
        if (document.getElementById('contestBalance')) {
            document.getElementById('contestBalance').textContent = formatted;
        }
    } catch (e) {
        console.warn("Contest prize load failed", e);
        if (document.getElementById('contestBalance')) {
            document.getElementById('contestBalance').textContent = "3,875"; // fallback
        }
    }
}

// Helper for clean number display (add to utils.js or inline)
function formatNumber(bn) {
    if (!bn || bn.eq(0)) return "0";
    let str = ethers.utils.formatEther(bn);
    // Remove trailing decimals if whole number
    const num = parseFloat(str);
    return num % 1 === 0 ? num.toLocaleString() : parseFloat(str).toFixed(2).replace(/\.?0+$/, '');
}

// Call this after wallet connect and contract init
// e.g., in initContractsAndLoad() or after connectWallet success
loadAllData();