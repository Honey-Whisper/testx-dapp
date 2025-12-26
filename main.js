window.addEventListener('load', () => {
    startCountdown(); // countdown.js
    initPrediction(); // prediction.js

    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    connectWallet(); // direct call
                }
            })
            .catch(console.error);
    }

    // Refresh every minute
    setInterval(() => {
        if (typeof loadAllData === 'function') loadAllData();
    }, 60000);
});