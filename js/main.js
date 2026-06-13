const heroContent = document.querySelector(".hero-content");
const heroVideo = document.querySelector(".hero-video");
const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  // Fade hero content as user scrolls
  const fadeAmount = Math.max(1 - scrollY / 500, 0);

  heroContent.style.opacity = fadeAmount;
  heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;

  // Fade video slightly as user scrolls
  heroVideo.style.opacity = Math.max(0.85 - scrollY / 700, 0);

  // Change navbar once scrolling starts
  if (scrollY > 80) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});