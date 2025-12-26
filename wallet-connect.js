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

        // YE ORIGINAL HAIN – RAKH LE
        initContracts(); // contracts setup (yeh pehle se hai)
        updateUIAfterConnect(); // UI changes (button text, etc.)

        // YE SIRF AIRDROP KE LIYE ADD KAR – SAFE HAI
        window.getUserAddress = () => user;  // airdrop-data.js isko expect karta hai
        window.airdropContract = () => new ethers.Contract(
            window.AIRDROP_CONTRACT_ADDRESS,
            window.AIRDROP_ABI,  // assume yeh constants.js mein hai
            signer
        );

        // YE LINE ADD KAR – airdrop data load karega connect hone ke baad
        if (typeof loadAirdropData === "function") {
            loadAirdropData();
        }

        console.log("Connected & data loading:", user);
    } catch (err) {
        alert("Connect failed: " + err.message);
        console.error(err);
    }
}

document.getElementById('connectBtn').onclick = connectWallet;
document.getElementById('disconnectBtn').onclick = () => location.reload();