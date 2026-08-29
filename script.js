// 상단 메뉴 열기/닫기
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-menu');
const menuLabel = menuButton?.querySelector('.sr-only');

function toggleMenu(open) {
  if (!menu || !menuButton || !menuLabel) return;
  menu.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? '메뉴 닫기' : '메뉴 열기';
}

menuButton?.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

// 스크롤하면 고정 헤더 배경을 표시합니다.
function updateHeader() {
  header?.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// 화면에 들어온 요소를 한 번만 부드럽게 표시합니다.
// 움직임 축소 설정이 켜진 환경에서는 애니메이션 없이 바로 표시합니다.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = reducedMotion ? null : new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });

function observeRevealElements(root = document) {
  root.querySelectorAll('.reveal:not([data-reveal-ready])').forEach((element) => {
    element.dataset.revealReady = 'true';
    if (reducedMotion) {
      element.classList.add('is-visible');
    } else {
      revealObserver.observe(element);
    }
  });
}

observeRevealElements();

// products.json의 제품 한 개를 카드 요소로 만듭니다.
function createProductCard(product, index, catalogCard = false) {
  const card = document.createElement('article');
  card.className = catalogCard ? 'catalog-card reveal' : 'product-card reveal';

  const photoLink = document.createElement('a');
  photoLink.className = 'product-photo';
  photoLink.href = product.purchaseUrl;
  photoLink.target = '_blank';
  photoLink.rel = 'noopener noreferrer';
  photoLink.setAttribute('aria-label', `${product.name} 구매하기`);

  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.loading = 'lazy';

  const number = document.createElement('span');
  number.textContent = String(index + 1).padStart(2, '0');
  photoLink.append(image, number);

  const copy = document.createElement('div');
  copy.className = 'product-copy';

  const label = document.createElement('p');
  label.className = 'product-category';
  label.textContent = `PRODUCT ${String(index + 1).padStart(2, '0')}`;

  const name = document.createElement('h3');
  name.textContent = product.name;

  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = product.price;

  const buyLink = document.createElement('a');
  buyLink.className = catalogCard ? 'button product-buy-button' : 'text-link';
  buyLink.href = product.purchaseUrl;
  buyLink.target = '_blank';
  buyLink.rel = 'noopener noreferrer';
  buyLink.innerHTML = '구매하기 <span aria-hidden="true">↗</span>';

  copy.append(label, name, price, buyLink);
  card.append(photoLink, copy);
  return card;
}

// 같은 데이터에서 홈은 대표 3개, 제품 페이지는 전체 제품을 표시합니다.
async function loadProducts() {
  const productLists = document.querySelectorAll('[data-product-list]');
  if (!productLists.length) return;

  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('제품 데이터를 불러오지 못했습니다.');

    const products = await response.json();
    productLists.forEach((list) => {
      const limit = Number(list.dataset.limit) || products.length;
      const visibleProducts = products.slice(0, limit);
      const catalogCard = list.classList.contains('catalog-grid');

      list.replaceChildren();
      visibleProducts.forEach((product, index) => {
        list.appendChild(createProductCard(product, index, catalogCard));
      });
      observeRevealElements(list);
    });
  } catch (error) {
    productLists.forEach((list) => {
      const message = document.createElement('p');
      message.className = 'product-status';
      message.textContent = '제품을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.';
      list.replaceChildren(message);
    });
    console.error(error);
  }
}

loadProducts();

// 날짜를 한국어 사이트 표기에 맞게 정리합니다.
function formatStoryDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value || '';
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

function homeStoryUrl(post) {
  if (post.url) {
    const url = String(post.url);
    if (/^(https?:)?\/\//.test(url) || url.startsWith('/')) return url;
    return `story/${url.replace(/^\.\//, '')}`;
  }
  return `story/post.html?id=${encodeURIComponent(post.id || '')}`;
}

// 홈의 최신 이야기 카드를 만듭니다.
function createHomeStoryCard(post) {
  const article = document.createElement('article');
  article.className = 'home-story-card reveal';

  const link = document.createElement('a');
  link.href = homeStoryUrl(post);

  const time = document.createElement('time');
  time.dateTime = String(post.date || '');
  time.textContent = formatStoryDate(post.date);

  const title = document.createElement('h3');
  title.textContent = String(post.title || '(제목 없음)');

  const summary = document.createElement('p');
  summary.textContent = String(post.summary || '');

  const arrow = document.createElement('span');
  arrow.textContent = '읽어보기 →';

  link.append(time, title, summary, arrow);
  article.appendChild(link);
  return article;
}

// story/posts.json의 최신 글을 홈에 날짜 내림차순으로 표시합니다.
async function loadHomeStories() {
  const storyLists = document.querySelectorAll('[data-story-list]');
  if (!storyLists.length) return;

  try {
    const response = await fetch('story/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('이야기 데이터를 불러오지 못했습니다.');
    const posts = await response.json();
    const sortedPosts = posts.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    storyLists.forEach((list) => {
      const limit = Number(list.dataset.limit) || sortedPosts.length;
      list.replaceChildren();
      sortedPosts.slice(0, limit).forEach((post) => list.appendChild(createHomeStoryCard(post)));
      observeRevealElements(list);
    });
  } catch (error) {
    storyLists.forEach((list) => {
      const message = document.createElement('p');
      message.className = 'story-status';
      message.textContent = '이야기를 불러오지 못했습니다. 잠시 후 다시 확인해주세요.';
      list.replaceChildren(message);
    });
    console.error(error);
  }
}

loadHomeStories();

// 푸터 연도 자동 표시
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

