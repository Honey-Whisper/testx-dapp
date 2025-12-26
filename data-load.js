async function loadAllData() {
    if (!contract) return;

    try {
        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(ROX_CONTRACT_ADDRESS);
        const treasuryBal = await contract.balanceOf(TREASURY);
        const campaignBal = await contract.balanceOf(CAMPAIGN);

        let ownerReleased = ethers.BigNumber.from("0");
        try { ownerReleased = await contract.ownerVestedReleased(); } catch {}

        const totalLocked = contractBal.add(treasuryBal).add(campaignBal).add(OWNER_VESTED_AMOUNT).sub(ownerReleased);
        let safeCirculating = totalSupply.sub(totalLocked);
        if (safeCirculating.lt(0)) safeCirculating = ethers.BigNumber.from("0");

        const safeNum = formatNumber(safeCirculating);

        document.getElementById('circulatingSupply').innerHTML = `
            <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
            <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
        `;
        document.getElementById('vaultCirculating').textContent = safeNum + ' $ROX';
        document.getElementById('treasuryBalance').textContent = formatNumber(treasuryBal);
        document.getElementById('campaignBalance').textContent = formatNumber(campaignBal);
        document.getElementById('contractBalance').textContent = formatNumber(contractBal);
        document.getElementById('ownerReleased').textContent = formatNumber(ownerReleased);

        updateContestPrize();
    } catch (err) {
        console.error(err);
        document.getElementById('circulatingSupply').innerHTML = '<p style="color:red;">Network issue – try again</p>';
    }
}

async function updateContestPrize() {
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT);
        document.getElementById('contestBalance').textContent = formatNumber(balance);
    } catch {
        document.getElementById('contestBalance').textContent = "3,875";
    }
}