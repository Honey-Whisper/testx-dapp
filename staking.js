// Staking Contract Functions

const STAKING_ABI = [
    'function stakingEnabled() view returns (bool)',
    'function stakingStartTime() view returns (uint256)',
    'function totalStaked() view returns (uint256)',
    'function MIN_STAKE() view returns (uint256)',
    'function MIN_LOCK_QUARTERS() view returns (uint256)',
    'function QUARTER_DURATION() view returns (uint256)',
    'function quarterlyRewards(uint256) view returns (uint256)',
    'function totalStakedPerQuarter(uint256) view returns (uint256)',
    'function getCurrentQuarter() view returns (uint256)',
    'function stakes(address) view returns (uint256 amount, uint256 startQuarter, uint256 startTime, uint256 lastClaimQuarter, bool isAutoStaked)',
    'function calculateRewards(address) view returns (uint256)',
    'function stake(uint256 amount)',
    'function unstake()',
    'function claimRewards()',
    'function getStakeInfo(address) view returns (uint256 staked, uint256 startQuarter, uint256 currentQuarter, uint256 pendingRewards, bool canUnstakeWithoutPenalty, bool isAutoStaked)',
    'function getQuarterInfo(uint256) view returns (uint256 reward, uint256 totalStakedAmount, uint256 penaltyPool)',
    'event Staked(address indexed user, uint256 amount, uint256 quarter, bool isAutoStaked)',
    'event Unstaked(address indexed user, uint256 amount, uint256 penalty)',
    'event RewardsClaimed(address indexed user, uint256 amount)'
];

class StakingContract {
    constructor(signer) {
        this.contract = new ethers.Contract(
            CONFIG.CONTRACTS.STAKING,
            STAKING_ABI,
            signer
        );
    }

    async isEnabled() {
        try {
            return await this.contract.stakingEnabled();
        } catch (error) {
            console.error('Error checking staking status:', error);
            return false;
        }
    }

    async getStartTime() {
        try {
            return await this.contract.stakingStartTime();
        } catch (error) {
            console.error('Error getting start time:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async getTotalStaked() {
        try {
            return await this.contract.totalStaked();
        } catch (error) {
            console.error('Error getting total staked:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async getCurrentQuarter() {
        try {
            return await this.contract.getCurrentQuarter();
        } catch (error) {
            console.error('Error getting current quarter:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async getQuarterReward(quarter) {
        try {
            return await this.contract.quarterlyRewards(quarter);
        } catch (error) {
            console.error('Error getting quarter reward:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async getQuarterInfo(quarter) {
        try {
            return await this.contract.getQuarterInfo(quarter);
        } catch (error) {
            console.error('Error getting quarter info:', error);
            return { reward: ethers.BigNumber.from(0), totalStakedAmount: ethers.BigNumber.from(0), penaltyPool: ethers.BigNumber.from(0) };
        }
    }

    async getStakeInfo(address) {
        try {
            return await this.contract.getStakeInfo(address);
        } catch (error) {
            console.error('Error getting stake info:', error);
            return { 
                staked: ethers.BigNumber.from(0), 
                startQuarter: ethers.BigNumber.from(0), 
                currentQuarter: ethers.BigNumber.from(0),
                pendingRewards: ethers.BigNumber.from(0),
                canUnstakeWithoutPenalty: false,
                isAutoStaked: false
            };
        }
    }

    async calculateRewards(address) {
        try {
            return await this.contract.calculateRewards(address);
        } catch (error) {
            console.error('Error calculating rewards:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async stake(amount) {
        try {
            const tx = await this.contract.stake(amount);
            return tx;
        } catch (error) {
            console.error('Error staking:', error);
            throw error;
        }
    }

    async unstake() {
        try {
            const tx = await this.contract.unstake();
            return tx;
        } catch (error) {
            console.error('Error unstaking:', error);
            throw error;
        }
    }

    async claimRewards() {
        try {
            const tx = await this.contract.claimRewards();
            return tx;
        } catch (error) {
            console.error('Error claiming rewards:', error);
            throw error;
        }
    }
}

window.StakingContract = StakingContract;