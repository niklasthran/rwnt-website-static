document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById('hamburger');
	const navMobile = document.querySelector('.nav-mobile');

	hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
		navMobile.classList.toggle('active');

        document.body.classList.toggle("no-scroll", navMobile.classList.contains('active'));
	});

    navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMobile.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });
});