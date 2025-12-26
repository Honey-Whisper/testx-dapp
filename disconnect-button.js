document.getElementById('disconnectBtn')?.addEventListener('click', () => {
    provider = signer = contract = user = null;
    document.getElementById('connectBtn').style.display = 'inline-block';
    document.getElementById('disconnectBtn').style.display = 'none';
    document.getElementById('walletAddress').style.display = 'none';
    document.querySelectorAll('.main-btn').forEach(b => b.disabled = true);
    alert("Wallet disconnected!");
});