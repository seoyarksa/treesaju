// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: 9999,
    display: 'none',
    maxWidth: '280px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    lineHeight: 1.4,
    boxShadow: '0 6px 18px rgba(0,0,0,.25)',
    pointerEvents: 'auto',
  });
  document.body.appendChild(tip);

  function hide() {
    tip.style.display = 'none';
  }
  function showNear(target, html) {
    tip.innerHTML = html;
    tip.style.display = 'block';
    const r = target.getBoundingClientRect();
    const gap = 8;
    // 먼저 붙인 뒤 치수 읽기
    const width = tip.offsetWidth || 240;
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, r.left));
    const top  = (r.top + window.scrollY) + r.height + gap;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }
  function getDesc(group, term) {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  }

  // ★ 문서 전역 위임: 어떤 영역에 렌더되든 .explainable만 클릭하면 동작
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.explainable');
    if (!t) return; // 키 핸들 등 다른 리스너에 영향 없음
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group === 'tengod') ? '십신' : (group === 'sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);
    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, false);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
  }, false);
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // 전역 API(선택)
  window.showTermHelp = (group, term, anchorEl) => {
    const body = getDesc(group, term);
    showNear(anchorEl || document.body, body);
  };
  window.hideTermHelp = hide;
}



//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>