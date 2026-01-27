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
            alert('Please install MetaMask!');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Accounts:', accounts);
        
        if (accounts.length === 0) {
            alert('No accounts found. Please unlock MetaMask.');
            return;
        }
        
        // Initialize provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        console.log('Connected address:', userAddress);
        
        // Check network
        const network = await provider.getNetwork();
        console.log('Current network chainId:', network.chainId);
        
        // FIXED: use config value (Base Sepolia = 84532)
        const correctChainId = Number(CONFIG.CURRENT_NETWORK.chainId);
        if (network.chainId !== correctChainId) {
            alert(`Please switch to ${CONFIG.CURRENT_NETWORK.chainName}`);
            await switchToCorrectNetwork();
            return;
        }
        
        // Initialize contracts
        initializeContracts();

        // FIXED: feedback if init failed
        if (!stakingContract || !tokenContract || !contributionContract) {
            Utils.showNotification('Failed to initialize contracts. Wrong network or invalid addresses.', 'error');
        }
        
        // Update UI
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        
        console.log('Updating UI...', { connectBtn, walletInfo, walletAddress });
        
        if (connectBtn) {
            connectBtn.style.display = 'none';
            connectBtn.classList.add('hidden');
        }
        if (walletInfo) {
            walletInfo.style.display = 'flex';
            walletInfo.classList.remove('hidden');
        }
        if (walletAddress) {
            walletAddress.textContent = Utils.shortenAddress(userAddress);
        }
        
        // FIXED: enable action buttons after successful connect + chain check
        const buttonIds = ['contributeBtn','approveStakeBtn','stakeBtn','claimRewardsBtn','unstakeBtn','claimTeamBtn','claimMarketingBtn'];
        buttonIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        // FIXED: direct await, no setTimeout
        await loadAllData();
        
        // Listen for changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
        alert('Wallet connected: ' + Utils.shortenAddress(userAddress));
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect: ' + error.message);
    }
}

async function switchToCorrectNetwork() {
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
                Utils.showNotification('Failed to add network', 'error');
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

// FIXED: load key tabs after connect
async function loadAllData() {
    console.log('Loading all data...');
    await loadHomeData();
    await loadContributionData();
    await loadStakingData();
    await loadRewardsData();
    await loadVestingData();
}

async function loadHomeData() {
    console.log('Loading home data...');

    try {
        if (!tokenContract || !stakingContract) {
            console.error('Contracts not initialized');
            // Set safe defaults
            document.getElementById('totalSupply').textContent = '2,500,000';
            document.getElementById('holders').textContent = 'N/A';
            document.getElementById('circulatingSupply').textContent = 'N/A';
            document.getElementById('totalStaked').textContent = 'N/A';
            return;
        }
        
        // Total Supply (hardcoded)
        document.getElementById('totalSupply').textContent = '2,500,000';
        
        // Get total staked - wrapped in try/catch
        try {
            console.log('Getting total staked...');
            const totalStaked = await stakingContract.getTotalStaked();
            console.log('Total staked:', totalStaked.toString());
            
            document.getElementById('totalStaked').textContent = Utils.formatTokenAmount(totalStaked);
            
            // Calculate circulating
            const totalSupply = ethers.utils.parseEther('2500000');
            const circulating = totalSupply.sub(totalStaked);
            document.getElementById('circulatingSupply').textContent = Utils.formatTokenAmount(circulating);
        } catch (err) {
            console.error('Error getting staked data:', err);
            document.getElementById('totalStaked').textContent = 'Error';
            document.getElementById('circulatingSupply').textContent = 'Error';
        }
        
        // ────────────────────────────────────────────────────────────────
        // FIXED: totalHolders is a public variable, not a function
        // ────────────────────────────────────────────────────────────────
        try {
            console.log('Getting holder count...');
            const holderCount = await tokenContract.totalHolders();
            console.log('Holder count:', holderCount.toString());
            document.getElementById('holders').textContent = holderCount.toString();
        } catch (err) {
            console.error('Error getting holder count:', err);
            document.getElementById('holders').textContent = 'N/A';
        }
        
        console.log('Home data loaded successfully');
        
    } catch (error) {
        console.error('Error loading home data:', error);
        document.getElementById('totalSupply').textContent = '2,500,000';
        document.getElementById('holders').textContent = 'N/A';
        document.getElementById('circulatingSupply').textContent = 'Error';
        document.getElementById('totalStaked').textContent = 'Error';
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
        const totalTokens = parseFloat(ethAmount) * CONFIG.TOKEN_CONSTANTS.TOKEN_PRICE;
        const instantTokens = (totalTokens * 0.7).toFixed(2);
        const stakedTokens = (totalTokens * 0.3).toFixed(2);
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Contribution',
            ethAmount: ethAmount,
            instantTokens: instantTokens,
            stakedTokens: stakedTokens,
            totalTokens: totalTokens.toFixed(2),
            from: userAddress
        });
        
        const tx = await contributionContract.contribute(amount);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Contribution',
            ethAmount: ethAmount,
            instantTokens: instantTokens,
            stakedTokens: stakedTokens,
            totalTokens: totalTokens.toFixed(2),
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.CONTRIBUTION,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadContributionData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error contributing:', error);
        if (receiptModal) {
            receiptModal.showError({ action: 'Contribution' }, error.message);
        }
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
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Approve Tokens',
            amount: amount,
            spender: CONFIG.CONTRACTS.STAKING,
            from: userAddress
        });
        
        const tx = await tokenContract.approve(CONFIG.CONTRACTS.STAKING, amountWei);
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Approve Tokens',
            amount: amount,
            spender: CONFIG.CONTRACTS.STAKING,
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.TOKEN,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        document.getElementById('stakeBtn').disabled = false;
        
    } catch (error) {
        console.error('Error approving:', error);
        if (receiptModal) {
            receiptModal.showError({ action: 'Approve Tokens' }, error.message);
        }
    }
}

async function handleStake() {
    try {
        const amount = document.getElementById('stakeAmount')?.value;
        const amountWei = Utils.parseTokenInput(amount);
        
        const currentQuarter = await stakingContract.getCurrentQuarter();
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Stake Tokens',
            amount: amount,
            quarter: currentQuarter.toNumber() + 1,
            lockPeriod: '2 Quarters (180 days)',
            apy: '12-15',
            from: userAddress
        });
        
        const tx = await stakingContract.stake(amountWei);
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Stake Tokens',
            amount: amount,
            quarter: currentQuarter.toNumber() + 1,
            lockPeriod: '2 Quarters (180 days)',
            apy: '12-15',
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.STAKING,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadStakingData();
        document.getElementById('stakeBtn').disabled = true;
        
    } catch (error) {
        console.error('Error staking:', error);
        if (receiptModal) {
            receiptModal.showError({ action: 'Stake Tokens' }, error.message);
        }
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
        const rewards = await stakingContract.calculateRewards(userAddress);
        const rewardsFormatted = Utils.formatTokenAmount(rewards);
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Claim Rewards',
            rewards: rewardsFormatted,
            quarters: 'Q1-Q8',
            from: userAddress
        });
        
        const tx = await stakingContract.claimRewards();
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Claim Rewards',
            rewards: rewardsFormatted,
            quarters: 'Q1-Q8',
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.STAKING,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadRewardsData();
        await loadStakingData();
        
    } catch (error) {
        console.error('Error claiming rewards:', error);
        if (receiptModal) {
            receiptModal.showError({ action: 'Claim Rewards' }, error.message);
        }
    }
}

async function handleUnstake() {
    if (!confirm('Are you sure you want to unstake? Early unstaking incurs a 15% penalty if before 2 quarters.')) {
        return;
    }
    
    try {
        const stakeInfo = await stakingContract.getStakeInfo(userAddress);
        const amount = Utils.formatTokenAmount(stakeInfo.staked);
        const hasPenalty = !stakeInfo.canUnstakeWithoutPenalty;
        const penalty = hasPenalty ? (parseFloat(amount) * 0.15).toFixed(2) : null;
        const netAmount = hasPenalty ? (parseFloat(amount) * 0.85).toFixed(2) : amount;
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Unstake Tokens',
            amount: amount,
            penalty: penalty,
            netAmount: netAmount,
            from: userAddress
        });
        
        const tx = await stakingContract.unstake();
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Unstake Tokens',
            amount: amount,
            penalty: penalty,
            netAmount: netAmount,
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.STAKING,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadStakingData();
        await loadRewardsData();
        
    } catch (error) {
        console.error('Error unstaking:', error);
        if (receiptModal) {
            receiptModal.showError({ action: 'Unstake Tokens' }, error.message);
        }
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
        const teamInfo = await teamVestingContract.getInfo();
        const claimableAmount = Utils.formatTokenAmount(teamInfo.claimable);
        const remainingAmount = Utils.formatTokenAmount(teamInfo.vested.sub(teamInfo.claimed).sub(teamInfo.claimable));
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Claim Vesting',
            vestingType: 'Team Allocation',
            amount: claimableAmount,
            remaining: remainingAmount,
            from: userAddress
        });
        
        const tx = await teamVestingContract.claim();
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Claim Vesting',
            vestingType: 'Team Allocation',
            amount: claimableAmount,
            remaining: remainingAmount,
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.TEAM_VESTING,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadVestingData();
    } catch (error) {
        console.error('Error claiming team vesting:', error);
        if (receiptModal) {
            receiptModal.showError({ 
                action: 'Claim Vesting',
                vestingType: 'Team Allocation'
            }, error.message);
        }
    }
}

async function handleClaimMarketing() {
    try {
        const marketingInfo = await marketingVestingContract.getInfo();
        const claimableAmount = Utils.formatTokenAmount(marketingInfo.claimable);
        const remainingAmount = Utils.formatTokenAmount(marketingInfo.vested.sub(marketingInfo.claimed).sub(marketingInfo.claimable));
        
        // Show receipt with processing state
        window.showReceipt({
            action: 'Claim Vesting',
            vestingType: 'Marketing Allocation',
            amount: claimableAmount,
            remaining: remainingAmount,
            from: userAddress
        });
        
        const tx = await marketingVestingContract.claim();
        const receipt = await tx.wait();
        
        // Update receipt with success
        receiptModal.showSuccess({
            action: 'Claim Vesting',
            vestingType: 'Marketing Allocation',
            amount: claimableAmount,
            remaining: remainingAmount,
            txHash: receipt.transactionHash,
            from: userAddress,
            to: CONFIG.CONTRACTS.MARKETING_VESTING,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
        
        await loadVestingData();
    } catch (error) {
        console.error('Error claiming marketing vesting:', error);
        if (receiptModal) {
            receiptModal.showError({ 
                action: 'Claim Vesting',
                vestingType: 'Marketing Allocation'
            }, error.message);
        }
    }
}