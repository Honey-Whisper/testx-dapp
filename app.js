let web3;
let tokenContract;
let presaleContract;
let userAddress;

// Charts
let supplyChart;

// Initialize Web3
window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
        initContracts();
        setupSupplyChart();
        setInterval(updateData, 10000); // auto-update every 10s
    } else {
        alert("Please install MetaMask!");
    }
});

async function connectWallet() {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    document.getElementById('walletAddress').innerText = userAddress;
    updateData();
}

// Initialize contracts
function initContracts() {
    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    presaleContract = new web3.eth.Contract(presaleABI, presaleAddress);
}

// Update UI data
async function updateData() {
    try {
        await updateCirculatingSupply();
        await updateTransparencyPanel();
        await updatePresaleProgress();
        await updatePendingRewards();
        await updateCooldown();
    } catch (err) {
        console.error(err);
    }
}

// Circulating supply chart
async function updateCirculatingSupply() {
    const supply = await tokenContract.methods.circulatingSupply().call();
    const decimals = await tokenContract.methods.decimals().call();
    const supplyFormatted = supply / (10 ** decimals);

    const data = supplyChart.data.datasets[0].data;
    const labels = supplyChart.data.labels;

    const now = new Date().toLocaleTimeString();
    labels.push(now);
    data.push(supplyFormatted);

    if (labels.length > 20) {
        labels.shift();
        data.shift();
    }

    supplyChart.update();
}

// Setup Chart.js chart
function setupSupplyChart() {
    const ctx = document.getElementById('supplyChart').getContext('2d');
    supplyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Circulating Supply',
                data: [],
                borderColor: 'rgb(34,197,94)',
                backgroundColor: 'rgba(34,197,94,0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Transparency panel
async function updateTransparencyPanel() {
    const panel = document.getElementById('transparencyPanel');
    panel.innerHTML = '';

    const totalSupply = await tokenContract.methods.totalSupply().call();
    const decimals = await tokenContract.methods.decimals().call();
    const formattedSupply = totalSupply / (10 ** decimals);

    const allocations = [
        { name: 'Airdrop', value: await tokenContract.methods.AIRDROP_ALLOCATION().call() },
        { name: 'Presale', value: await tokenContract.methods.PRESALE_ALLOCATION().call() },
        { name: 'Campaign', value: await tokenContract.methods.CAMPAIGN_ALLOCATION().call() },
        { name: 'Liquidity', value: await tokenContract.methods.LIQUIDITY_ALLOCATION().call() },
        { name: 'Staking Rewards', value: await tokenContract.methods.STAKING_REWARDS().call() }
    ];

    allocations.forEach(a => {
        const val = (a.value / (10 ** decimals)).toLocaleString();
        const li = document.createElement('li');
        li.textContent = `${a.name}: ${val} (${((a.value/totalSupply)*100).toFixed(2)}%)`;
        panel.appendChild(li);
    });
}

// Presale progress
async function updatePresaleProgress() {
    const raised = await presaleContract.methods.totalRaised().call();
    const cap = await presaleContract.methods.presaleCap().call();
    const progress = (raised / cap) * 100;

    document.getElementById('presaleBar').style.width = progress + '%';
    document.getElementById('presaleStats').innerText = `Raised: ${raised} / Cap: ${cap} (${progress.toFixed(2)}%)`;
}

// Pending rewards
async function updatePendingRewards() {
    if (!userAddress) return;
    const rewards = await tokenContract.methods.calculatePendingRewards(userAddress).call();
    const decimals = await tokenContract.methods.decimals().call();
    const formatted = rewards / (10 ** decimals);
    document.getElementById('pendingRewards').innerText = `Pending Rewards: ${formatted}`;
}

// Cooldown
async function updateCooldown() {
    if (!userAddress) return;
    const lastTx = await tokenContract.methods.lastTransferTimestamp(userAddress).call();
    const now = Math.floor(Date.now() / 1000);
    const cooldownSec = Math.max(0, 60 - (now - lastTx)); // example 60s cooldown
    document.getElementById('cooldown').innerText = `Cooldown: ${cooldownSec}s`;
}

// Stake button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stakeBtn').addEventListener('click', async () => {
        if (!userAddress) return alert("Connect wallet first");
        const amount = document.getElementById('stakeAmount').value;
        const decimals = await tokenContract.methods.decimals().call();
        const amountWei = web3.utils.toBN(amount * (10 ** decimals));

        await tokenContract.methods.stake(amountWei).send({ from: userAddress });
        alert('Staked successfully!');
        updateData();
    });

    document.getElementById('claimBtn').addEventListener('click', async () => {
        if (!userAddress) return alert("Connect wallet first");
        await tokenContract.methods.claimRewards().send({ from: userAddress });
        alert('Rewards claimed!');
        updateData();
    });
});
