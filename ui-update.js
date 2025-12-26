// UI UPDATE – After wallet connect

function updateUIAfterConnect() {
    // Hide connect, show disconnect & address
    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('disconnectBtn').style.display = 'inline-block';
    document.getElementById('walletAddress').textContent = user.slice(0,6) + '...' + user.slice(-4);
    document.getElementById('walletAddress').style.display = 'block';

    // Show correct main contract address (not prediction one)
    document.getElementById('displayContract').textContent = ROX_CONTRACT_ADDRESS;

    // Enable all main buttons (predict, share, etc.)
    document.querySelectorAll('.main-btn').forEach(btn => {
        btn.disabled = false;
    });

    console.log("UI updated after connect");
}