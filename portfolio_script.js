const images = document.querySelectorAll(".clickable");  
const modal = document.querySelector(".modal");
const modalImg = document.querySelector(".modalImg");
const close = document.querySelector(".close");

images.forEach((image) => {
    image.addEventListener("click", () => {
        modalImg.src = image.src;
    
        modal.classList.add("appear");

        close.addEventListener("click", () => {
            modal.classList.remove("appear");
        })
    });
});

// Parallax effect for .bust.no-shadow
const bust = document.querySelector('.bust.no-shadow');
if (bust) {
    window.addEventListener('scroll', function() {
        const scrolled = window.scrollY;
        bust.style.transform = `translateY(${scrolled * 0.3}px)`;
    });
}

// Parallax effect for hand images in about.html
const hand01 = document.querySelector('.hand01.no-shadow');
const hand02 = document.querySelector('.hand02.no-shadow');
const hand03 = document.querySelector('.hand03.no-shadow');

window.addEventListener('scroll', function() {
    const scrolled = window.scrollY;
    if (hand01) hand01.style.transform = `translateY(${scrolled * 0.1}px)`;
    if (hand02) hand02.style.transform = `translateY(${scrolled * 0.1}px)`;
    if (hand03) hand03.style.transform = `translateY(${scrolled * 0.1}px)`;
});