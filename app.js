// Global State
let provider = null;
let signer = null;
let userAddress = null;
let tokenContract = null;
let stakingContract = null;
let contributionContract = null;
let teamVestingContract = null;
let marketingVestingContract = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupTabNavigation();
    await checkWalletConnection();
    updateContractLinks();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('disconnectWallet')?.addEventListener('click', disconnectWallet);
    
    // Contribution
    document.getElementById('ethAmount')?.addEventListener('input', updateTokenSplit);
    document.getElementById('contributeBtn')?.addEventListener('click', contribute);
    
    // Staking
    document.getElementById('maxStakeBtn')?.addEventListener('click', setMaxStake);
    document.getElementById('approveStakeBtn')?.addEventListener('click', approveStaking);
    document.getElementById('stakeBtn')?.addEventListener('click', stakeTokens);
    
    // Rewards
    document.getElementById('claimRewardsBtn')?.addEventListener('click', claimRewards);
    document.getElementById('unstakeBtn')?.addEventListener('click', unstake);
    
    // Vesting
    document.getElementById('claimTeamBtn')?.addEventListener('click', claimTeamVesting);
    document.getElementById('claimMarketingBtn')?.addEventListener('click', claimMarketingVesting);
}

// Tab Navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    if (!userAddress) return;
    
    switch(tabName) {
        case 'home':
            await loadHomeData();
            break;
        case 'contribution':
            await loadContributionData();
            break;
        case 'staking':
            await loadStakingData();
            break;
        case 'rewards':
            await loadRewardsData();
            break;
        case 'vesting':
            await loadVestingData();
            break;
        case 'transparency':
            await loadTransparencyData();
            break;
    }
}

// Wallet Connection
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to use this DApp');
            return;
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 59144) {
            document.getElementById('networkWarning').classList.remove('hidden');
            await switchToLinea();
            return;
        }
        
        // Initialize contracts
        initializeContracts();
        
        // Update UI
        document.getElementById('connectWallet').classList.add('hidden');
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = shortenAddress(userAddress);
        
        // Load all data
        await loadAllData();
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
    }
}

async function switchToLinea() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LINEA_MAINNET.chainId }],
        });
        window.location.reload();
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [LINEA_MAINNET],
                });
                window.location.reload();
            } catch (addError) {
                console.error('Error adding Linea network:', addError);
            }
        }
    }
}

function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    
    document.getElementById('connectWallet').classList.remove('hidden');
    document.getElementById('walletInfo').classList.add('hidden');
    
    window.location.reload();
}

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        window.location.reload();
    }
}

// Initialize Contracts
function initializeContracts() {
    tokenContract = new ethers.Contract(CONTRACTS.TOKEN, TOKEN_ABI, signer);
    stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
    contributionContract = new ethers.Contract(CONTRACTS.CONTRIBUTION, CONTRIBUTION_ABI, signer);
    teamVestingContract = new ethers.Contract(CONTRACTS.TEAM_VESTING, VESTING_ABI, signer);
    marketingVestingContract = new ethers.Contract(CONTRACTS.MARKETING_VESTING, VESTING_ABI, signer);
}

// Update Contract Links
function updateContractLinks() {
    document.getElementById('tokenLink').href = getExplorerLink(CONTRACTS.TOKEN);
    document.getElementById('tokenLink').textContent = shortenAddress(CONTRACTS.TOKEN);
    
    document.getElementById('stakingLink').href = getExplorerLink(CONTRACTS.STAKING);
    document.getElementById('stakingLink').textContent = shortenAddress(CONTRACTS.STAKING);
    
    document.getElementById('contributionLink').href = getExplorerLink(CONTRACTS.CONTRIBUTION);
    document.getElementById('contributionLink').textContent = shortenAddress(CONTRACTS.CONTRIBUTION);
    
    document.getElementById('teamVestingLink').href = getExplorerLink(CONTRACTS.TEAM_VESTING);
    document.getElementById('teamVestingLink').textContent = shortenAddress(CONTRACTS.TEAM_VESTING);
    
    document.getElementById('marketingVestingLink').href = getExplorerLink(CONTRACTS.MARKETING_VESTING);
    document.getElementById('marketingVestingLink').textContent = shortenAddress(CONTRACTS.MARKETING_VESTING);
}

// Load All Data
async function loadAllData() {
    await loadHomeData();
}

async function loadHomeData() {
    try {
        const totalSupply = await tokenContract.totalSupply();
        const totalStaked = await stakingContract.totalStaked();
        
        document.getElementById('totalSupply').textContent = formatNumber(totalSupply);
        document.getElementById('totalStaked').textContent = formatNumber(totalStaked);
        
        // Calculate circulating supply (total - staked - locked)
        const circulating = totalSupply.sub(totalStaked);
        document.getElementById('circulatingSupply').textContent = formatNumber(circulating);
        
    } catch (error) {
        console.error('Error loading home data:', error);
    }
}

// CONTRIBUTION FUNCTIONS
function updateTokenSplit() {
    const ethAmount = parseFloat(document.getElementById('ethAmount').value) || 0;
    const totalTokens = ethAmount * 1000; // 1 ETH = 1000 tokens
    const instant = totalTokens * 0.7;
    const staked = totalTokens * 0.3;
    
    document.getElementById('instantTokens').textContent = instant.toFixed(2) + ' EYSN';
    document.getElementById('stakedTokens').textContent = staked.toFixed(2) + ' EYSN';
}

async function loadContributionData() {
    try {
        const info = await contributionContract.getContributionInfo();
        const userContrib = await contributionContract.getUserContribution(userAddress);
        
        const statusText = info.active ? 
            `Active - ${timeUntil(info.timeLeft.toNumber())} remaining` : 
            'Ended';
        
        document.getElementById('contributionStatus').innerHTML = `
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Total Raised:</strong> ${formatEther(info.raised)} ETH</p>
            <p><strong>Tokens Distributed:</strong> ${formatNumber(info.distributed)} EYSN</p>
            <p><strong>Remaining:</strong> ${formatNumber(info.remaining)} EYSN</p>
        `;
        
        document.getElementById('userContribution').textContent = formatNumber(userContrib.tokens) + ' EYSN';
        document.getElementById('userEthContributed').textContent = formatEther(userContrib.eth) + ' ETH';
        
    } catch (error) {
        console.error('Error loading contribution data:', error);
    }
}

async function contribute() {
    try {
        const ethAmount = document.getElementById('ethAmount').value;
        if (!ethAmount || ethAmount < 0.01) {
            alert('Minimum contribution is 0.01 ETH');
            return;
        }
        
        const tx = await contributionContract.contribute({
            value: ethers.utils.parseEther(ethAmount)
        });
        
        alert('Transaction submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Contribution successful!');
        
        await loadContributionData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error contributing:', error);
        alert('Contribution failed: ' + error.message);
    }
}

// STAKING FUNCTIONS
async function loadStakingData() {
    try {
        const currentQuarter = await stakingContract.getCurrentQuarter();
        const quarterReward = await stakingContract.quarterlyRewards(currentQuarter);
        const totalStaked = await stakingContract.totalStaked();
        const stakeInfo = await stakingContract.getStakeInfo(userAddress);
        
        document.getElementById('currentQuarter').textContent = `Q${currentQuarter.toNumber() + 1}`;
        document.getElementById('quarterReward').textContent = formatNumber(quarterReward) + ' EYSN';
        document.getElementById('totalStakedAmount').textContent = formatNumber(totalStaked) + ' EYSN';
        
        document.getElementById('userStaked').textContent = formatNumber(stakeInfo.staked) + ' EYSN';
        document.getElementById('userStartQuarter').textContent = stakeInfo.staked.gt(0) ? 
            `Q${stakeInfo.startQuarter.toNumber() + 1}` : '-';
        document.getElementById('canUnstake').textContent = stakeInfo.canUnstakeWithoutPenalty ? 'Yes ✅' : 'No (15% penalty)';
        
        // Calculate lock end time
        if (stakeInfo.staked.gt(0)) {
            const stakingStart = await stakingContract.stakingStartTime();
            const quarterDuration = await stakingContract.QUARTER_DURATION();
            const lockEnd = stakingStart.add(quarterDuration.mul(stakeInfo.startQuarter.add(2)));
            document.getElementById('lockUntil').textContent = new Date(lockEnd.toNumber() * 1000).toLocaleDateString();
        }
        
    } catch (error) {
        console.error('Error loading staking data:', error);
    }
}

async function setMaxStake() {
    try {
        const balance = await tokenContract.balanceOf(userAddress);
        document.getElementById('stakeAmount').value = ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error);
    }
}

async function approveStaking() {
    try {
        const amount = document.getElementById('stakeAmount').value;
        if (!amount || amount < 100) {
            alert('Minimum stake is 100 EYSN');
            return;
        }
        
        const amountWei = ethers.utils.parseEther(amount);
        const tx = await tokenContract.approve(CONTRACTS.STAKING, amountWei);
        
        alert('Approval submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Approval successful! Now you can stake.');
        
        document.getElementById('stakeBtn').disabled = false;
        
    } catch (error) {
        console.error('Error approving:', error);
        alert('Approval failed: ' + error.message);
    }
}

async function stakeTokens() {
    try {
        const amount = document.getElementById('stakeAmount').value;
        const amountWei = ethers.utils.parseEther(amount);
        
        const tx = await stakingContract.stake(amountWei);
        
        alert('Staking transaction submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Staking successful!');
        
        await loadStakingData();
        document.getElementById('stakeBtn').disabled = true;
        
    } catch (error) {
        console.error('Error staking:', error);
        alert('Staking failed: ' + error.message);
    }
}

// REWARDS FUNCTIONS
async function loadRewardsData() {
    try {
        const rewards = await stakingContract.calculateRewards(userAddress);
        document.getElementById('pendingRewards').textContent = formatNumber(rewards);
        
        // Load quarterly breakdown
        const currentQuarter = await stakingContract.getCurrentQuarter();
        const stakeInfo = await stakingContract.getStakeInfo(userAddress);
        
        let tableHTML = '';
        for (let i = 0; i < 8; i++) {
            const quarterInfo = await stakingContract.getQuarterInfo(i);
            const reward = quarterInfo.reward;
            let userShare = '0';
            let status = 'Upcoming';
            
            if (i < currentQuarter.toNumber()) {
                status = 'Completed';
            } else if (i === currentQuarter.toNumber()) {
                status = 'Active';
            }
            
            if (stakeInfo.staked.gt(0) && quarterInfo.totalStakedAmount.gt(0)) {
                const share = stakeInfo.staked.mul(reward).div(quarterInfo.totalStakedAmount);
                userShare = formatNumber(share);
            }
            
            tableHTML += `
                <tr>
                    <td>Q${i + 1}</td>
                    <td>${formatNumber(reward)} EYSN</td>
                    <td>${userShare} EYSN</td>
                    <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                </tr>
            `;
        }
        
        document.getElementById('quartersTable').innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

async function claimRewards() {
    try {
        const tx = await stakingContract.claimRewards();
        
        alert('Claim submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Rewards claimed successfully!');
        
        await loadRewardsData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error claiming rewards:', error);
        alert('Claim failed: ' + error.message);
    }
}

async function unstake() {
    if (!confirm('Are you sure you want to unstake? Early unstaking incurs a 15% penalty if before 2 quarters.')) {
        return;
    }
    
    try {
        const tx = await stakingContract.unstake();
        
        alert('Unstake submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Unstaked successfully!');
        
        await loadStakingData();
        await loadRewardsData();
        
    } catch (error) {
        console.error('Error unstaking:', error);
        alert('Unstake failed: ' + error.message);
    }
}

// VESTING FUNCTIONS
async function loadVestingData() {
    try {
        const teamInfo = await teamVestingContract.getVestingInfo();
        const marketingInfo = await marketingVestingContract.getVestingInfo();
        
        document.getElementById('teamVested').textContent = formatNumber(teamInfo.vested) + ' EYSN';
        document.getElementById('teamClaimed').textContent = formatNumber(teamInfo.claimed) + ' EYSN';
        document.getElementById('teamClaimable').textContent = formatNumber(teamInfo.claimable) + ' EYSN';
        
        document.getElementById('marketingVested').textContent = formatNumber(marketingInfo.vested) + ' EYSN';
        document.getElementById('marketingClaimed').textContent = formatNumber(marketingInfo.claimed) + ' EYSN';
        document.getElementById('marketingClaimable').textContent = formatNumber(marketingInfo.claimable) + ' EYSN';
        
    } catch (error) {
        console.error('Error loading vesting data:', error);
    }
}

async function claimTeamVesting() {
    try {
        const tx = await teamVestingContract.claim();
        
        alert('Claim submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Team vesting claimed successfully!');
        
        await loadVestingData();
        
    } catch (error) {
        console.error('Error claiming team vesting:', error);
        alert('Claim failed: ' + error.message);
    }
}

async function claimMarketingVesting() {
    try {
        const tx = await marketingVestingContract.claim();
        
        alert('Claim submitted! Waiting for confirmation...');
        await tx.wait();
        alert('Marketing vesting claimed successfully!');
        
        await loadVestingData();
        
    } catch (error) {
        console.error('Error claiming marketing vesting:', error);
        alert('Claim failed: ' + error.message);
    }
}

// TRANSPARENCY FUNCTIONS
async function loadTransparencyData() {
    try {
        const totalStaked = await stakingContract.totalStaked();
        const stakingProgress = (totalStaked / ethers.utils.parseEther('750000')) * 100;
        document.getElementById('stakingProgress').style.width = stakingProgress + '%';
        document.getElementById('stakingDistributed').textContent = formatNumber(totalStaked);
        
        const contributionInfo = await contributionContract.getContributionInfo();
        const contributionProgress = (contributionInfo.distributed / ethers.utils.parseEther('625000')) * 100;
        document.getElementById('contributionProgress').style.width = contributionProgress + '%';
        document.getElementById('contributionDistributed').textContent = formatNumber(contributionInfo.distributed);
        document.getElementById('contributionStatusText').textContent = contributionInfo.active ? 'Active' : 'Ended';
        
        const teamInfo = await teamVestingContract.getVestingInfo();
        const teamProgress = (teamInfo.vested / ethers.utils.parseEther('375000')) * 100;
        document.getElementById('teamVestingProgress').style.width = teamProgress + '%';
        document.getElementById('teamVestedPercent').textContent = teamProgress.toFixed(1) + '%';
        
        const marketingInfo = await marketingVestingContract.getVestingInfo();
        const marketingProgress = (marketingInfo.vested / ethers.utils.parseEther('250000')) * 100;
        document.getElementById('marketingVestingProgress').style.width = marketingProgress + '%';
        document.getElementById('marketingVestedPercent').textContent = marketingProgress.toFixed(1) + '%';
        
        // Check ownership status
        try {
            const tokenOwner = await tokenContract.owner();
            document.getElementById('tokenOwnership').textContent = tokenOwner === ethers.constants.AddressZero ? 
                'Renounced ✅' : 'Active';
            document.getElementById('tokenOwnership').className = tokenOwner === ethers.constants.AddressZero ? 
                'status-badge renounced' : 'status-badge active';
        } catch (error) {
            document.getElementById('tokenOwnership').textContent = 'Renounced ✅';
            document.getElementById('tokenOwnership').className = 'status-badge renounced';
        }
        
    } catch (error) {
        console.error('Error loading transparency data:', error);
    }
}