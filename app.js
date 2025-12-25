// app.js - Rox Protocol DApp - Fully Corrected & Optimized (December 26, 2025)

const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;
const PREDICTION_CONTRACT = "0xb2637f913734304211fcc88be876e9097c5b818a";
const PREDICTION_ABI = window.PREDICTION_ABI || [];

const TREASURY = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();
const CAMPAIGN = "0xCa02FbFEF765E3d33c3e0094Ceb5017b1B9c6677".toLowerCase();

const OWNER_VESTED_AMOUNT = ethers.utils.parseUnits("200000", 18);

let provider, signer, contract, user, predictionContract;
let holderCount = 0;
let holderHistory = []; // Always initialized as array
let holderChart = null;
let holders = new Set();
let lastScannedBlock = 0;

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
    updateHolders(); // Initial call
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

        // Safe Circulating Supply
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

    } catch (e) {
        console.error("loadData error:", e);
        document.getElementById('circulatingSupply').innerHTML = '<p style="color:#aaa;">Data temporarily unavailable</p>';
    }
}

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

        // Safe chart creation/update
        if (!holderChart && holderHistory.length > 0) {
            holderChart = new Chart(document.getElementById('holderGrowthChart').getContext('2d'), {
                type: 'line',
                data: { 
                    labels: holderHistory.map(h => h.date || 'N/A'), 
                    datasets: [{ 
                        label: 'Holders', 
                        data: holderHistory.map(h => h.count || 0), 
                        borderColor: '#FFD700', 
                        tension: 0.4, 
                        fill: true 
                    }] 
                },
                options: { responsive: true }
            });
        } else if (holderChart) {
            holderChart.update();
        }

        lastScannedBlock = currentBlock;
    } catch (e) {
        console.error("Holders error:", e);
        document.getElementById('holderCount').textContent = "N/A";
    }
}

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

function updateCountdown() {
    const end = new Date('2026-01-02T23:59:59Z').getTime();
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = end - now;
        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            if (document.getElementById('predictBtn')) document.getElementById('predictBtn').disabled = true;
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
            list.innerHTML += `<p style="margin:5px 0;"><strong>\( {p.user.slice(0,6)}... \){p.user.slice(-4)}</strong> predicted \[ {price}: "${p.message || 'No message'}"</p>`;
        }
    } catch (e) {
        console.error("Prediction load error:", e);
    }
}

// Predict
if (document.getElementById('predictBtn')) {
    document.getElementById('predictBtn').onclick = async () => {
        const price = parseFloat(document.getElementById('predictPrice').value);
        if (isNaN(price) || price < 0.3 || price > 1.5) return alert("Price must be $0.30 – $1.50");
        const scaled = Math.round(price * 1000);
        const msg = document.getElementById('predictMessage').value || "";

        try {
            const tx = await predictionContract.predict(scaled, msg);
            await tx.wait();
            alert("Prediction locked! Generating your viral card... 🔥");

            document.getElementById('cardWallet').textContent = user.slice(0,6)+'...'+user.slice(-4);
            document.getElementById('cardPrice').textContent = price.toFixed(2);
            document.getElementById('cardMessage').textContent = msg ? `"${msg}"` : '"Building the legacy 🔥"';
            document.getElementById('shareCardBtn').disabled = false;

            setupPrediction();
            updateContestBalance();
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
            link.download = 'rox-legacy-prediction.png';
            link.href = canvas.toDataURL();
            link.click();

            const text = encodeURIComponent(`I predicted $ROX at \]{document.getElementById('cardPrice').textContent}!\n3,875 $ROX contest live • Ends soon!\nLow supply → Huge upside 🔥\nJoin: https://honey-whisper.github.io/testx-dapp/ #ROXProtocol #Base`);
            window.open(`https://x.com/intent/post?text=${text}`);
            alert("Card downloaded! Attach to X post 🚀");
        });
    };
}

// Navigation (keep your existing)
document.querySelectorAll('nav button').forEach(b => {
    b.onclick = () => {
        document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById(b.dataset.section).classList.add('active');
    };
});

// Presale preview (keep your existing)
if (document.getElementById('ethAmount')) {
    document.getElementById('ethAmount').oninput = () => {
        const eth = parseFloat(document.getElementById('ethAmount').value) || 0;
        document.getElementById('tokenPreview').textContent = `You'll receive: ${(eth * 8000).toFixed(0)} $ROX`;
    };
}

// Contribute, Stake, Claim (keep your existing functions)

// Refresh every 60 seconds
setInterval(() => {
    if (contract) {
        loadData();
        updateContestBalance();
    }
}, 60000);

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

window.addEventListener('load', async () => {
    if (window.ethereum && (await ethereum.request({ method: 'eth_accounts' })).length > 0) {
        await setup();
    } else {
        // Initial load for non-connected
        updateCountdown();
    }
});