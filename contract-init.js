let contract, predictionContract, decimals = 18;

function initContracts() {
    contract = new ethers.Contract(ROX_CONTRACT_ADDRESS, window.ROX_ABI, signer);

    const minABI = ["function balanceOf(address) view returns (uint256)"];
    predictionContract = new ethers.Contract(PREDICTION_CONTRACT, minABI, provider);

    contract.decimals().then(d => decimals = d).catch(() => decimals = 18);
}