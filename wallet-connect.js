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

        // Yeh line add ki – contracts init aur UI update pehle
        initContracts(); // contract-init.js se
        updateUIAfterConnect(); // ui-update.js se
        loadAllData(); // data-load.js se

        console.log("Wallet connected successfully:", user);
    } catch (err) {
        alert("Connect nahi hua: " + err.message);
        console.error(err);
    }
}

document.getElementById('connectBtn').onclick = connectWallet;
document.getElementById('disconnectBtn').onclick = () => location.reload();