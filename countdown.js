function startCountdown() {
    const end = new Date('2026-01-02T23:59:59Z').getTime();
    setInterval(() => {
        const diff = end - Date.now();
        if (diff <= 0) {
            document.getElementById('countdownTimer').textContent = 'Contest Ended!';
            return;
        }
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdownTimer').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    }, 1000);
}