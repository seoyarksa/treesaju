// utils/tooltip.js
(function installTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // ─────────────────────────────────────────
  // ① 툴팁 엘리먼트 1개 전역 설치
  // ─────────────────────────────────────────
  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  tip.style.cssText = [
    'position:fixed; z-index:2147483647; display:none;',
    'max-width:320px; padding:10px 12px; border-radius:10px;',
    'background:#111; color:#fff; font-size:13px; line-height:1.45;',
    'box-shadow:0 6px 18px rgba(0,0,0,.25);',
    'pointer-events:auto;',
  ].join('');
  document.body.appendChild(tip);

  function hide() {
    tip.style.display = 'none';
    tip.__anchor = null;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function showNear(target, html) {
    tip.innerHTML = html;
    tip.style.display = 'block';

    // 먼저 보이게 한 뒤 측정
    const r = target.getBoundingClientRect();
    const gap = 8;

    // 임시 좌표(좌측 정렬)
    let left = r.left;
    let top  = r.bottom + gap;

    // 뷰포트 기준 보정
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;

    left = clamp(left, 8, vw - tipW - 8);
    // 화면 아래로 넘치면 위로 띄우기
    if (top + tipH + 8 > vh) top = r.top - tipH - gap;

    tip.style.left = Math.round(left) + 'px';
    tip.style.top  = Math.round(top + window.scrollY) + 'px';
    tip.__anchor = target;
  }

  // ─────────────────────────────────────────
  // ② 설명 사전 조회 (TERM_HELP가 없을 수도 있음)
  //    group: 'unseong' | 'tengod' | 'sipsal12' 등
  // ─────────────────────────────────────────
  function getDesc(group, term) {
    const dictAll = window.TERM_HELP || {};
    const dict = dictAll[group] || {};
    const key = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  }

  // ─────────────────────────────────────────
  // ③ 전역 위임: 문서 전체에서 .explainable 클릭 처리
  //    (동적 렌더링 영역도 자동 지원)
  // ─────────────────────────────────────────
  document.addEventListener('click', (e) => {
    // 툴팁 클릭은 무시하지 않고 닫히지 않게
    if (e.target.closest('#term-help-pop')) return;

    const t = e.target.closest('.explainable');
    if (!t) {
      // 앵커가 사라졌거나 외부 클릭이면 닫기
      hide();
      return;
    }

    // 속성 읽기
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent;

    // 제목 라벨
    const from  = (group === 'tengod')
      ? '십신'
      : (group === 'sipsal12' ? '12신살' : '12운성');

    const title = `${from} · ${String(term).trim()}`;
    const body  = getDesc(group, term);

    const html = `
      <div style="font-weight:600; margin-bottom:6px;">${title}</div>
      <div>${body}</div>
    `;
    showNear(t, html);
  }, true);

  // 바깥 클릭/스크롤/리사이즈 시 닫기
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide, true);

  // ─────────────────────────────────────────
  // ④ 전역 API (디버깅/수동 호출용)
  // ─────────────────────────────────────────
  window.TermHelp = {
    showNear,
    hide,
    get isOpen() { return tip.style.display === 'block'; }
  };
})();


//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>