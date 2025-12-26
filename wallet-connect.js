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

        initContracts(); // contracts setup
        updateUIAfterConnect(); // UI changes
        loadAllData(); // <-- Yeh line add ki – data load karega

        console.log("Connected & data loading:", user);
    } catch (err) {
        alert("Connect failed: " + err.message);
        console.error(err);
    }
}

document.getElementById('connectBtn').onclick = connectWallet;
document.getElementById('disconnectBtn').onclick = () => location.reload();