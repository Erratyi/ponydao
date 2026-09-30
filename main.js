import { authenticateDemoUser, endDemoSession, isDemoSignedIn, islandById, islands, owner, startDemoSession } from './data.js?v=3';

const app = document.querySelector('#app');
let pendingHomeScroll = false;

function brand() {
  return `<a class="brand" href="#/" aria-label="PONY共创，返回首页"><img src="./assets/ponydao.png?v=2" alt="" /><span>PONY<span class="brand-cn">共创</span></span></a>`;
}

function accountMenu() {
  return `<details class="account-menu"><summary aria-label="${owner.name}的账号菜单"><span class="avatar avatar-small" aria-hidden="true">聂</span></summary>
    <div class="account-dropdown"><div class="dropdown-profile"><strong>${owner.name}</strong><span>@${owner.username}</span></div>
      <a href="#/hub" aria-label="个人中心">个人中心</a><a href="#/hub/dao" aria-label="我的共创">我的共创</a><a href="#/account" aria-label="个人信息">个人信息</a><a href="#/" aria-label="退出登录" data-logout>退出登录</a>
    </div></details>`;
}

function publicHeader(active = '') {
  return `<header class="site-header${active === 'home' ? ' home-header' : ''}"><div class="container header-inner">
    ${brand()}
    <nav class="public-nav" aria-label="主导航">
      <a class="${active === 'home' ? 'active' : ''}" href="#/">首页</a>
      <a class="${active === 'dao' ? 'active' : ''}" href="#/dao">探索</a>
      <a href="#/" data-scroll="how">如何共创</a>
      <button type="button" class="nav-text">帮助</button>
    </nav>
    <div class="header-actions">${isDemoSignedIn(sessionStorage) ? accountMenu() : '<a class="login-link" href="#/login">登录</a><a class="button button-small button-outline" href="#/register">注册成为 OPC</a>'}</div>
  </div></header>`;
}

function siteFooter() {
  return `<footer class="site-footer"><div class="container footer-grid">
    <div class="footer-brand">${brand()}<p>为值得做的事，找到一起做的人。</p></div>
    <div class="footer-links"><h3>产品</h3><a href="#/">首页</a><a href="#/dao">共创岛</a><a href="#/" data-scroll="how">如何共创</a></div>
    <div class="footer-links"><h3>资源</h3><span>帮助与常见问题</span><span>术语说明</span><span>共创岛创建指南</span></div>
    <div class="footer-links"><h3>条款与规则</h3><span>服务条款</span><span>隐私政策</span><span>举报与争议处理</span></div>
  </div><div class="container footer-bottom"><span>© 2026 PONY共创</span><span>平台提供协作与信息展示，不承诺收益。</span></div></footer>`;
}

function homePage() {
  const personas = [
    ['01', '技术研发', '硬件、软件、算法与工程实现。'],
    ['02', '产品与设计', '需求定义、产品规划与体验设计。'],
    ['03', '项目交付', '方案实施、现场协作与交付管理。'],
    ['04', '市场与运营', '内容、渠道、销售与用户运营。'],
    ['05', '行业与资源', '产业经验、专业知识与资源连接。'],
    ['06', '组织与共建', '社区、企业或机构参与长期建设。'],
  ];
  const steps = [
    ['01', '浏览共创岛', '了解方向与需求'],
    ['02', '完善能力档案', '说明经验与投入'],
    ['03', '申请参与角色', '与负责人确认匹配'],
    ['04', '参与产品或项目', '按任务协同推进'],
    ['05', '确认贡献', '沉淀成果与记录'],
  ];
  return `${publicHeader('home')}<main>
    <section class="home-hero"><div class="container hero-content">
      <h1>聚人成岛，<span>共事成真</span></h1>
      <p>为值得做的事，找到一起做的人</p>
      <div class="hero-actions"><a class="button button-primary" href="#/dao">浏览共创岛 <span aria-hidden="true">↗</span></a><a class="button button-quiet" href="#/" data-scroll="how">了解如何共创 <span aria-hidden="true">→</span></a></div>
    </div></section>
    <section class="home-section participation" id="participation"><div class="container">
      <div class="section-intro"><span class="section-kicker">参与方式 / HOW TO JOIN</span><h2>带着你的能力，<br />加入一座共创岛。</h2><p>无论擅长研发、设计、交付还是资源连接，都能找到参与的位置。</p></div>
      <div class="persona-grid">${personas.map(([n, title, copy]) => `<article class="persona-card"><span>${n}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div>
    </div></section>

    <section class="home-section how-section" id="how"><div class="container">
      <div class="section-intro"><span class="section-kicker">如何共创 / THE JOURNEY</span><h2>从发现彼此，<br />到完成贡献。</h2><p>沿着清晰的路径相遇、协作，并留下共同完成的成果。</p></div>
      <ol class="steps">${steps.map(([n, title, copy]) => `<li><span class="step-no">${n}</span><div><strong>${title}</strong><small>${copy}</small></div></li>`).join('')}</ol>
    </div></section>

    <section class="home-action"><div class="container home-action-inner"><div><span class="section-kicker">LET'S CO-CREATE</span><h2>下一座岛，等你加入。</h2><p>从一座真实的共创岛开始，认识一起做事的人。</p></div><div class="action-buttons"><a class="button button-light" href="#/dao">浏览共创岛</a><a class="button button-ghost-light" href="#/register">注册成为 OPC</a></div></div></section>
  </main>${siteFooter()}`;
}

function islandCover(island, className = '') {
  return `<div class="island-cover island-cover-${island.theme} ${className}"><img src="${island.logo}" alt="${island.name} Logo" /></div>`;
}

function islandCard(island) {
  return `<article class="island-card" data-island-search="${[island.name, island.product, ...island.projects].join(' ').toLowerCase()}">
    ${islandCover(island)}
    <div class="island-card-body"><div class="card-eyebrow"><span>共创岛</span><span>${String(island.projects.length).padStart(2, '0')} 个项目</span></div>
      <h2>${island.name}</h2><p>产品：${island.product}</p>
      <div class="card-meta"><span>岛主 · ${owner.name}</span><a href="#/dao/${island.id}" aria-label="查看${island.name}详情">查看详情 <span aria-hidden="true">↗</span></a></div>
    </div></article>`;
}

function explorePage() {
  return `${publicHeader('dao')}<main class="explore-page"><div class="container">
    <div class="explore-heading"><span class="section-kicker">DISCOVER / 共创岛</span><h1>发现共创岛</h1><p>从真实的产品与项目出发，找到值得一起推进的方向。</p></div>
    <div class="explore-search"><label for="island-search" class="sr-only">搜索共创岛、产品或项目</label><span aria-hidden="true">⌕</span><input id="island-search" type="search" placeholder="搜索共创岛、产品或项目" autocomplete="off" /><button type="button" data-search-trigger>搜索</button></div>
    <div class="explore-results-heading"><span>共创岛 <strong id="result-count">03</strong></span><span>按岛屿浏览</span></div>
    <div class="island-grid" id="island-results">${islands.map(islandCard).join('')}</div>
    <p class="search-empty" id="search-empty" hidden>没有找到相关共创岛，请尝试其他关键词。</p>
  </div></main>${siteFooter()}`;
}

function detailPage(island) {
  if (!island) return notFoundPage();
  return `${publicHeader('dao')}<main class="detail-page">
    <div class="container"><div class="breadcrumb"><a href="#/dao">发现共创岛</a><span>/</span><span>${island.name}</span></div>
      <section class="detail-hero"><div class="detail-hero-copy"><span class="section-kicker">DAO</span><h1>${island.name}</h1><p>以产品和项目为载体，汇聚伙伴，共同推进。</p><div class="detail-owner"><span class="avatar avatar-small">聂</span><span>岛主 · ${owner.name}</span></div><div class="detail-hero-actions"><button type="button" class="button button-primary">申请加入共创岛 <span aria-hidden="true">↗</span></button><a class="button button-outline" href="#/dao">返回发现页</a></div></div>${islandCover(island, 'detail-logo-panel')}</section>
      <nav class="detail-tabs" aria-label="共创岛详情分区"><button type="button" data-detail-target="overview" class="selected">概览</button><button type="button" data-detail-target="products">产品</button><button type="button" data-detail-target="projects">项目</button><span>伙伴</span><span>共创规则</span></nav>
      <div class="detail-grid"><div class="detail-main">
        <section class="detail-section" id="overview"><div class="block-heading"><span>01 / OVERVIEW</span><h2>共创岛概览</h2></div><p class="overview-copy">${island.name}围绕 <strong>${island.product}</strong> 展开产品共创，并推进 ${island.projects.map((project) => `<strong>${project}</strong>`).join('、')}。</p><div class="overview-facts"><div><small>产品</small><strong>1 个</strong></div><div><small>项目</small><strong>${island.projects.length} 个</strong></div><div><small>岛主</small><strong>${owner.name}</strong></div></div></section>
        <section class="detail-section" id="products"><div class="block-heading"><span>02 / PRODUCTS</span><h2>产品</h2><p>以研发协作为主，由研发 OPC 参与。</p></div><div class="entity-row"><div class="entity-number">01</div><div><span class="entity-type">产品</span><h3>${island.product}</h3></div><span class="entity-arrow">↗</span></div></section>
        <section class="detail-section" id="projects"><div class="block-heading"><span>03 / PROJECTS</span><h2>项目</h2><p>以落地交付为主，由交付 OPC 参与。</p></div>${island.projects.map((project, index) => `<div class="entity-row"><div class="entity-number">${String(index + 1).padStart(2, '0')}</div><div><span class="entity-type">项目</span><h3>${project}</h3></div><span class="entity-arrow">↗</span></div>`).join('')}</section>
      </div><aside class="detail-aside"><div class="aside-panel"><span class="section-kicker">DAO OWNER</span><div class="owner-inline"><span class="avatar">聂</span><div><strong>${owner.name}</strong><small>共创岛岛主</small></div></div><p>产品与项目在同一座共创岛内协同推进。</p></div><div class="aside-panel aside-structure"><span class="section-kicker">组织结构</span><div><strong>岛主</strong><span>${owner.name}</span></div><div><strong>研发负责人</strong><span>—</span></div><div><strong>研发 OPC</strong><span>—</span></div><div><strong>交付负责人</strong><span>—</span></div><div><strong>交付 OPC</strong><span>—</span></div></div></aside></div>
    </div></main>${siteFooter()}`;
}

function authPage(mode) {
  const login = mode === 'login';
  return `<main class="auth-page"><div class="auth-frame"><div class="auth-brand-panel"><div class="auth-brand">${brand()}</div><div class="auth-brand-center"><span class="section-kicker">PONYDAO</span><h1>${login ? '继续推进，<br />你的共创。' : '从这里开始，<br />一起共创。'}</h1><p>聚人成岛，共事成真。</p></div></div>
    <div class="auth-form-panel"><div class="auth-form-wrap"><span class="section-kicker">${login ? 'WELCOME BACK' : 'JOIN PONY'}</span><h2>${login ? '登录' : '注册账号'}</h2><p>${login ? '使用你的账号继续访问个人中心。' : '填写基础信息，建立你的 OPC 账号。'}</p>
    <form id="${login ? 'login-form' : 'register-form'}" novalidate>
      ${login ? `<label for="identity">用户名或邮箱</label><input id="identity" name="identity" autocomplete="username" placeholder="用户名或邮箱" />
        <label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="输入密码" />
        <div class="form-between"><label class="check"><input type="checkbox" /> 记住我</label><button type="button" class="inline-button">忘记密码？</button></div>` : `<label for="reg-name">用户名</label><input id="reg-name" name="name" autocomplete="username" placeholder="设置用户名" />
        <label for="reg-email">邮箱</label><input id="reg-email" name="email" type="email" autocomplete="email" placeholder="输入邮箱" />
        <label for="reg-password">密码</label><input id="reg-password" name="password" type="password" autocomplete="new-password" placeholder="设置密码" />
        <label for="reg-code">邀请码</label><input id="reg-code" name="code" placeholder="输入邀请码" />`}
      ${login ? '<p class="auth-error" id="login-error" role="alert" hidden></p>' : ''}
      <button class="button button-primary auth-submit" type="${login ? 'submit' : 'button'}">${login ? '登录' : '注册'}</button>
    </form><div class="auth-switch">${login ? '还没有账号？ <a href="#/register">立即注册</a>' : '已经有账号？ <a href="#/login">返回登录</a>'}</div></div></div></div></main>`;
}

function appHeader() {
  return `<header class="workspace-top"><div class="workspace-top-inner">${brand()}<div class="workspace-user"><button class="workspace-notification" type="button" aria-label="通知，演示占位"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z"/><path d="M10 21h4"/></svg></button><span class="workspace-user-name">${owner.name}</span><span class="avatar workspace-user-avatar" aria-hidden="true">聂</span></div></div></header>`;
}

function sidebar(active) {
  const items = [
    ['hub', '个人概览', '#/hub'],
    ['mine', '我的共创', '#/hub/dao'],
    ['contribution', '贡献记录', null],
    ['rights', '收益与分账', null],
    ['profile', '能力档案', null],
    ['account', '个人信息', '#/account'],
  ];
  return `<aside class="sidebar"><div class="sidebar-profile"><span class="avatar avatar-large">聂</span><strong>${owner.name}</strong><small>@${owner.username}</small></div><nav aria-label="个人中心导航">${items.map(([id, label, href]) => href ? `<a href="${href}" class="${active === id ? 'active' : ''}">${label}<span aria-hidden="true">${active === id ? '→' : ''}</span></a>` : `<button type="button">${label}</button>`).join('')}</nav><a href="#/" class="sidebar-exit" data-logout>退出登录 <span aria-hidden="true">↗</span></a></aside>`;
}

function appShell(active, content) {
  return `<div class="app-shell">${appHeader()}<div class="app-body">${sidebar(active)}<main class="workspace-main">${content}</main></div></div>`;
}

function miniIsland(island) {
  return `<a class="mini-island" href="#/dao/${island.id}">${islandCover(island, 'mini-island-cover')}<div><small>岛主 · ${owner.name}</small><strong>${island.name}</strong><span>${island.product}</span></div><span class="mini-arrow" aria-hidden="true">↗</span></a>`;
}

function hubPage() {
  return appShell('hub', `<div class="workspace-heading"><span class="section-kicker">PERSONAL HUB / 个人中心</span><h1>你好，${owner.name}。</h1><p>这里汇总你参与的共创岛与相关内容。</p></div>
    <div class="stat-row"><div><span>我的共创</span><strong>03 <small>座</small></strong></div><div><span>产品</span><strong>03 <small>项</small></strong></div><div><span>项目</span><strong>05 <small>项</small></strong></div></div>
    <section class="dashboard-panel"><div class="panel-heading"><div><span class="section-kicker">MY DAOs</span><h2>我的共创</h2></div><a href="#/hub/dao">查看全部 <span aria-hidden="true">↗</span></a></div><div class="mini-island-list">${islands.map(miniIsland).join('')}</div></section>
    <div class="dashboard-bottom"><section class="dashboard-panel quiet-panel"><div class="panel-heading"><div><span class="section-kicker">CONTRIBUTION</span><h2>贡献记录</h2></div></div><div class="framework-lines"><span></span><span></span><span></span></div></section><section class="dashboard-panel quiet-panel"><div class="panel-heading"><div><span class="section-kicker">EQUITY</span><h2>收益与分账</h2></div></div><div class="framework-lines"><span></span><span></span><span></span></div></section></div>`);
}

function managePage() {
  return appShell('mine', `<div class="workspace-heading manage-heading"><div><span class="section-kicker">MY DAOs</span><h1>我的共创</h1><p>你创建和参与的共创岛，都在这里。</p></div><div class="heading-actions"><button type="button" class="button button-outline">创建共创岛</button><a class="button button-primary" href="#/dao">加入共创岛</a></div></div>
    <section class="manage-list"><div class="manage-list-head"><span>共创岛</span><span>内容</span><span>操作</span></div>${islands.map((island) => `<article class="manage-row"><div class="manage-island">${islandCover(island, 'manage-logo')}<div><span class="owner-tag">岛主</span><h2>${island.name}</h2><p>${island.product}</p></div></div><div class="manage-counts"><span>产品 <strong>01</strong></span><span>项目 <strong>${String(island.projects.length).padStart(2, '0')}</strong></span></div><a class="row-view" href="#/dao/${island.id}">查看 <span aria-hidden="true">↗</span></a></article>`).join('')}</section>`);
}

function accountPage() {
  return appShell('account', `<div class="workspace-heading"><span class="section-kicker">ACCOUNT / 个人信息</span><h1>个人信息</h1><p>你的基本资料与账号信息。</p></div>
    <div class="account-grid"><section class="account-person"><span class="avatar account-avatar">聂</span><h2>${owner.name}</h2><span>@${owner.username}</span><button type="button" class="button button-outline">更换头像</button></section>
    <section class="account-details"><div class="panel-heading"><div><span class="section-kicker">BASIC INFORMATION</span><h2>基本信息</h2></div></div><div class="account-field"><span>姓名</span><strong>${owner.name}</strong></div><div class="account-field"><span>用户名</span><strong>${owner.username}</strong></div><div class="account-field"><span>电子邮箱</span><strong>${owner.email}</strong></div><div class="account-detail-actions"><button type="button" class="button button-primary">编辑个人信息</button></div></section></div>`);
}

function notFoundPage() {
  return `${publicHeader()}<main class="not-found"><h1>页面未找到</h1><a class="button button-primary" href="#/">返回首页</a></main>${siteFooter()}`;
}

function currentRoute() {
  const raw = decodeURIComponent(location.hash.slice(1) || '/');
  return raw.startsWith('/') ? raw : '/';
}

function render() {
  const route = currentRoute();
  if (route === '/') app.innerHTML = homePage();
  else if (route === '/dao') app.innerHTML = explorePage();
  else if (route.startsWith('/dao/')) app.innerHTML = detailPage(islandById[route.split('/')[2]]);
  else if (route === '/login') app.innerHTML = authPage('login');
  else if (route === '/register') app.innerHTML = authPage('register');
  else if (route === '/hub') app.innerHTML = hubPage();
  else if (route === '/hub/dao') app.innerHTML = managePage();
  else if (route === '/account') app.innerHTML = accountPage();
  else app.innerHTML = notFoundPage();
  document.title = `${pageTitle(route)} | PONY共创`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  updateHomeHeader();
  if (route === '/' && pendingHomeScroll) {
    pendingHomeScroll = false;
    requestAnimationFrame(() => document.querySelector('#how')?.scrollIntoView());
  }
}

function updateHomeHeader() {
  const header = document.querySelector('.home-header');
  const hero = document.querySelector('.home-hero');
  if (!header || !hero) return;
  header.classList.toggle('is-scrolled', window.scrollY >= hero.offsetHeight - header.offsetHeight);
}

function pageTitle(route) {
  if (route.startsWith('/dao/')) return islandById[route.split('/')[2]]?.name || '页面未找到';
  const titles = {'/': '首页', '/dao': '发现共创岛', '/login': '登录', '/register': '注册', '/hub': '个人中心', '/hub/dao': '我的共创', '/account': '个人信息'};
  return titles[route] || '页面未找到';
}

document.addEventListener('click', (event) => {
  const logoutLink = event.target.closest('[data-logout]');
  if (logoutLink) {
    event.preventDefault();
    endDemoSession(sessionStorage);
    if (currentRoute() === '/') render();
    else location.hash = '#/';
    return;
  }
  const detailTab = event.target.closest('[data-detail-target]');
  if (detailTab) {
    document.querySelectorAll('[data-detail-target]').forEach((tab) => tab.classList.toggle('selected', tab === detailTab));
    document.getElementById(detailTab.dataset.detailTarget)?.scrollIntoView({behavior: 'smooth'});
    return;
  }
  const scrollLink = event.target.closest('[data-scroll="how"]');
  if (!scrollLink) return;
  if (currentRoute() === '/') {
    event.preventDefault();
    document.querySelector('#how')?.scrollIntoView({behavior: 'smooth'});
  } else {
    pendingHomeScroll = true;
  }
});

document.addEventListener('click', (event) => {
  const openMenu = document.querySelector('.account-menu[open]');
  if (openMenu && !openMenu.contains(event.target)) openMenu.open = false;
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openMenu = document.querySelector('.account-menu[open]');
  if (!openMenu) return;
  openMenu.open = false;
  openMenu.querySelector('summary').focus();
});

document.addEventListener('input', (event) => {
  if (event.target.id !== 'island-search') return;
  const query = event.target.value.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('[data-island-search]').forEach((card) => {
    card.hidden = !card.dataset.islandSearch.includes(query);
    if (!card.hidden) visible += 1;
  });
  document.querySelector('#result-count').textContent = String(visible).padStart(2, '0');
  document.querySelector('#search-empty').hidden = visible !== 0;
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  const identity = event.target.elements.identity.value;
  const password = event.target.elements.password.value;
  if (authenticateDemoUser(identity, password)) {
    startDemoSession(sessionStorage);
    location.hash = '#/hub';
    return;
  }
  const error = document.querySelector('#login-error');
  error.textContent = identity.trim() && password ? '账号或密码不正确' : '请输入用户名或邮箱和密码';
  error.hidden = false;
});

window.addEventListener('hashchange', render);
window.addEventListener('scroll', updateHomeHeader, { passive: true });
render();
