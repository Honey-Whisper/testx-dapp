window.addEventListener('load', () => {
    startCountdown();
    initPrediction();

    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => accounts.length > 0 && connectWallet());
    }

    setInterval(() => contract && loadAllData(), 60000);
});