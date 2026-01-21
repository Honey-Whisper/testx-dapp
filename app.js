// Main DApp Coordinator - Updated for modular structure

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
    console.log('DApp initializing...');
    setupEventListeners();
    setupTabNavigation();
    updateContractLinks();
    await checkWalletConnection();
});

// Setup Event Listeners
function setupEventListeners() {
    const connectBtn = document.getElementById('connectWallet');
    const disconnectBtn = document.getElementById('disconnectWallet');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
    }
    
    // Contribution
    const ethAmountInput = document.getElementById('ethAmount');
    if (ethAmountInput) {
        ethAmountInput.addEventListener('input', updateTokenSplit);
    }
    
    const contributeBtn = document.getElementById('contributeBtn');
    if (contributeBtn) {
        contributeBtn.addEventListener('click', handleContribute);
    }
    
    // Staking
    const maxStakeBtn = document.getElementById('maxStakeBtn');
    if (maxStakeBtn) {
        maxStakeBtn.addEventListener('click', setMaxStake);
    }
    
    const approveStakeBtn = document.getElementById('approveStakeBtn');
    if (approveStakeBtn) {
        approveStakeBtn.addEventListener('click', handleApproveStaking);
    }
    
    const stakeBtn = document.getElementById('stakeBtn');
    if (stakeBtn) {
        stakeBtn.addEventListener('click', handleStake);
    }
    
    // Rewards
    const claimRewardsBtn = document.getElementById('claimRewardsBtn');
    if (claimRewardsBtn) {
        claimRewardsBtn.addEventListener('click', handleClaimRewards);
    }
    
    const unstakeBtn = document.getElementById('unstakeBtn');
    if (unstakeBtn) {
        unstakeBtn.addEventListener('click', handleUnstake);
    }
    
    // Vesting
    const claimTeamBtn = document.getElementById('claimTeamBtn');
    if (claimTeamBtn) {
        claimTeamBtn.addEventListener('click', handleClaimTeam);
    }
    
    const claimMarketingBtn = document.getElementById('claimMarketingBtn');
    if (claimMarketingBtn) {
        claimMarketingBtn.addEventListener('click', handleClaimMarketing);
    }
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
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const activeContent = document.getElementById(tabName);
    if (activeContent) activeContent.classList.add('active');
    
    if (userAddress) {
        loadTabData(tabName);
    }
}

async function loadTabData(tabName) {
    console.log('Loading tab data:', tabName);
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
    console.log('Connecting wallet...');
    
    try {
        if (typeof window.ethereum === 'undefined') {
            Utils.showNotification('Please install MetaMask to use this DApp', 'error');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Accounts:', accounts);
        
        // Initialize provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        console.log('Connected address:', userAddress);
        
        // Check network
        const network = await provider.getNetwork();
        console.log('Current network:', network.chainId);
        
        // Allow both testnet (59140) and mainnet (59144)
        const isLinea = network.chainId === 59144 || network.chainId === 59140;
        
        if (!isLinea) {
            document.getElementById('networkWarning')?.classList.remove('hidden');
            await switchToLinea();
            return;
        } else {
            document.getElementById('networkWarning')?.classList.add('hidden');
        }
        
        // Initialize contracts
        initializeContracts();
        
        // Update UI
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        
        if (connectBtn) connectBtn.classList.add('hidden');
        if (walletInfo) walletInfo.classList.remove('hidden');
        if (walletAddress) walletAddress.textContent = Utils.shortenAddress(userAddress);
        
        // Load all data
        await loadAllData();
        
        // Listen for changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
        Utils.showNotification('Wallet connected successfully!', 'success');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        Utils.showNotification('Failed to connect wallet: ' + error.message, 'error');
    }
}

async function switchToLinea() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.CURRENT_NETWORK.chainId }],
        });
        window.location.reload();
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [CONFIG.CURRENT_NETWORK],
                });
                window.location.reload();
            } catch (addError) {
                console.error('Error adding network:', addError);
                Utils.showNotification('Failed to add Linea network', 'error');
            }
        }
    }
}

function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    
    document.getElementById('connectWallet')?.classList.remove('hidden');
    document.getElementById('walletInfo')?.classList.add('hidden');
    
    window.location.reload();
}

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet:', error);
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
    console.log('Initializing contracts...');
    try {
        tokenContract = new TokenContract(signer);
        stakingContract = new StakingContract(signer);
        contributionContract = new ContributionContract(signer);
        teamVestingContract = new TeamVesting(signer);
        marketingVestingContract = new MarketingVesting(signer);
        console.log('Contracts initialized');
    } catch (error) {
        console.error('Error initializing contracts:', error);
    }
}

// Update Contract Links
function updateContractLinks() {
    const links = [
        { id: 'tokenLink', address: CONFIG.CONTRACTS.TOKEN },
        { id: 'stakingLink', address: CONFIG.CONTRACTS.STAKING },
        { id: 'contributionLink', address: CONFIG.CONTRACTS.CONTRIBUTION },
        { id: 'teamVestingLink', address: CONFIG.CONTRACTS.TEAM_VESTING },
        { id: 'marketingVestingLink', address: CONFIG.CONTRACTS.MARKETING_VESTING }
    ];
    
    links.forEach(({ id, address }) => {
        const element = document.getElementById(id);
        if (element) {
            element.href = Utils.getExplorerLink(address);
            element.textContent = Utils.shortenAddress(address);
        }
    });
}

// Load All Data
async function loadAllData() {
    console.log('Loading all data...');
    await loadHomeData();
}

async function loadHomeData() {
    try {
        if (!tokenContract || !stakingContract) return;
        
        const totalSupply = await tokenContract.getTotalSupply();
        const totalStaked = await stakingContract.getTotalStaked();
        
        const totalSupplyEl = document.getElementById('totalSupply');
        const totalStakedEl = document.getElementById('totalStaked');
        const circulatingSupplyEl = document.getElementById('circulatingSupply');
        
        if (totalSupplyEl) {
            totalSupplyEl.textContent = Utils.formatTokenAmount(totalSupply);
        }
        
        if (totalStakedEl) {
            totalStakedEl.textContent = Utils.formatTokenAmount(totalStaked);
        }
        
        if (circulatingSupplyEl) {
            const circulating = totalSupply.sub(totalStaked);
            circulatingSupplyEl.textContent = Utils.formatTokenAmount(circulating);
        }
        
    } catch (error) {
        console.error('Error loading home data:', error);
    }
}

// CONTRIBUTION FUNCTIONS
function updateTokenSplit() {
    const ethAmount = parseFloat(document.getElementById('ethAmount')?.value) || 0;
    const totalTokens = ethAmount * CONFIG.TOKEN_CONSTANTS.TOKEN_PRICE;
    const instant = totalTokens * 0.7;
    const staked = totalTokens * 0.3;
    
    const instantEl = document.getElementById('instantTokens');
    const stakedEl = document.getElementById('stakedTokens');
    
    if (instantEl) instantEl.textContent = instant.toFixed(2) + ' EYSN';
    if (stakedEl) stakedEl.textContent = staked.toFixed(2) + ' EYSN';
}

async function loadContributionData() {
    try {
        if (!contributionContract) return;
        
        const info = await contributionContract.getInfo();
        const userContrib = await contributionContract.getUserContribution(userAddress);
        
        const statusEl = document.getElementById('contributionStatus');
        if (statusEl) {
            const statusText = info.active ? 
                `Active - ${Utils.getTimeRemaining(info.timeLeft.toNumber())} remaining` : 
                'Ended';
            
            statusEl.innerHTML = `
                <p><strong>Status:</strong> ${statusText}</p>
                <p><strong>Total Raised:</strong> ${Utils.formatEthAmount(info.raised)} ETH</p>
                <p><strong>Tokens Distributed:</strong> ${Utils.formatTokenAmount(info.distributed)} EYSN</p>
                <p><strong>Remaining:</strong> ${Utils.formatTokenAmount(info.remaining)} EYSN</p>
            `;
        }
        
        const userContribEl = document.getElementById('userContribution');
        const userEthEl = document.getElementById('userEthContributed');
        
        if (userContribEl) userContribEl.textContent = Utils.formatTokenAmount(userContrib.tokens) + ' EYSN';
        if (userEthEl) userEthEl.textContent = Utils.formatEthAmount(userContrib.eth) + ' ETH';
        
    } catch (error) {
        console.error('Error loading contribution data:', error);
    }
}

async function handleContribute() {
    try {
        const ethAmountInput = document.getElementById('ethAmount');
        if (!ethAmountInput) return;
        
        const ethAmount = ethAmountInput.value;
        const validation = Utils.validateEthAmount(ethAmount, CONFIG.TOKEN_CONSTANTS.MIN_CONTRIBUTION);
        
        if (!validation.valid) {
            Utils.showNotification(validation.error, 'error');
            return;
        }
        
        const amount = Utils.parseEthInput(ethAmount);
        const tx = await contributionContract.contribute(amount);
        await Utils.waitForTransaction(tx, 'Contribution successful!');
        
        await loadContributionData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error contributing:', error);
        Utils.showNotification('Contribution failed: ' + error.message, 'error');
    }
}

// STAKING FUNCTIONS
async function loadStakingData() {
    try {
        if (!stakingContract) return;
        
        const currentQuarter = await stakingContract.getCurrentQuarter();
        const quarterReward = await stakingContract.getQuarterReward(currentQuarter);
        const totalStaked = await stakingContract.getTotalStaked();
        const stakeInfo = await stakingContract.getStakeInfo(userAddress);
        
        document.getElementById('currentQuarter').textContent = `Q${currentQuarter.toNumber() + 1}`;
        document.getElementById('quarterReward').textContent = Utils.formatTokenAmount(quarterReward) + ' EYSN';
        document.getElementById('totalStakedAmount').textContent = Utils.formatTokenAmount(totalStaked) + ' EYSN';
        
        document.getElementById('userStaked').textContent = Utils.formatTokenAmount(stakeInfo.staked) + ' EYSN';
        document.getElementById('userStartQuarter').textContent = stakeInfo.staked.gt(0) ? 
            `Q${stakeInfo.startQuarter.toNumber() + 1}` : '-';
        document.getElementById('canUnstake').textContent = stakeInfo.canUnstakeWithoutPenalty ? 'Yes ✅' : 'No (15% penalty)';
        
    } catch (error) {
        console.error('Error loading staking data:', error);
    }
}

async function setMaxStake() {
    try {
        if (!tokenContract) return;
        const balance = await tokenContract.getBalance(userAddress);
        document.getElementById('stakeAmount').value = ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error);
    }
}

async function handleApproveStaking() {
    try {
        const amount = document.getElementById('stakeAmount')?.value;
        const validation = Utils.validateTokenAmount(amount, CONFIG.STAKING_CONSTANTS.MIN_STAKE);
        
        if (!validation.valid) {
            Utils.showNotification(validation.error, 'error');
            return;
        }
        
        const amountWei = Utils.parseTokenInput(amount);
        const tx = await tokenContract.approve(CONFIG.CONTRACTS.STAKING, amountWei);
        await Utils.waitForTransaction(tx, 'Approval successful! Now you can stake.');
        
        document.getElementById('stakeBtn').disabled = false;
        
    } catch (error) {
        console.error('Error approving:', error);
        Utils.showNotification('Approval failed: ' + error.message, 'error');
    }
}

async function handleStake() {
    try {
        const amount = document.getElementById('stakeAmount')?.value;
        const amountWei = Utils.parseTokenInput(amount);
        
        const tx = await stakingContract.stake(amountWei);
        await Utils.waitForTransaction(tx, 'Staking successful!');
        
        await loadStakingData();
        document.getElementById('stakeBtn').disabled = true;
        
    } catch (error) {
        console.error('Error staking:', error);
        Utils.showNotification('Staking failed: ' + error.message, 'error');
    }
}

// REWARDS FUNCTIONS
async function loadRewardsData() {
    try {
        if (!stakingContract) return;
        
        const rewards = await stakingContract.calculateRewards(userAddress);
        document.getElementById('pendingRewards').textContent = Utils.formatTokenAmount(rewards);
        
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

async function handleClaimRewards() {
    try {
        const tx = await stakingContract.claimRewards();
        await Utils.waitForTransaction(tx, 'Rewards claimed successfully!');
        
        await loadRewardsData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error claiming rewards:', error);
        Utils.showNotification('Claim failed: ' + error.message, 'error');
    }
}

async function handleUnstake() {
    if (!confirm('Are you sure you want to unstake? Early unstaking incurs a 15% penalty if before 2 quarters.')) {
        return;
    }
    
    try {
        const tx = await stakingContract.unstake();
        await Utils.waitForTransaction(tx, 'Unstaked successfully!');
        
        await loadStakingData();
        await loadRewardsData();
        
    } catch (error) {
        console.error('Error unstaking:', error);
        Utils.showNotification('Unstake failed: ' + error.message, 'error');
    }
}

// VESTING FUNCTIONS
async function loadVestingData() {
    try {
        if (!teamVestingContract || !marketingVestingContract) return;
        
        const teamInfo = await teamVestingContract.getInfo();
        const marketingInfo = await marketingVestingContract.getInfo();
        
        document.getElementById('teamVested').textContent = Utils.formatTokenAmount(teamInfo.vested) + ' EYSN';
        document.getElementById('teamClaimed').textContent = Utils.formatTokenAmount(teamInfo.claimed) + ' EYSN';
        document.getElementById('teamClaimable').textContent = Utils.formatTokenAmount(teamInfo.claimable) + ' EYSN';
        
        document.getElementById('marketingVested').textContent = Utils.formatTokenAmount(marketingInfo.vested) + ' EYSN';
        document.getElementById('marketingClaimed').textContent = Utils.formatTokenAmount(marketingInfo.claimed) + ' EYSN';
        document.getElementById('marketingClaimable').textContent = Utils.formatTokenAmount(marketingInfo.claimable) + ' EYSN';
        
    } catch (error) {
        console.error('Error loading vesting data:', error);
    }
}

async function handleClaimTeam() {
    try {
        const tx = await teamVestingContract.claim();
        await Utils.waitForTransaction(tx, 'Team vesting claimed successfully!');
        await loadVestingData();
    } catch (error) {
        console.error('Error claiming team vesting:', error);
        Utils.showNotification('Claim failed: ' + error.message, 'error');
    }
}

async function handleClaimMarketing() {
    try {
        const tx = await marketingVestingContract.claim();
        await Utils.waitForTransaction(tx, 'Marketing vesting claimed successfully!');
        await loadVestingData();
    } catch (error) {
        console.error('Error claiming marketing vesting:', error);
        Utils.showNotification('Claim failed: ' + error.message, 'error');
    }
}

// TRANSPARENCY FUNCTIONS
async function loadTransparencyData() {
    try {
        if (!stakingContract || !contributionContract) return;
        
        const totalStaked = await stakingContract.getTotalStaked();
        const stakingProgress = Utils.calculatePercentage(totalStaked, ethers.utils.parseEther('750000'));
        Utils.updateProgressBar('stakingProgress', stakingProgress);
        document.getElementById('stakingDistributed').textContent =