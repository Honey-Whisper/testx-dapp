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
    } catch (e) { alert("Connection failed: " + e.message); }
}

async function setup() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = (await signer.getAddress()).toLowerCase();

    contract = new ethers.Contract(CONTRACT, ABI, signer);

    // Prediction contract – fallback to minimal ABI if full not provided
    if (PREDICTION_ABI.length > 0) {
        predictionContract = new ethers.Contract(PREDICTION_CONTRACT, PREDICTION_ABI, signer);
    } else {
        const minABI = ["function balanceOf(address) view returns (uint256)", "function predict(uint256,string)", "function predictionsLength() view returns (uint256)", "function predictions(uint256) view returns (address user, uint256 predictedPrice, string message)"];
        predictionContract = new ethers.Contract(PREDICTION_CONTRACT, minABI, provider);
    }

    // Get decimals dynamically
    try {
        decimals = await contract.decimals();
    } catch (e) { console.warn("No decimals() – using 18"); }

    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    walletAddress.textContent = user.slice(0,6) + '...' + user.slice(-4);
    walletAddress.style.display = 'block';

    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
    if (document.getElementById('predictBtn')) document.getElementById('predictBtn').disabled = false;

    document.getElementById('displayContract').textContent = CONTRACT;

    loadData();
    updateContestBalance();
    setupPrediction();
    updateCountdown();
}

async function loadData() {
    if (!contract) return;
    try {
        const format = (val) => Number(ethers.utils.formatUnits(val, decimals)).toLocaleString(undefined, {maximumFractionDigits: 0});

        // Example user data (add back your presale/staking sections if needed)
        const bal = await contract.balanceOf(user);
        if (document.getElementById('userBalance')) document.getElementById('userBalance').textContent = format(bal);

        const totalSupply = await contract.totalSupply();
        const contractBal = await contract.balanceOf(CONTRACT);
        const treasuryBal = await contract.balanceOf(TREASURY);
        const campaignBal = await contract.balanceOf(CAMPAIGN);

        let ownerReleased = ethers.BigNumber.from("0");
        try { ownerReleased = await contract.ownerVestedReleased(); } catch {}

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
        console.error(e);
        document.getElementById('circulatingSupply').innerHTML = '<p style="color:red;">Error loading data</p>';
    }
}

async function updateContestBalance() {
    try {
        const balance = await contract.balanceOf(PREDICTION_CONTRACT);
        document.getElementById('contestBalance').textContent = Number(ethers.utils.formatUnits(balance, decimals)).toLocaleString();
    } catch (e) {
        document.getElementById('contestBalance').textContent = "Check BaseScan";
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
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        const m = Math.floor((diff % (1000*60*60)) / (1000*60));
        const s = Math.floor((diff % (1000*60)) / 1000);
        document.getElementById('countdownTimer').textContent = `${d}d ${h}h ${m}m ${s}s left`;
    }, 1000);
}

async function setupPrediction() {
    try {
        const count = await predictionContract.predictionsLength();
        document.getElementById('predictionCount').textContent = count;

        const list = document.getElementById('predictionsList');
        list.innerHTML = '';
        for (let i = 0; i < Math.min(count, 50); i++) {
            const p = await predictionContract.predictions(i);
            const price = (p.predictedPrice / 1000).toFixed(3);
            list.innerHTML += `<p><strong>\( {p.user.slice(0,6)}... \){p.user.slice(-4)}</strong> predicted \[ {price}: "${p.message || 'No message'}"</p>`;
        }
    } catch (e) {
        document.getElementById('predictionsList').innerHTML = '<p style="color:red;">Predictions unavailable</p>';
    }
}

document.getElementById('predictBtn')?.addEventListener('click', async () => {
    const price = parseFloat(document.getElementById('predictPrice').value);
    if (isNaN(price) || price < 0.30 || price > 1.50) return alert("Price must be $0.30 – $1.50");

    const scaled = Math.round(price * 1000);
    const msg = document.getElementById('predictMessage').value.trim() || "";

    try {
        const tx = await predictionContract.predict(scaled, msg, { gasLimit: 300000 });
        await tx.wait();
        alert("Prediction locked! Generating card...");

        document.getElementById('cardWallet').textContent = user.slice(0,6)+'...'+user.slice(-4);
        document.getElementById('cardPrice').textContent = price.toFixed(2);
        document.getElementById('cardMessage').textContent = msg ? `"${msg}"` : '"Building the legacy 🔥"';
        document.getElementById('shareCardBtn').disabled = false;

        setupPrediction();
    } catch (e) {
        alert("Failed: " + (e.reason || e.message));
    }
});

document.getElementById('shareCardBtn')?.addEventListener('click', () => {
    document.getElementById('predictionCard').style.display = 'block';
    html2canvas(document.getElementById('predictionCard'), {scale: 2}).then(canvas => {
        document.getElementById('predictionCard').style.display = 'none';
        const link = document.createElement('a');
        link.download = 'rox-legacy-prediction.png';
        link.href = canvas.toDataURL();
        link.click();

        const price = document.getElementById('cardPrice').textContent;
        const text = encodeURIComponent(`I predicted $ROX launch price at \]{price}! 🚀\n3,875 $ROX prize pool live!\nJoin: https://honey-whisper.github.io/testx-dapp/ #ROXProtocol`);
        window.open(`https://x.com/intent/post?text=${text}`);
    });
});

setInterval(() => { if (contract) { loadData(); updateContestBalance(); } }, 60000);

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = () => location.reload();

window.addEventListener('load', () => {
    updateCountdown();
    if (window.ethereum && ethereum.selectedAddress) setup();
});