function formatNumber(val) {
    return Number(ethers.utils.formatUnits(val, decimals)).toLocaleString();
}