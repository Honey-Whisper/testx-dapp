// Add at top with other constants
const PREDICTION_CONTRACT = "0xb2637f913734304211fcc88be876e9097c5b818a";

// Add Prediction ABI (minimal needed for frontend)
const PREDICTION_ABI = [
    "function predict(uint256 _priceScaled, string calldata _message)",
    "function predictions(uint256) view returns (address user, uint256 predictedPrice, string message, uint256 timestamp)",
    "function predictionsLength() view returns (uint256)",
    "event Predicted(address indexed user, uint256 price, string message)"
];

// Global
let predictionContract;

// In setup()
async function setup() {
    // ... existing ...
    predictionContract = new ethers.Contract(PREDICTION_CONTRACT, PREDICTION_ABI, signer);
    document.getElementById('predictBtn').disabled = false;
    updateContestBalance();
    setupPrediction();
    updateCountdown();
}

// Live contest balance
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

// Countdown
function updateCountdown() {
    const end = new Date('2026-01-02T23:59:59Z').getTime();
    setInterval(() => {
        const now = new Date().getTime();
        const diff = end - now;
        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            document.getElementById('predictBtn').disabled = true;
            return;
        }
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        const m = Math.floor((diff % (1000*60*60)) / (1000*60));
        const s = Math.floor((diff % (1000*60)) / 1000);
        document.getElementById('countdownTimer').textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}

// Predict button
document.getElementById('predictBtn').onclick = async () => {
    const price = parseFloat(document.getElementById('predictPrice').value);
    if (isNaN(price) || price < 0.3 || price > 1.5) return alert("Price must be $0.30–$1.50");
    const scaled = Math.round(price * 1000);
    const msg = document.getElementById('predictMessage').value;

    try {
        const tx = await predictionContract.predict(scaled, msg);
        await tx.wait();
        alert("Prediction locked! Generating your viral card...");
        document.getElementById('cardWallet').textContent = user.slice(0,6)+'...'+user.slice(-4);
        document.getElementById('cardPrice').textContent = price.toFixed(2);
        document.getElementById('cardMessage').textContent = msg ? `"${msg}"` : '"Building the legacy 🔥"';
        document.getElementById('shareCardBtn').disabled = false;
        setupPrediction();
    } catch (e) { alert("Failed: " + e.message); }
};

// Share card
document.getElementById('shareCardBtn').onclick = () => {
    document.getElementById('predictionCard').style.display = 'block';
    html2canvas(document.getElementById('predictionCard'), {scale: 2}).then(canvas => {
        document.getElementById('predictionCard').style.display = 'none';
        const link = document.createElement('a');
        link.download = 'rox-prediction.png';
        link.href = canvas.toDataURL();
        link.click();
        window.open(`https://x.com/intent/post?text=${encodeURIComponent("I predicted $ROX at $"+document.getElementById('cardPrice').textContent+"! 3,875 $ROX contest live 🔥\nJoin: https://honey-whisper.github.io/testx-dapp/ #ROXProtocol")}`);
        alert("Card downloaded! Attach to X post 🚀");
    });
};

// Refresh balance
setInterval(() => {
    updateContestBalance();
    if (contract) loadData();
}, 30000);