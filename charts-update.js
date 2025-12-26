function updateCharts(sold, stakedBig) {
    if (presaleChart) {
        presaleChart.data.datasets[0].data = [sold, 500000 - sold];
        presaleChart.update();
    }
    if (stakingChart) {
        const stakedNum = Number(ethers.utils.formatUnits(stakedBig, 18));
        stakingChart.data.datasets[0].data = [stakedNum, 500000 - stakedNum];
        stakingChart.update();
    }
}