document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById('hamburger');
	const navMobile = document.querySelector('.nav-mobile');

	hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
		navMobile.classList.toggle('active');
	});

    navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMobile.classList.remove('active');
        });
    });
});