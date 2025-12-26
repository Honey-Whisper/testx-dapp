document.getElementById('claimRewardsBtn')?.addEventListener('click', async () => {
    if (!user) return alert("Connect wallet!");
    try {
        const tx = await contract.claimRewards();
        await tx.wait();
        alert("Rewards claimed!");
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});