// nav-switch.js
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            // Hide all sections and deactivate all buttons
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

            const sectionId = btn.getAttribute('data-section');
            const section = document.getElementById(sectionId);

            if (section) {
                section.classList.add('active');
                btn.classList.add('active');

                // Special load functions for specific tabs
                switch (sectionId) {
                    case 'airdrop':
                        if (window.loadAirdropData) {
                            loadAirdropData();
                        }
                        break;
                    case 'legacyvault':
                        // Add any legacy vault specific load if needed
                        break;
                    case 'transparency':
                        if (window.loadTransparencyData) loadTransparencyData();
                        break;
                    // Add other tabs if they have load functions
                    default:
                        // Do nothing for tabs without special load
                        break;
                }
            }
        });
    });

    // Default: Show Presale on load
    const presaleSection = document.getElementById('presale');
    const presaleBtn = document.querySelector('nav button[data-section="presale"]');
    if (presaleSection && presaleBtn) {
        presaleSection.classList.add('active');
        presaleBtn.classList.add('active');
    }
});