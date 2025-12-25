// app.js - Final with Safe Circulating Supply

const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;

const TREASURY = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();
const CAMPAIGN = "0xCa02FbFEF765E3d33c3e0094Ceb5017b1B9c6677".toLowerCase();

const OWNER_VESTED_AMOUNT = ethers.utils.parseUnits("200000", 18); // 8% vested

let provider, signer, contract, user;
let holderCount = 0;
let holderHistory = [];
let holderChart;

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

    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';
    walletAddress.textContent = user.slice(0,6) + '...' + user.slice(-4);
    walletAddress.style.display = 'block';
    document.querySelectorAll('.main-btn').forEach(b => b.disabled = false);
}

function disconnectWallet() {
    provider = signer = contract = user = null;
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
        const vestedUnreleased = OWNER_VESTED_AMOUNT; // Assume full unreleased early

        const totalLocked = contractBal.add(treasuryBal).add(campaignBal).add(vestedUnreleased);
        const safeCirculating = totalSupply.sub(totalLocked);
        const safeNum = Number(ethers.utils.formatUnits(safeCirculating, d)).toLocaleString();

        document.getElementById('circulatingSupply').innerHTML = `
            <p style="font-size:3em; color:#FFD700; margin:10px 0;">${safeNum} $ROX</p>
            <p style="color:#0f0;">Low circulating → High growth potential 🔥</p>
        `;

        document.getElementById('vaultCirculating').textContent = safeNum + ' $ROX';

        // Transparency Vault
        document.getElementById('treasuryBalance').textContent = Number(ethers.utils.formatUnits(treasuryBal, d)).toLocaleString();
        document.getElementById('campaignBalance').textContent = Number(ethers.utils.formatUnits(campaignBal, d)).toLocaleString();
        document.getElementById('contractBalance').textContent = Number(ethers.utils.formatUnits(contractBal, d)).toLocaleString();
        document.getElementById('ownerReleased').textContent = "0"; // Early stage

        // Holders
        await updateHolders();

    } catch (e) { console.error(e); }
}

async function updateHolders() {
    if (!provider || !contract) return;
    try {
        const transfers = await contract.queryFilter(contract.filters.Transfer(), 0, "latest");
        const holders = new Set();
        transfers.forEach(t => {
            if (t.args.to !== ethers.constants.AddressZero) holders.add(t.args.to.toLowerCase());
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
    } catch (e) {
        document.getElementById('holderCount').textContent = "N/A";
    }
}

// Navigation
document.querySelectorAll('nav button').forEach(b => {
    b.onclick = () => {
        document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById(b.dataset.section).classList.add('active');
    };
});

// Presale Preview
document.getElementById('ethAmount').oninput = () => {
    const eth = parseFloat(document.getElementById('ethAmount').value) || 0;
    document.getElementById('tokenPreview').textContent = `You'll receive: ${(eth * 8000).toFixed(0)} $ROX`;
};

// Contribute
document.getElementById('contributeBtn').onclick = async () => {
    const eth = parseFloat(document.getElementById('ethAmount').value);
    if (!eth || eth <= 0) return alert("Enter valid amount");
    try {
        const tx = await signer.sendTransaction({ to: CONTRACT, value: ethers.utils.parseEther(eth.toString()) });
        await tx.wait();
        alert("Contributed!");
        loadData();
    } catch (e) { alert("Failed: " + e.message); }
};

// Stake
document.getElementById('stakeBtn').onclick = async () => {
    const amt = parseFloat(document.getElementById('stakeAmount').value);
    if (!amt || amt <= 0) return alert("Enter amount");
    try {
        const tx = await contract.stake(ethers.utils.parseUnits(amt.toString(), 18));
        await tx.wait();
        alert("Staked!");
        loadData();
    } catch (e) { alert("Failed: " + e.message); }
};

// Claim Rewards
document.getElementById('claimRewardsBtn').onclick = async () => {
    try {
        const tx = await contract.claimRewards();
        await tx.wait();
        alert("Rewards Claimed!");
        loadData();
    } catch (e) { alert("Failed: " + e.message); }
};

connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

window.addEventListener('load', async () => {
    if (window.ethereum && (await ethereum.request({ method: 'eth_accounts' })).length > 0) {
        await setup();
        loadData();
    }
});

setInterval(() => { if (contract) { loadData(); updateHolders(); } }, 30000);
