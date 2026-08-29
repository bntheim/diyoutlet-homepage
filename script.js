// 상단 메뉴 열기/닫기
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-menu');
const menuLabel = menuButton.querySelector('.sr-only');

function toggleMenu(open) {
  menu.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? '메뉴 닫기' : '메뉴 열기';
}

menuButton.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

// 스크롤하면 흰색 고정 헤더로 자연스럽게 전환
function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// 화면에 들어온 요소를 한 번만 부드럽게 표시
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// 푸터 연도 자동 표시
document.querySelector('#year').textContent = new Date().getFullYear();
