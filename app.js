// app.js - Rox Protocol DApp - Final Working Version (December 26, 2025)

const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;
const PREDICTION_CONTRACT = "0xb2637f913734304211fcc88be876e9097c5b818a";
const PREDICTION_ABI = window.PREDICTION_ABI || [];

const TREASURY = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();
const CAMPAIGN = "0xCa02FbFEF765E3d33c3e0094Ceb5017b1B9c6677".toLowerCase();

const OWNER_VESTED_AMOUNT = ethers.utils.parseUnits("200000", 18);

let provider, signer, contract, user, predictionContract;
let holderCount = 0;
let holderHistory = [];
let holderChart = null;

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletAddress = document.getElementById('walletAddress');

async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask required!");
    try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        await setup();
    } catch (e) { alert("Error: " + e.message); }
}

async function setup() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = (await signer.getAddress()).toLowerCase();
    contract = new ethers.Contract(CONTRACT, ABI, signer);
    if (PREDICTION_ABI.length > 0) {
        predictionContract = new ethers.Contract(PREDICTION_CONTRACT, PREDICTION_ABI, signer);
    }

    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    walletAddress.textContent = user.slice(0,6) + '...' + user.slice(-4);
    walletAddress.style.display = 'block';
    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
    if (document.getElementById('predictBtn')) document.getElementById('predictBtn').disabled = false;

    loadData();
    updateContestBalance();
    setupPrediction();
    updateCountdown();
}

async function loadData() {
    if (!contract) return;
    try {
        const d = 18;

        const bal = await contract.balanceOf(user);
        document.getElementById('userBalance').textContent = Number(ethers.utils.formatUnits(bal, d)).toFixed(0);

        const stake = await contract.stakes(user);
        document.getElementById('stakedAmount').textContent = Number(ethers.utils.formatUnits(stake.amount, d)).toLocaleString();
        document.getElementById('unlockTime').textContent = stake.unlockTime > 0 ? new Date(stake.unlockTime * 1000).toLocaleDateString() : '—';

        const pending = await contract.calculatePendingRewards(user);
        document.getElementById('pendingRewards').textContent = Number(ethers.utils.formatUnits(pending, d)).toLocaleString();

        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(CONTRACT);
        const treasuryBal = await contract.balanceOf(TREASURY);
        const campaignBal = await contract.balanceOf(CAMPAIGN);

        const totalLocked = contractBal.add(treasuryBal).add(campaignBal).add(OWNER_VESTED_AMOUNT);
        const safeCirculating = totalSupply.sub(totalLocked);
        const safeNum = safeCirculating.lt(0) ? "0" : Number(ethers.utils.formatUnits(safeCirculating, d)).toLocaleString();

        document.getElementById('circulatingSupply').innerHTML = `
            <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
            <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
        `;
        document.getElementById('vaultCirculating').textContent = safeNum + ' $ROX';

        document.getElementById('treasuryBalance').textContent = Number(ethers.utils.formatUnits(treasuryBal, d)).toLocaleString();
        document.getElementById('campaignBalance').textContent = Number(ethers.utils.formatUnits(campaignBal, d)).toLocaleString();
        document.getElementById('contractBalance').textContent = Number(ethers.utils.formatUnits(contractBal, d)).toLocaleString();
        document.getElementById('ownerReleased').textContent = "0";

    } catch (e) {
        console.error(e);
    }
}

async function updateContestBalance() {
    if (!contract) return;
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT);
        const formatted = Number(ethers.utils.formatUnits(balance, 18)).toLocaleString();
        document.getElementById('contestBalance').textContent = formatted;
    } catch (e) {
        document.getElementById('contestBalance').textContent = "Check BaseScan";
    }
}

function updateCountdown() {
    const endDate = new Date('2026-01-02T23:59:59Z').getTime();
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = endDate - now;

        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            clearInterval(timer);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdownTimer').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    }, 1000);
}

async function setupPrediction() {
    if (!predictionContract) return;
    try {
        const count = await predictionContract.predictionsLength();
        document.getElementById('predictionCount').textContent = count.toString();

        const list = document.getElementById('predictionsList');
        list.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const p = await predictionContract.predictions(i);
            const price = (p.predictedPrice / 1000).toFixed(3);
            list.innerHTML += `<p><strong>\( {p.user.slice(0,6)}... \){p.user.slice(-4)}</strong> predicted \[ {price}: "${p.message || 'No message'}"</p>`;
        }
    } catch (e) {
        console.error(e);
    }
}

// Predict button
if (document.getElementById('predictBtn')) {
    document.getElementById('predictBtn').onclick = async () => {
        const price = parseFloat(document.getElementById('predictPrice').value);
        if (isNaN(price) || price < 0.3 || price > 1.5) return alert("Price must be $0.30 – $1.50");
        const scaled = Math.round(price * 1000);
        const msg = document.getElementById('predictMessage').value || "";

        try {
            const tx = await predictionContract.predict(scaled, msg);
            await tx.wait();
            alert("Prediction locked! Generating viral card...");

            document.getElementById('cardWallet').textContent = user.slice(0,6)+'...'+user.slice(-4);
            document.getElementById('cardPrice').textContent = price.toFixed(2);
            document.getElementById('cardMessage').textContent = msg ? `"${msg}"` : '"Building the legacy 🔥"';
            document.getElementById('shareCardBtn').disabled = false;

            setupPrediction();
        } catch (e) { alert("Failed: " + e.message); }
    };
}

// Share card
if (document.getElementById('shareCardBtn')) {
    document.getElementById('shareCardBtn').onclick = () => {
        document.getElementById('predictionCard').style.display = 'block';
        html2canvas(document.getElementById('predictionCard'), {scale: 2}).then(canvas => {
            document.getElementById('predictionCard').style.display = 'none';
            const link = document.createElement('a');
            link.download = 'rox-prediction.png';
            link.href = canvas.toDataURL();
            link.click();

            const text = encodeURIComponent(`I predicted $ROX at \]{document.getElementById('cardPrice').textContent}! 3,875 $ROX contest live 🔥 Join: https://honey-whisper.github.io/testx-dapp/ #ROXProtocol`);
            window.open(`https://x.com/intent/post?text=${text}`);
        });
    };
}

// Refresh
setInterval(() => {
    if (contract) {
        loadData();
        updateContestBalance();
    }
}, 60000);

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

window.addEventListener('load', () => {
    updateCountdown();
    if (window.ethereum) {
        ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (accounts.length > 0) setup();
        });
    }
});