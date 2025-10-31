// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // 1) 팁 DOM
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    document.body.appendChild(tip);
  }
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: '2147483647',
    display: 'none',
    maxWidth: '320px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    lineHeight: '1.5',
    boxShadow: '0 6px 18px rgba(0,0,0,.25)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
  });

  const hide = () => { tip.style.display = 'none'; };

  // 위치 계산을 requestAnimationFrame에서 수행 (레이아웃 타이밍 보정)
  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    tip.style.left = '0px';
    tip.style.top  = '0px';

    requestAnimationFrame(() => {
      // 강제 리플로우로 크기 확보
      const _ = tip.getBoundingClientRect(); // eslint-disable-line no-unused-vars
      const r = target.getBoundingClientRect();
      const gap = 8;
      const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left));
      const top  = (r.top + window.scrollY) + r.height + gap;
      tip.style.left = left + 'px';
      tip.style.top  = top  + 'px';
      tip.style.visibility = 'visible';
    });
  };

  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  // === 핵심: 같은 클릭에서 hide가 먼저/이후에 실행되어 사라지는 문제 방지 ===
  //  A) 캡처 단계에서 show → 그리고 해당 이벤트는 더 전파되지 않게 즉시 차단
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.explainable');
    if (!t) return;
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);

    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);

    // ✅ 같은 클릭 이벤트가 다른 리스너로 전달되어 hide를 부르지 않도록 즉시 차단
    e.stopImmediatePropagation();
    e.stopPropagation();
  }, true); // capture = true

  //  B) 바깥 클릭으로 닫기 (버블 단계, setTimeout으로 같은 틱 중복 처리 회피)
  document.addEventListener('click', (e) => {
    setTimeout(() => {
      if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
    }, 0);
  });

  //  C) 화면 변경 시 닫기
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  //  D) 포인터 힌트 스타일
  if (!document.getElementById('term-help-style')) {
    const style = document.createElement('style');
    style.id = 'term-help-style';
    style.textContent = `.explainable{cursor:help}`;
    document.head.appendChild(style);
  }

  //  E) 수동 디버그용 헬퍼 (콘솔에서 확인)
  window.__testTip = (text='테스트', group='unseong') => {
    const any = document.querySelector('.explainable');
    const target = any || document.body;
    showNear(target, `<b>${group}</b> · ${text}<br>팁 테스트`);
  };

  console.log('[tooltip] installed');
}
