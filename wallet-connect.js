// wallet-connect.js
let provider, signer, userAddress;

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask install karo bhai!");
        return;
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = (await signer.getAddress()).toLowerCase();

        // Initialize all contracts (including airdrop)
        initContracts();

        // Update UI after connect
        updateUIAfterConnect();

        // Load all data (prediction, transparency, airdrop, etc.)
        loadAllData();

        console.log("Wallet connected:", userAddress);
        console.log("All contracts & data loaded!");

    } catch (err) {
        alert("Connect failed: " + err.message);
        console.error("Wallet connect error:", err);
    }
}

// Make user address globally accessible
window.getUserAddress = () => userAddress;
window.getSigner = () => signer;
window.getProvider = () => provider;

// Disconnect – simple reload
document.getElementById('connectBtn')?.addEventListener('click', connectWallet);
document.getElementById('disconnectBtn')?.addEventListener('click', () => location.reload());