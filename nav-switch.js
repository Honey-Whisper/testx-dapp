document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            const sectionId = btn.getAttribute('data-section');
            document.getElementById(sectionId)?.classList.add('active');
            btn.classList.add('active');
        });
    });
    document.getElementById('presale')?.classList.add('active');
    document.querySelector('nav button[data-section="presale"]')?.classList.add('active');
});