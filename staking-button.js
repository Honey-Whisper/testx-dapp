document.getElementById('stakeBtn')?.addEventListener('click', async () => {
    if (!user) return alert("Connect wallet!");
    const amt = parseFloat(document.getElementById('stakeAmount').value);
    if (!amt || amt <= 0) return alert("Valid amount daalo");
    try {
        const tx = await contract.stake(ethers.utils.parseUnits(amt.toString(), 18));
        await tx.wait();
        alert("Staked successfully!");
        document.getElementById('stakeAmount').value = '';
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});

document.getElementById('unstakeBtn')?.addEventListener('click', async () => {
    if (!user) return alert("Connect wallet!");
    const amt = parseFloat(document.getElementById('stakeAmount').value);
    if (!amt || amt <= 0) return alert("Valid amount daalo");
    try {
        const tx = await contract.unstake(ethers.utils.parseUnits(amt.toString(), 18));
        await tx.wait();
        alert("Unstaked successfully!");
        document.getElementById('stakeAmount').value = '';
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});