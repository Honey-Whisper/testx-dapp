const CONTRACT_ADDRESS = "0x45d1c787A0d86AE8d7FEa33412a5d80d86B7445b";
const OWNER = "0xE1330576Dd2254224F046624E05ecA7f51C50001".toLowerCase();
const GROWTH = "0xafee6142bDBb2ea7882Bfc60145E647FdA368A21".toLowerCase();

let provider, signer, contract, user;
let circulatingHistory = []; // Stores circulating supply over time
let lastTxTimestamp = 0;

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletAddress = document.getElementById('walletAddress');

async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        await setupProviderAndContract();
        loadData();
    } catch (e) { alert("Connection failed: " + e.message); }
}

async function setupProviderAndContract() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = (await signer.getAddress()).toLowerCase();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

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

window.addEventListener('load', async () => {
    if (window.ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await setupProviderAndContract();
            loadData();
        }
    }
    initCharts();
});

// ----------------------------
// Load live data
// ----------------------------
async function loadData() {
    if (!contract || !user) return;
    try {
        const d = 18;

        // Presale
        const raised = await contract.totalPresaleRaised();
        const sold = await contract.totalPresaleTokensSold();
        const soldNum = Number(ethers.utils.formatUnits(sold, d));

        document.getElementById('totalRaised').textContent = Number(ethers.utils.formatEther(raised)).toFixed(4);
        document.getElementById('tokensSold').textContent = soldNum.toLocaleString() + ' / 500,000';
        const perc = soldNum / 500000 * 100;
        document.getElementById('presaleBar').style.width = perc + '%';
        document.getElementById('progressText').textContent = perc.toFixed(1) + '%';

        // User presale contribution & balance
        const contrib = await contract.presaleContribution(user);
        document.getElementById('yourContribution').textContent = Number(ethers.utils.formatEther(contrib)).toFixed(4);
        const bal = await contract.balanceOf(user);
        document.getElementById('userBalance').textContent = Number(ethers.utils.formatUnits(bal, d)).toFixed(0);

        // Staking
        const stake = await contract.getUserStake(user);
        document.getElementById('stakedAmount').textContent = Number(ethers.utils.formatUnits(stake.amount, d)).toLocaleString();
        document.getElementById('unlockTime').textContent = stake.unlockTime > 0 ? new Date(stake.unlockTime * 1000).toLocaleDateString() : '—';

        // Pending rewards
        const pending = await contract.calculatePendingRewards(user);
        document.getElementById('pendingRewards').textContent = Number(ethers.utils.formatUnits(pending, d)).toLocaleString();

        // Vested tokens
        const ownerRel = await contract.releasableOwnerVested();
        document.getElementById('ownerReleasable').textContent = Number(ethers.utils.formatUnits(ownerRel, d)).toLocaleString();
        const growthRel = await contract.releasableGrowthVested();
        document.getElementById('growthReleasable').textContent = Number(ethers.utils.formatUnits(growthRel, d)).toLocaleString();

        document.getElementById('claimOwnerBtn').disabled = user !== OWNER;
        document.getElementById('claimGrowthBtn').disabled = user !== GROWTH;

        // Trading & claim presale
        const trading = await contract.tradingEnabled();
        document.getElementById('claimTokensBtn').style.display = contrib.gt(0) && trading ? 'block' : 'none';

        // Anti-bot cooldown
        lastTxTimestamp = Number(await contract.lastTransferTimestamp());
        const now = Math.floor(Date.now()/1000);
        const cooldownSec = Math.max(0, 15 - (now - lastTxTimestamp));
        document.getElementById('unlockTime').textContent = cooldownSec > 0 ? `${cooldownSec}s cooldown` : (stake.unlockTime > 0 ? new Date(stake.unlockTime * 1000).toLocaleDateString() : '—');

        // Circulating supply (total - presale unsold - locked)
        const totalSupply = Number(ethers.utils.formatUnits(await contract.totalSupply(), d));
        const circulating = soldNum + Number(ethers.utils.formatUnits(await contract.totalStaked(), d));
        document.getElementById('circulatingSupply').textContent = circulating.toLocaleString() + ' $TESTX';

        // Update circulating history
        const timestamp = new Date().toLocaleTimeString();
        circulatingHistory.push({ x: timestamp, y: circulating });
        if (circulatingHistory.length > 20) circulatingHistory.shift(); // keep last 20 points

        updateCharts(soldNum, stake.amount, circulatingHistory);
        updateTransparencyPanel(raised, soldNum, circulating);

    } catch(e) { console.error("Load data error:", e); }
}

// ----------------------------
// Charts
// ----------------------------
let presaleChart, stakingChart, circulatingChart;

function initCharts() {
    const ctx1 = document.getElementById('presaleChart').getContext('2d');
    presaleChart = new Chart(ctx1, {
        type: 'bar',
        data: { labels: ['Sold', 'Remaining'], datasets: [{ label: '$TESTX Presale', data: [0, 500000], backgroundColor: ['#FFD700','#FF8C00'] }] },
        options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    });

    const ctx2 = document.getElementById('stakingChart').getContext('2d');
    stakingChart = new Chart(ctx2, {
        type: 'bar',
        data: { labels:['Staked','Remaining'], datasets:[{label:'$TESTX Staked',data:[0,500000],backgroundColor:['#00FF00','#32CD32']}] },
        options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    });

    const ctx3 = document.getElementById('circulatingChart').getContext('2d');
    circulatingChart = new Chart(ctx3, {
        type: 'line',
        data: { datasets:[{label:'Circulating Supply',data:[],borderColor:'#FFD700',backgroundColor:'rgba(255,215,0,0.2)',fill:true}] },
        options: { responsive:true, plugins:{legend:{display:true}}, scales:{x:{type:'time',time:{unit:'second'}},y:{beginAtZero:true}} }
    });
}

function updateCharts(sold, stakedBig, circHistory) {
    // Presale
    presaleChart.data.datasets[0].data = [sold, 500000 - sold];
    presaleChart.update();

    // Staking
    const stakedNum = Number(ethers.utils.formatUnits(stakedBig, 18));
    stakingChart.data.datasets[0].data = [stakedNum, 500000 - stakedNum];
    stakingChart.update();

    // Circulating line chart
    circulatingChart.data.datasets[0].data = circHistory.map(p=>({x:p.x,y:p.y}));
    circulatingChart.update();
}

// ----------------------------
// Transparency panel
// ----------------------------
function updateTransparencyPanel(raised, sold, circulating) {
    document.getElementById('totalRaisedDisplay').textContent = Number(ethers.utils.formatEther(raised)).toFixed(4) + ' ETH';
    document.getElementById('tokensSoldDisplay').textContent = sold.toLocaleString() + ' $TESTX';
    document.getElementById('circulatingDisplay').textContent = circulating.toLocaleString() + ' $TESTX';
}

// ----------------------------
// Navigation buttons
// ----------------------------
document.querySelectorAll('nav button').forEach(b=>{
    b.onclick = ()=>{
        document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
        document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById(b.dataset.section).classList.add('active');
    };
});

// ----------------------------
// Presale input preview
// ----------------------------
document.getElementById('ethAmount').oninput = ()=>{
    const eth = parseFloat(document.getElementById('ethAmount').value) || 0;
    document.getElementById('tokenPreview').textContent = `You'll receive: ${(eth*8000).toFixed(0)} $TESTX`;
};

// ----------------------------
// Button actions
// ----------------------------
document.getElementById('contributeBtn').onclick = async ()=>{
    const eth = parseFloat(document.getElementById('ethAmount').value);
    if(!eth || eth<0.0125 || eth>1.25) return alert('Amount must be 0.0125 - 1.25 ETH');
    try{
        const tx = await signer.sendTransaction({to:CONTRACT_ADDRESS,value:ethers.utils.parseEther(eth.toString())});
        await tx.wait();
        alert('Contributed!');
        document.getElementById('ethAmount').value='';
        document.getElementById('tokenPreview').textContent="You'll receive: 0 $TESTX";
        loadData();
    }catch(e){ alert("Failed: "+e.message);}
};

document.getElementById('claimTokensBtn').onclick = async ()=>{try{const tx=await contract.claimPresaleTokens();await tx.wait();alert("Tokens claimed!");loadData();}catch(e){alert("Failed: "+e.message);}};
document.getElementById('stakeBtn').onclick = async ()=>{
    const amt = parseFloat(document.getElementById('stakeAmount').value);
    if(!amt || amt<=0) return alert("Enter valid amount");
    try{const tx = await contract.stake(ethers.utils.parseUnits(amt.toString(),18)); await tx.wait(); alert("Staked!"); document.getElementById('stakeAmount').value=''; loadData();}catch(e){alert("Failed: "+e.message);}
};
document.getElementById('unstakeBtn').onclick = async ()=>{
    const amt = parseFloat(document.getElementById('stakeAmount').value);
    if(!amt || amt<=0) return alert("Enter valid amount");
    try{const tx = await contract.unstake(ethers.utils.parseUnits(amt.toString(),18)); await tx.wait(); alert("Unstaked!"); document.getElementById('stakeAmount').value=''; loadData();}catch(e){alert("Failed: "+e.message);}
};
document.getElementById('claimRewardsBtn').onclick = async ()=>{try{const tx=await contract.claimRewards();await tx.wait();alert("Rewards claimed!");loadData();}catch(e){alert("Failed: "+e.message);}};
document.getElementById('claimOwnerBtn').onclick = async ()=>{try{const tx=await contract.claimOwnerVested();await tx.wait();alert("Owner vested claimed!");loadData();}catch(e){alert("Failed: "+e.message);}};
document.getElementById('claimGrowthBtn').onclick = async ()=>{try{const tx=await contract.claimGrowthVested();await tx.wait();alert("Growth vested claimed!");loadData();}catch(e){alert("Failed: "+e.message);}};
connectBtn.onclick = connectWallet;
disconnectBtn.onclick = disconnectWallet;

// Auto refresh every 10s
setInterval(()=>{if(user) loadData();},10000);
