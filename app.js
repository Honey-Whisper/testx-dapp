// app.js - Rox Protocol DApp - Optimized & Fixed (December 26, 2025)

const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;
const PREDICTION_CONTRACT = "0xb2637f913734304211fcc88be876e9097c5b818a";
const PREDICTION_ABI = window.PREDICTION_ABI;

const TREASURY = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();
const CAMPAIGN = "0xCa02FbBEF765E3d33c3e0094Ceb5017b1B9c6677".toLowerCase();

const OWNER_VESTED_AMOUNT = ethers.utils.parseUnits("200000", 18); // 8% vested

let provider, signer, contract, user, predictionContract;
let holderCount = 0;
let holderHistory = [];
let holderChart;
let holders = new Set(); // Optimized holder tracking
let lastScannedBlock = 0; // For incremental holder scan

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletAddress = document.getElementById('walletAddress');

async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask required!");
    try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        await setup();
        loadData();
    } catch (e) { alert("Error: " + e.message); }
}

async function setup() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = (await signer.getAddress()).toLowerCase();
    contract = new ethers.Contract(CONTRACT, ABI, signer);
    predictionContract = new ethers.Contract(PREDICTION_CONTRACT, PREDICTION_ABI, signer);

    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    walletAddress.textContent = user.slice(0,6) + '...' + user.slice(-4);
    walletAddress.style.display = 'block';
    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
    document.getElementById('predictBtn').disabled = false;
    document.getElementById('shareCardBtn').disabled = true;

    // Initial data load
    loadData();
    updateContestBalance();
    setupPrediction();
    updateCountdown();
}

function disconnectWallet() {
    provider = signer = contract = predictionContract = user = null;
    connectBtn.style.display = 'inline-block';
    disconnectBtn.style.display = 'none';
    walletAddress.style.display = 'none';
    document.querySelectorAll('.main-btn').forEach(b => b.disabled = true);
}

async function loadData() {
    if (!contract) return;
    try {
        const d = 18;

        // User data
        const bal = await contract.balanceOf(user);
        document.getElementById('userBalance').textContent = Number(ethers.utils.formatUnits(bal, d)).toFixed(0);

        const stake = await contract.stakes(user);
        document.getElementById('stakedAmount').textContent = Number(ethers.utils.formatUnits(stake.amount, d)).toLocaleString();
        document.getElementById('unlockTime').textContent = stake.unlockTime > 0 ? new Date(stake.unlockTime * 1000).toLocaleDateString() : '—';

        const pending = await contract.calculatePendingRewards(user);
        document.getElementById('pendingRewards').textContent = Number(ethers.utils.formatUnits(pending, d)).toLocaleString();

        // Safe Circulating Supply - Fixed fallback
        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(CONTRACT);
        const treasuryBal = await contract.balanceOf(TREASURY);
        const campaignBal = await contract.balanceOf(CAMPAIGN);
        const vestedUnreleased = OWNER_VESTED_AMOUNT;

        const totalLocked = contractBal.add(treasuryBal).add(campaignBal).add(vestedUnreleased);
        const safeCirculating = totalSupply.sub(totalLocked);
        const safeNum = safeCirculating.lt(0) ? "0" : Number(ethers.utils.formatUnits(safeCirculating, d)).toLocaleString();

        document.getElementById('circulatingSupply').innerHTML = `
            <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
            <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
        `;

        document.getElementById('vaultCirculating').textContent = safeNum + ' $ROX';

        // Transparency Vault
        document.getElementById('treasuryBalance').textContent = Number(ethers.utils.formatUnits(treasuryBal, d)).toLocaleString();
        document.getElementById('campaignBalance').textContent = Number(ethers.utils.formatUnits(campaignBal, d)).toLocaleString();
        document.getElementById('contractBalance').textContent = Number(ethers.utils.formatUnits(contractBal, d)).toLocaleString();
        document.getElementById('ownerReleased').textContent = "0";

        updateHolders(); // Call once

    } catch (e) {
        console.error("loadData error:", e);
        document.getElementById('circulatingSupply').innerHTML = '<p style="color:#aaa;">Data temporarily unavailable</p>';
    }
}

// Optimized holders update - only new blocks
async function updateHolders() {
    if (!provider || !contract) return;
    try {
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = lastScannedBlock > 0 ? lastScannedBlock + 1 : 0;

        if (fromBlock > currentBlock) return;

        const transfers = await contract.queryFilter(contract.filters.Transfer(), fromBlock, currentBlock);

        transfers.forEach(t => {
            const from = t.args.from.toLowerCase();
            const to = t.args.to.toLowerCase();
            if (from !== ethers.constants.AddressZero) holders.add(from);
            if (to !== ethers.constants.AddressZero) holders.add(to);
        });

        holderCount = holders.size;
        document.getElementById('holderCount').textContent = holderCount.toLocaleString();

        const today = new Date().toISOString().split('T')[0];
        const entry = holderHistory.find(h => h.date === today);
        if (entry) entry.count = holderCount;
        else holderHistory.push({date: today, count: holderCount});

        if (!holderChart) {
            holderChart = new Chart(document.getElementById('holderGrowthChart').getContext('2d'), {
                type: 'line',
                data: { labels: holderHistory.map(h => h.date), datasets: [{ label: 'Holders', data: holderHistory.map(h => h.count), borderColor: '#FFD700', tension: 0.4, fill: true }] },
                options: { responsive: true }
            });
        } else {
            holderChart.update();
        }

        lastScannedBlock = currentBlock;
    } catch (e) {
        console.error("Holders error:", e);
        document.getElementById('holderCount').textContent = "N/A";
    }
}

// Contest balance live
async function updateContestBalance() {
    if (!contract) return;
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT);
        const formatted = Number(ethers.utils.formatUnits(balance, 18)).toLocaleString();
        document.getElementById('contestBalance').textContent = formatted;
    } catch (e) {
        document.getElementById('contestBalance').textContent = "Error";
    }
}

// Countdown to Jan 2, 2026
function updateCountdown() {
    const end = new Date('2026-01-02T23:59:59Z').getTime();
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = end - now;
        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            document.getElementById('predictBtn').disabled = true;
            clearInterval(timer);
            return;
        }
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        const m = Math.floor((diff % (1000*60*60)) / (1000*60));
        const s = Math.floor((diff % (1000*60)) / 1000);
        document.getElementById('countdownTimer').textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}

// Load predictions
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
            list.innerHTML += `<p style="margin:5px 0;"><strong>\( {p.user.slice(0,6)}... \){p.user.slice(-4)}</strong> predicted \[ {price}: "${p.message}"</p>`;
        }
    } catch (e) {
        console.error(e);
    }
}

// Predict button
document.getElementById('predictBtn').onclick = async () => {
    const price = parseFloat(document.getElementById('predictPrice').value);
    if (isNaN(price) || price < 0.3 || price > 1.5) return alert("Price must be $0.30 – $1.50");
    const scaled = Math.round(price * 1000);
    const msg = document.getElementById('predictMessage').value || "";

    try {
        const tx = await predictionContract.predict(scaled, msg);
        await tx.wait();
        alert("Prediction locked on-chain! Generating your viral card... 🔥");

        document.getElementById('cardWallet').textContent = user.slice(0,6)+'...'+user.slice(-4);
        document.getElementById('cardPrice').textContent = price.toFixed(2);
        document.getElementById('cardMessage').textContent = msg ? `"${msg}"` : '"Building the legacy 🔥"';
        document.getElementById('shareCardBtn').disabled = false;

        setupPrediction();
        updateContestBalance();
    } catch (e) { alert("Failed: " + e.message); }
};

// Share card
document.getElementById('shareCardBtn').onclick = () => {
    document.getElementById('predictionCard').style.display = 'block';
    html2canvas(document.getElementById('predictionCard'), {scale: 2}).then(canvas => {
        document.getElementById('predictionCard').style.display = 'none';
        const link = document.createElement('a');
        link.download = 'rox-legacy-prediction.png';
        link.href = canvas.toDataURL();
        link.click();

        const text = encodeURIComponent(`I predicted $ROX at \]{document.getElementById('cardPrice').textContent}!\n3,875 $ROX contest • Ends soon!\nLow supply → Huge upside 🔥\nJoin: https://honey-whisper.github.io/testx-dapp/ #ROXProtocol #Base`);
        window.open(`https://x.com/intent/post?text=${text}`);
        alert("Card downloaded! Attach to X post for max virality 🚀");
    });
};

// Navigation & other functions (your existing presale, stake, claim, etc.) remain here
// ... (keep your existing contribute, stake, claimRewards, ethAmount input, nav clicks)

// Refresh data less frequently
setInterval(() => {
    if (contract) {
        loadData();
        updateContestBalance();
    }
}, 60000); // Every 60 seconds

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

window.addEventListener('load', async () => {
    if (window.ethereum && (await ethereum.request({ method: 'eth_accounts' })).length > 0) {
        await setup();
    }
});