// Vesting Contract Functions

const VESTING_ABI = [
    'function vestingInitialized() view returns (bool)',
    'function beneficiary() view returns (address)',
    'function startTime() view returns (uint256)',
    'function claimed() view returns (uint256)',
    'function TOTAL_ALLOCATION() view returns (uint256)',
    'function INITIAL_RELEASE_PERCENT() view returns (uint256)',
    'function VESTING_DURATION() view returns (uint256)',
    'function calculateVested() view returns (uint256)',
    'function claim()',
    'function getVestingInfo() view returns (uint256 total, uint256 vested, uint256 claimed, uint256 claimable, uint256 startTime, uint256 endTime)',
    'event TokensClaimed(address indexed beneficiary, uint256 amount)'
];

class VestingContract {
    constructor(signer, contractAddress) {
        this.contract = new ethers.Contract(
            contractAddress,
            VESTING_ABI,
            signer
        );
    }

    async isInitialized() {
        try {
            return await this.contract.vestingInitialized();
        } catch (error) {
            console.error('Error checking initialization:', error);
            return false;
        }
    }

    async getBeneficiary() {
        try {
            return await this.contract.beneficiary();
        } catch (error) {
            console.error('Error getting beneficiary:', error);
            return ethers.constants.AddressZero;
        }
    }

    async getInfo() {
        try {
            return await this.contract.getVestingInfo();
        } catch (error) {
            console.error('Error getting vesting info:', error);
            return {
                total: ethers.BigNumber.from(0),
                vested: ethers.BigNumber.from(0),
                claimed: ethers.BigNumber.from(0),
                claimable: ethers.BigNumber.from(0),
                startTime: ethers.BigNumber.from(0),
                endTime: ethers.BigNumber.from(0)
            };
        }
    }

    async calculateVested() {
        try {
            return await this.contract.calculateVested();
        } catch (error) {
            console.error('Error calculating vested:', error);
            return ethers.BigNumber.from(0);
        }
    }

    async claim() {
        try {
            const tx = await this.contract.claim();
            return tx;
        } catch (error) {
            console.error('Error claiming vesting:', error);
            throw error;
        }
    }

    async getClaimed() {
        try {
            return await this.contract.claimed();
        } catch (error) {
            console.error('Error getting claimed amount:', error);
            return ethers.BigNumber.from(0);
        }
    }
}

class TeamVesting extends VestingContract {
    constructor(signer) {
        super(signer, CONFIG.CONTRACTS.TEAM_VESTING);
    }
}

class MarketingVesting extends VestingContract {
    constructor(signer) {
        super(signer, CONFIG.CONTRACTS.MARKETING_VESTING);
    }
}

window.VestingContract = VestingContract;
window.TeamVesting = TeamVesting;
window.MarketingVesting = MarketingVesting;