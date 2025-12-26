function updateUIAfterConnect() {
    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('disconnectBtn').style.display = 'inline-block';
    document.getElementById('walletAddress').textContent = user.slice(0,6) + '...' + user.slice(-4);
    document.getElementById('walletAddress').style.display = 'block';
    document.getElementById('displayContract').textContent = ROX_CONTRACT_ADDRESS;

    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
}