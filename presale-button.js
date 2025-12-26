document.getElementById('ethAmount')?.addEventListener('input', () => {
    const eth = parseFloat(document.getElementById('ethAmount').value) || 0;
    document.getElementById('tokenPreview').textContent = `You'll receive: ${(eth * 8000).toFixed(0)} $TESTX`;
});

document.getElementById('contributeBtn')?.addEventListener('click', async () => {
    if (!user) return alert("Wallet connect karo pehle!");
    const eth = parseFloat(document.getElementById('ethAmount').value);
    if (!eth || eth < 0.0125 || eth > 1.25) return alert('Amount 0.0125 - 1.25 ETH ke beech ho');
    try {
        const tx = await signer.sendTransaction({
            to: CONTRACT,
            value: ethers.utils.parseEther(eth.toString())
        });
        await tx.wait();
        alert('Contributed successfully!');
        document.getElementById('ethAmount').value = '';
        document.getElementById('tokenPreview').textContent = "You'll receive: 0 $TESTX";
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});

document.getElementById('claimTokensBtn')?.addEventListener('click', async () => {
    if (!user) return alert("Connect wallet!");
    try {
        const tx = await contract.claimPresaleTokens();
        await tx.wait();
        alert("Tokens claimed!");
        loadData();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});