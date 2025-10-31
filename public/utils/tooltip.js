// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // 1) .tooltip 구조로 팝업 1개 준비
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    tip.className = 'tooltip';            // ✅ 기존 CSS(.tooltip) 사용
    tip.setAttribute('role', 'tooltip');

    // 화살표가 있는 CSS를 쓰는 경우
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';

    const inner = document.createElement('div');
    inner.className = 'tooltip-inner';

    tip.appendChild(arrow);
    tip.appendChild(inner);
    document.body.appendChild(tip);
  }

  const inner = tip.querySelector('.tooltip-inner');

  const hide = () => {
    tip.style.display = 'none';
    tip.classList.remove('show'); // Bootstrap류 CSS 호환
  };

  const showNear = (target, html) => {
    inner.innerHTML = html;
    tip.style.display = 'block';
    tip.classList.add('show');

    const r = target.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left));
    const top  = (r.top + window.scrollY) + r.height + gap;

    tip.style.position = 'absolute'; // 기존 .tooltip CSS와 충돌 없게
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  };

  const dictFor = (group) => (window.TERM_HELP && window.TERM_HELP[group]) || {};
  const descOf = (group, term) => {
    const d = dictFor(group);
    const key = String(term || '').trim();
    return d[key] || '설명이 아직 없습니다.';
  };

  // 2) 전역 델리게이트 (캡처 안 씀: 키 이벤트 충돌 방지)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.explainable');
    if (!t) return;
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = descOf(group, term);
    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  });

  // 3) 외부 클릭/스크롤/리사이즈 → 숨김
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
  });
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);
}

// 렌더 후 재바인딩용: 별다른 바인딩은 필요 없지만, 존재 체크 겸 제공
export function attachExistingTooltip() {
  // no-op: .explainable은 클릭 시 전역 핸들러가 처리
}
