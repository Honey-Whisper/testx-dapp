// Configuration File - Update contract addresses here after deployment

// Contract Addresses - BASE SEPOLIA TESTNET
const CONTRACTS = {
    TOKEN: '0x05288F49f52Be5b28f19683B8e632A7955142337',
    STAKING: '0xD028346b0bcB8666A931772Cc445ee7649E7B934',
    CONTRIBUTION: '0x35b18992C7a9236fd8a50a708DBB4fdEF35BEA4c',
    TEAM_VESTING: '0xAc4236b9226b068FD9aE29655326a0D07cAa9F6C',
    MARKETING_VESTING: '0x5DaaEDc98314717A0DC91BbE864c33817e36b130'
};

// Network Configuration
const LINEA_MAINNET = {
    chainId: '0xe708', // 59144 in hex
    chainName: 'Linea Mainnet',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://rpc.linea.build'],
    blockExplorerUrls: ['https://lineascan.build']
};

const LINEA_TESTNET = {
    chainId: '0xe704', // 59140 in hex
    chainName: 'Linea Sepolia Testnet',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.linea.build'],
    blockExplorerUrls: ['https://sepolia.lineascan.build']
};

const BASE_SEPOLIA = {
    chainId: '0x14a32', // FIXED: correct hex for 84532 (was wrong 0x14a34)
    chainName: 'Base Sepolia',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org']
};

// Current Network - CHANGE THIS FOR MAINNET
const CURRENT_NETWORK = BASE_SEPOLIA; // Using Base Sepolia for testing
const EXPLORER_URL = CURRENT_NETWORK.blockExplorerUrls[0];

// Token Constants
const TOKEN_CONSTANTS = {
    MAX_SUPPLY: '2500000',
    MAX_WALLET_PERCENT: 4,
    COOLDOWN_PERIOD: 30,
    TOKEN_PRICE: 1000, // tokens per ETH
    MIN_CONTRIBUTION: 0.01
};

// Staking Constants
const STAKING_CONSTANTS = {
    MIN_STAKE: 100,
    MIN_LOCK_QUARTERS: 2,
    EARLY_PENALTY_PERCENT: 15,
    QUARTER_DURATION_DAYS: 90,
    QUARTERLY_REWARDS: [120000, 120000, 105000, 105000, 90000, 90000, 60000, 60000]
};

// Vesting Constants
const VESTING_CONSTANTS = {
    TEAM_ALLOCATION: 375000,
    MARKETING_ALLOCATION: 250000,
    TGE_PERCENT: 20,
    VESTING_DURATION_MONTHS: 24
};

// Social Links
const SOCIAL_LINKS = {
    TWITTER: 'https://twitter.com/0xErova',
    TELEGRAM: 'https://t.me/elysonprotocol',
    DISCORD: 'https://discord.gg/elyson',
    GITHUB: 'https://github.com/elysonprotocol',
    MEDIUM: 'https://medium.com/@elysonprotocol'
};

// Export configuration
window.CONFIG = {
    CONTRACTS,
    CURRENT_NETWORK,
    EXPLORER_URL,
    TOKEN_CONSTANTS,
    STAKING_CONSTANTS,
    VESTING_CONSTANTS,
    SOCIAL_LINKS
};