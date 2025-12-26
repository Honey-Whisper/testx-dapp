document.getElementById('claimOwnerBtn')?.addEventListener('click', async () => {
    if (!user || user !== OWNER) return alert("Owner only!");
    try {
        const tx = await contract.claimOwnerVested();
        await tx.wait();
        alert("Owner vested claimed!");
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});