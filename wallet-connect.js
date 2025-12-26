let provider, signer, user;

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask install karo bhai!");
        return;
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        user = (await signer.getAddress()).toLowerCase();

        // Critical calls – contracts init, UI update, data load
        initContracts();  // from contract-init.js
        updateUIAfterConnect();  // from ui-update.js
        loadAllData();  // from data-load.js

        console.log("Connected:", user);
    } catch (err) {
        alert("Connect failed: " + err.message);
        console.error(err);
    }
}

document.getElementById('connectBtn').onclick = connectWallet;
document.getElementById('disconnectBtn').onclick = () => location.reload();