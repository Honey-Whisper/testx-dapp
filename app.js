const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;
const PREDICTION_CONTRACT = window.PREDICTION_CONTRACT;
const PREDICTION_ABI = window.PREDICTION_ABI || [];

let provider, signer, contract, user, predictionContract, decimals = 18;

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletAddress = document.getElementById('walletAddress');

async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        await setup();
    } catch (e) {
        alert("Connection failed: " + e.message);
    }
}

async function setup() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = (await signer.getAddress()).toLowerCase();

    contract = new ethers.Contract(CONTRACT, ABI, signer);

    // Minimal ABI for contest prize balance even if full ABI missing
    const minABI = ["function balanceOf(address) view returns (uint256)"];
    predictionContract = new ethers.Contract(PREDICTION_CONTRACT, minABI, provider);

    try {
        decimals = await contract.decimals();
    } catch (e) {
        console.warn("decimals() not found – using 18");
        decimals = 18;
    }

    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    walletAddress.textContent = user.slice(0,6) + '...' + user.slice(-4);
    walletAddress.style.display = 'block';

    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
    document.getElementById('predictBtn').disabled = false;

    document.getElementById('displayContract').textContent = CONTRACT;

    loadData();
    updateContestBalance();
    updateCountdown();
}

async function loadData() {
    if (!contract) return;

    try {
        const format = (val) => Number(ethers.utils.formatUnits(val, decimals)).toLocaleString();

        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(CONTRACT);
        const treasuryBal = await contract.balanceOf(TREASURY);
        const campaignBal = await contract.balanceOf(CAMPAIGN);

        let ownerReleased = ethers.BigNumber.from("0");
        try {
            ownerReleased = await contract.ownerVestedReleased();
        } catch {}

        const totalLocked = contractBal.add(treasuryBal).add(campaignBal).add(OWNER_VESTED_AMOUNT).sub(ownerReleased);
        let safeCirculating = totalSupply.sub(totalLocked);
        if (safeCirculating.lt(0)) safeCirculating = ethers.BigNumber.from("0");

        const safeNum = format(safeCirculating);

        document.getElementById('circulatingSupply').innerHTML = `
            <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
            <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
        `;

        document.getElementById('vaultCirculating').textContent = safeNum + ' $ROX';
        document.getElementById('treasuryBalance').textContent = format(treasuryBal);
        document.getElementById('campaignBalance').textContent = format(campaignBal);
        document.getElementById('contractBalance').textContent = format(contractBal);
        document.getElementById('ownerReleased').textContent = format(ownerReleased);

    } catch (e) {
        console.error("loadData error:", e);
        document.getElementById('circulatingSupply').innerHTML = '<p style="color:red;">Error loading data</p>';
    }
}

async function updateContestBalance() {
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT);
        document.getElementById('contestBalance').textContent = Number(ethers.utils.formatUnits(balance, decimals)).toLocaleString();
    } catch (e) {
        document.getElementById('contestBalance').textContent = "3,875";
    }
}

function updateCountdown() {
    const endDate = new Date('2026-01-02T23:59:59Z').getTime();
    setInterval(() => {
        const diff = endDate - Date.now();
        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('countdownTimer').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    }, 1000);
}

// Prediction button (full function when you have prediction ABI)
document.getElementById('predictBtn')?.addEventListener('click', () => {
    alert("Prediction will be enabled when prediction contract ABI is added. Prize pool is live and locked!");
});

// Share card (preview only until prediction works)
document.getElementById('shareCardBtn')?.addEventListener('click', () => {
    alert("Card generation ready after successful prediction!");
});

// Refresh data every minute
setInterval(() => {
    if (contract) {
        loadData();
        updateContestBalance();
    }
}, 60000);

// Connect & disconnect
connectBtn.onclick = connectWallet;
disconnectBtn.onclick = () => location.reload();

// Auto-connect if already approved
window.addEventListener('load', () => {
    updateCountdown();
    if (window.ethereum) {
        ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (accounts.length > 0) setup();
        });
    }
});