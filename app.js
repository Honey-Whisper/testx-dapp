// app.js - Final with Transparency Vault + Holders Growth

const CONTRACT = window.ROX_CONTRACT_ADDRESS;
const ABI = window.ROX_ABI;

const TREASURY = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();
const CAMPAIGN = "0xCa02FbFEF765E3d33c3e0094Ceb5017b1B9c6677".toLowerCase();

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

        const bal = await contract.balanceOf(user);
        document.getElementById('userBalance').textContent = Number(ethers.utils.formatUnits(bal, d)).toFixed(0);

        const stake = await contract.stakes(user);
        document.getElementById('stakedAmount').textContent = Number(ethers.utils.formatUnits(stake.amount, d)).toLocaleString();
        document.getElementById('unlockTime').textContent = stake.unlockTime > 0 ? new Date(stake.unlockTime * 1000).toLocaleDateString() : '—';

        const pending = await contract.calculatePendingRewards(user);
        document.getElementById('pendingRewards').textContent = Number(ethers.utils.formatUnits(pending, d)).toLocaleString();

        const circ = await contract.circulatingSupply();
        document.getElementById('circulatingSupply').textContent = Number(ethers.utils.formatUnits(circ, d)).toLocaleString() + ' $ROX';
        document.getElementById('vaultCirculating').textContent = Number(ethers.utils.formatUnits(circ, d)).toLocaleString() + ' $ROX';

        // Transparency Vault
        const treasuryBal = await contract.balanceOf(TREASURY);
        document.getElementById('treasuryBalance').textContent = Number(ethers.utils.formatUnits(treasuryBal, d)).toLocaleString();

        const campaignBal = await contract.balanceOf(CAMPAIGN);
        document.getElementById('campaignBalance').textContent = Number(ethers.utils.formatUnits(campaignBal, d)).toLocaleString();

        const contractBal = await contract.balanceOf(CONTRACT);
        document.getElementById('contractBalance').textContent = Number(ethers.utils.formatUnits(contractBal, d)).toLocaleString();

        const released = await contract.ownerVestedReleased();
        document.getElementById('ownerReleased').textContent = Number(ethers.utils.formatUnits(released, d)).toLocaleString();

        // Holders Update
        await updateHolders();

    } catch (e) { console.error(e); }
}

async function updateHolders() {
    if (!provider || !contract) return;
    try {
        const transfers = await contract.queryFilter(contract.filters.Transfer(), 0, "latest");
        const holders = new Set();
        transfers.forEach(t => {
            if (t.args.from !== ethers.constants.AddressZero) holders.add(t.args.from.toLowerCase());
            if (t.args.to !== ethers.constants.AddressZero) holders.add(t.args.to.toLowerCase());
        });

        holderCount = holders.size;
        document.getElementById('holderCount').textContent = holderCount.toLocaleString();

        const today = new Date().toISOString().split('T')[0];
        const dayEntry = holderHistory.find(h => h.date === today);
        if (dayEntry) dayEntry.count = holderCount;
        else holderHistory.push({date: today, count: holderCount});

        if (!holderChart) {
            const ctx = document.getElementById('holderGrowthChart').getContext('2d');
            holderChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: holderHistory.map(h => h.date),
                    datasets: [{
                        label: 'Holders',
                        data: holderHistory.map(h => h.count),
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255,215,0,0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        } else {
            holderChart.data.labels = holderHistory.map(h => h.date);
            holderChart.data.datasets[0].data = holderHistory.map(h => h.count);
            holderChart.update();
        }
    } catch (e) {
        document.getElementById('holderCount').textContent = "Error";
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

// Preview
document.getElementById('ethAmount').oninput = () => {
    const eth = parseFloat(document.getElementById('ethAmount').value) || 0;
    document.getElementById('tokenPreview').textContent = `You'll receive: ${(eth * 8000).toFixed(0)} $ROX`;
};

// Contribute
document.getElementById('contributeBtn').onclick = async () => {
    const eth = parseFloat(document.getElementById('ethAmount').value);
    if (!eth || eth <= 0) return alert("Enter valid ETH");
    try {
        const tx = await signer.sendTransaction({ to: CONTRACT, value: ethers.utils.parseEther(eth.toString()) });
        await tx.wait();
        alert("Success!");
        loadData();
    } catch (e) { alert("Failed: " + e.message); }
};

// Stake & Claim
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