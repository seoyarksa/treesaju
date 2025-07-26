export function renderDangryeongShik(
  dangryeong,
  positionChunganList,
  positionJijiList,
  chunganList,
  jijiSibganList
) {
  const container = document.getElementById('dangryeongshik-container');
  if (!container) {
    console.error("#dangryeongshik-container 요소가 없습니다.");
    return;
  }
  container.innerHTML = ''; // 초기화

  // 제목
  const title = document.createElement('h3');
  title.textContent = `당령: ${dangryeong}`;
  container.appendChild(title);

  // --- 천간 기신 행 ---
  const topGisinRow = document.createElement('div');
  topGisinRow.style.display = 'flex';
  topGisinRow.style.justifyContent = 'center';
  topGisinRow.style.marginBottom = '4px';
  topGisinRow.appendChild(createLabel('天기신'));

  for (let pos = 1; pos <= 5; pos++) {
    const posData = positionChunganList[pos] || { heesin: [], gisin: [] };
    const firstGisin = posData.gisin?.[0] || '';
    if (firstGisin && chunganList.includes(firstGisin)) {
      topGisinRow.appendChild(createSpan({ char: firstGisin }, true));
    } else {
      topGisinRow.appendChild(createSpan({ char: '' }, false));
    }
  }
  container.appendChild(topGisinRow);

  // --- 천간 희신 행 ---
  const topHeesinRow = document.createElement('div');
  topHeesinRow.style.display = 'flex';
  topHeesinRow.style.justifyContent = 'center';
  topHeesinRow.style.marginBottom = '2px';
  topHeesinRow.appendChild(createLabel('天희신'));

  for (let pos = 1; pos <= 5; pos++) {
    const posData = positionChunganList[pos] || { heesin: [], gisin: [] };
    const firstHeesin = posData.heesin?.[0] || '';
    if (firstHeesin && chunganList.includes(firstHeesin)) {
      topHeesinRow.appendChild(createSpan({ char: firstHeesin }, true));
    } else {
      topHeesinRow.appendChild(createSpan({ char: '' }, false));
    }
  }
  container.appendChild(topHeesinRow);

  // --- 당령식 전체 조합 행 ---
  const midRow = document.createElement('div');
  midRow.style.display = 'flex';
  midRow.style.justifyContent = 'center';
  midRow.style.marginBottom = '6px';
  midRow.style.border = '2px solid #7ab8ff';
  midRow.style.backgroundColor = '#e0f7ff';
  midRow.style.padding = '6px 10px';
  midRow.style.borderRadius = '6px';
  midRow.appendChild(createLabel('當令式'));

  for (let pos = 1; pos <= 5; pos++) {
    const posData = positionChunganList[pos] || { heesin: [], gisin: [] };
    const charCombo = [...posData.heesin, ...posData.gisin].join('');
    midRow.appendChild(createSpan({ char: charCombo }, true));
  }
  container.appendChild(midRow);

  // --- 지지 희신 행 ---
  const bottomHeesinRow = document.createElement('div');
  bottomHeesinRow.style.display = 'flex';
  bottomHeesinRow.style.justifyContent = 'center';
  bottomHeesinRow.appendChild(createLabel('地희신'));

  for (let pos = 1; pos <= 5; pos++) {
    const posData = positionJijiList[pos] || { heesin: [], gisin: [] };
    const firstHeesin = posData.heesin?.[0] || '';
    if (firstHeesin && jijiSibganList.includes(firstHeesin)) {
      bottomHeesinRow.appendChild(createSpan({ char: firstHeesin }, true));
    } else {
      bottomHeesinRow.appendChild(createSpan({ char: '' }, false));
    }
  }
  container.appendChild(bottomHeesinRow);

  // --- 지지 기신 행 ---
  const bottomGisinRow = document.createElement('div');
  bottomGisinRow.style.display = 'flex';
  bottomGisinRow.style.justifyContent = 'center';
  bottomGisinRow.appendChild(createLabel('地기신'));

  for (let pos = 1; pos <= 5; pos++) {
    const posData = positionJijiList[pos] || { heesin: [], gisin: [] };
    const firstGisin = posData.gisin?.[0] || '';
    if (firstGisin && jijiSibganList.includes(firstGisin)) {
      bottomGisinRow.appendChild(createSpan({ char: firstGisin }, true));
    } else {
      bottomGisinRow.appendChild(createSpan({ char: '' }, false));
    }
  }
  container.appendChild(bottomGisinRow);
}



// 기신 2줄 생성
function renderGisinRows(container, labelText, mapped, compareList, rowCount, considerWrap = false) {
  const renderedSet = new Set();

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';

    if (rowIndex === 0) {
      row.style.marginBottom = '4px';
      row.appendChild(createLabel(labelText));
    } else {
      const emptyLabel = document.createElement('span');
      emptyLabel.style.width = '50px';
      emptyLabel.style.marginRight = '10px';
      row.appendChild(emptyLabel);
    }

    mapped.forEach(item => {
      let gisinChar = '';
      let shouldRender = false;
      let position = '';

      if (rowIndex === 0 && item.isGisinChungan) {
        gisinChar = item.gisinList?.[0] || '';
        shouldRender = gisinChar && compareList.includes(gisinChar);
        position = '천간기준';
        console.log(`[DEBUG][地기신 검사0][${position}] gisinChar=${gisinChar} 포함=${shouldRender}`);
      } else if (rowIndex === 1 && item.isGisinJiji) {
        gisinChar = item.gisinList?.[1] || '';
        shouldRender = gisinChar && compareList.includes(gisinChar);
        position = '지지기준';
        console.log(`[DEBUG][地기신 검사1][${position}] gisinChar=${gisinChar} 포함=${shouldRender}`);
      }

      if (!shouldRender) {
        row.appendChild(createSpan({ char: '' }, false));
        return;
      }

      const key = `${gisinChar}_${rowIndex}_${position}`;
      if (!renderedSet.has(key)) {
        renderedSet.add(key);
        const wrap = considerWrap ? item.wrapInParens : false;
        row.appendChild(createSpan({ char: gisinChar }, true, wrap));
      } else {
        row.appendChild(createSpan({ char: '' }, false));
      }
    });

    container.appendChild(row);
  }
}





export function createMappedArray(
  elements,
  dangryeongShikArray,
  chunganList,
  jijiSibganList,
  firstHeesin,
  dangryeong,
  gisinMap
) {
  return elements.map(el => {
    const char = el.char;

    const isHeesinChungan = chunganList.includes(char);
    const isHeesinJiji = jijiSibganList.includes(char);

    const key = `${dangryeong}|${char}`;
    const gisinListForChar = gisinMap[key] || [];

    const isGisinChungan = gisinListForChar.some(gisinChar => chunganList.includes(gisinChar));
    const isGisinJiji = gisinListForChar.some(gisinChar => jijiSibganList.includes(gisinChar));
    const isGisin = isGisinChungan || isGisinJiji;

    console.log("✅ [createMappedArray]");
    console.log("char:", char);
    console.log("  ⤷ highlightChungan:", isHeesinChungan, "| highlightJiji:", isHeesinJiji);
    console.log("  ⤷ gisinList:", gisinListForChar);
    console.log("  ⤷ isGisin:", isGisin, "| isGisinChungan:", isGisinChungan, "| isGisinJiji:", isGisinJiji);

    return {
      char,
      gisinList: gisinListForChar,
      highlightChungan: isHeesinChungan,
      highlightJiji: isHeesinJiji,
      isDangryeong: char === dangryeong,
      isFirstHeesin: char === firstHeesin,
      isGisin,
      isGisinChungan,
      isGisinJiji,
      wrapInParens: el.wrapInParens || false
    };
  });
}






//sajuUtils.js


export function getDangryeongPositionChunganList(dangryeong, sajuChungan, sajuJiji, jijiToSibganMap) {
  if (!HEESIN_GISIN_COMBINED[dangryeong]) {
    console.warn(`알 수 없는 당령: ${dangryeong}`);
    return null;
  }

  // 사주 지지 → 십간 리스트 변환
  const jijiSibganList = sajuJiji.flatMap(jiji => {
    const sibgans = jijiToSibganMap[jiji] || [];
    return sibgans.map(item => (typeof item === 'string' ? item : item.char));
  });

  // 사주 전체 십간 리스트 (중복 제거)
  const allSibganSet = new Set([...sajuChungan, ...jijiSibganList]);

  // 자리별 희신+기신 배열에서 실제 사주에 존재하는 천간만 필터링
  const result = {};

  for (let position = 1; position <= 5; position++) {
    const combinedList = HEESIN_GISIN_COMBINED[dangryeong][position] || [];
    const filtered = combinedList.filter(char => allSibganSet.has(char));
    result[position] = filtered;
  }

  return result;  // { 1: [...], 2: [...], 3: [...], 4: [...], 5: [...] }
}


export function getDangryeongPosition(dangryeong, chungan) {
  const shikArray = DANGRYEONGSHIK_MAP[dangryeong];
  if (!shikArray) return null; // 당령이 없으면 null 반환

  const index = shikArray.indexOf(chungan);
  return index >= 0 ? index + 1 : null; // 1-based 위치 반환, 없으면 null
}





// 사주에서 실제 존재하는 천간 + 지지 속 십간을 모두 추출하여 배열 반환
export function extractAllSibgan(sajuChungan, sajuJiji, jijiToSibganMap) {
  const jijiSibgans = sajuJiji.flatMap(jiji => {
    const sibgans = jijiToSibganMap[jiji] || [];
    return sibgans.map(item => typeof item === 'string' ? item : item.char);
  });

  const allSibgan = [...sajuChungan, ...jijiSibgans];

  console.log("🧾 extractAllSibgan 결과:");
  console.log("천간:", sajuChungan);
  console.log("지지 십간:", jijiSibgans);
  console.log("전체 십간:", allSibgan);

  return allSibgan;
}



// sajuUtils.js
export function filterPositionListBySaju(positionList, sajuList) {
  const result = {};
  for (let pos = 1; pos <= 5; pos++) {
    const arr = positionList[pos] || [];
    result[pos] = arr.filter(char => sajuList.includes(char));
  }
  return result;
}


export function makeDangryeongPositionList(dangryeong) {
  const rawList = DANGRYEONGSHIK_MAP[dangryeong];
  const result = {};
  for (let i = 0; i < 5; i++) {
    result[i + 1] = [rawList[i]];
  }
  return result;
}

export function buildPositionChunganList(
  dangryeong,
  heesin,
  gisin,
  sajuChungan,
  sajuJiji
) {
  const baseList = makeDangryeongPositionList(dangryeong);

  // 희신 중 사주에 존재하는 것만 추출 (천간/지지별)
  const heesinInChungan = heesin.filter(h => sajuChungan.includes(h));
  const heesinInJiji = heesin.filter(h => sajuJiji.includes(h));
  const gisinInChungan = gisin.filter(g => sajuChungan.includes(g));
  const gisinInJiji = gisin.filter(g => sajuJiji.includes(g));

  const positionChunganList = {};

  for (let pos = 1; pos <= 5; pos++) {
    const char = baseList[pos][0]; // 당령식 해당 자리 글자

    const list = [];

    if (heesinInChungan.includes(char)) {
      list.push(char); // 희신은 첫 번째 (빨간색)
    }
    if (gisinInChungan.includes(char)) {
      list.push(char); // 기신은 두 번째부터 (검정)
    }

    if (heesinInJiji.includes(char)) {
      list.push(char);
    }
    if (gisinInJiji.includes(char)) {
      list.push(char);
    }

    positionChunganList[pos] = list;
  }

  return positionChunganList;
}



/**
 * 지지 기반 당령식 자리별 희신/기신 목록 생성
 * @param {string} dangryeong - 당령 글자
 * @param {string[]} jijiSibganList - 사주 지지 지장간 목록 (중복제거된)
 * @param {Object} heesin - HEESIN_BY_DANGRYEONG_POSITION[dangryeong]
 * @param {Object} gisin - GISIN_BY_DANGRYEONG_POSITION[dangryeong]
 * @returns {Object} {1: [...], 2: [...], ...} 자리별 희신(첫째), 기신(나머지) 배열
 */
export function buildPositionJijiList(dangryeong, jijiSibganList, heesin, gisin) {
  const positionJijiList = {};

  for (let pos = 1; pos <= 5; pos++) {
    const posHeesin = heesin[pos];
    const posGisinList = gisin[pos] || [];

    // 사주 지장간 목록에 포함된 희신만 사용
    const filteredHeesin = jijiSibganList.includes(posHeesin) ? [posHeesin] : [];

    // 사주 지장간 목록에 포함된 기신만 사용
    const filteredGisin = posGisinList.filter(ch => jijiSibganList.includes(ch));

    positionJijiList[pos] = [...filteredHeesin, ...filteredGisin];
  }

  return positionJijiList;
}




export function buildPositionLayout(items, size = 5) {
  const layout = Array(size).fill(""); // ["", "", "", "", ""]
  items.forEach((item, idx) => {
    if (idx < size) layout[idx] = item;
  });
  return layout;
}


export function getDangryeongPositionJijiList(dangryeong, jijiSibganList) {
  // 당령식 자리별 지지 후보 리스트를 만듭니다.
  // 당령식 맵에서 자리별 지지 글자를 추출한 후,
  // jijiSibganList에 포함된 글자만 필터링하여 반환

  const baseJijiList = DANGRYEONGSHIK_MAP[dangryeong]; // 당령식 5글자 배열 (보통 천간 기준)
  if (!baseJijiList) return {};

  const positionJijiList = {};
  for (let i = 0; i < baseJijiList.length; i++) {
    const pos = i + 1;
    const char = baseJijiList[i];
    // jijiSibganList에 있으면 포함, 아니면 빈 배열
    positionJijiList[pos] = jijiSibganList.includes(char) ? [char] : [];
  }
  return positionJijiList;
}



//app.js


function doRender() {
  const container = document.getElementById("result");
  if (!container) {
    console.error("#result 요소가 존재하지 않습니다.");
    return;
  }

  // 1. 당령별 천간 후보 리스트 뽑기
  const positionChunganList = getDangryeongPositionChunganList(
    dangryeong,
    sajuChungan,
    sajuJiji,
    jijiToSibganMap
  );

  // 2. 사주팔자 천간, 지지 리스트 뽑기
  const allSibgan = extractAllSibgan(sajuChungan, sajuJiji, jijiToSibganMap);
  const chunganList = [...new Set(sajuChungan)];
  const jijiSibganList = [...new Set(allSibgan.filter(char => !sajuChungan.includes(char)))];

  // 3. 지지 후보 리스트 뽑기
  const positionJijiList = getDangryeongPositionJijiList(
    dangryeong,
    jijiSibganList
  );

  // 4. 사주에 존재하는 당령별 천간, 지지 리스트 필터링 (자리별)
  const positionChunganFiltered = filterPositionListBySaju(positionChunganList, chunganList);
  const positionJijiFiltered = filterPositionListBySaju(positionJijiList, jijiSibganList);

  // 5. 희신과 기신 리스트 추출을 위한 준비
  // 예시로 사주 천간 첫 번째를 넘긴다고 가정
const dangryeongPosition = getDangryeongPosition(dangryeong, sajuChungan[0]);

  console.log('dangryeongPosition:', dangryeongPosition);
  const heesinList = HEESIN_BY_DANGRYEONG_POSITION[dangryeongPosition] || [];
  const gisinList = GISIN_BY_DANGRYEONG_POSITION[dangryeongPosition] || [];
  console.log('heesinList:', heesinList);
  console.log('gisinList:', gisinList);

  // 6. 자리별 희신/기신 리스트 생성 (객체 형태 {1:[], 2:[], ... 5:[]})
  const chunganHeesinList = {};
  const chunganGisinList = {};
  const jijiHeesinList = {};
  const jijiGisinList = {};

  for (let pos = 1; pos <= 5; pos++) {
    const chunganArr = positionChunganFiltered[pos] || [];
    const jijiArr = positionJijiFiltered[pos] || [];

    chunganHeesinList[pos] = chunganArr.filter(c => heesinList.includes(c));
    chunganGisinList[pos] = chunganArr.filter(c => gisinList.includes(c));
    jijiHeesinList[pos] = jijiArr.filter(c => heesinList.includes(c));
    jijiGisinList[pos] = jijiArr.filter(c => gisinList.includes(c));
  }

  // 7. 자리별 희신/기신을 다시 {heesin:[], gisin:[]} 구조로 병합
  const positionChunganCombined = {};
  const positionJijiCombined = {};

  for(let pos = 1; pos <= 5; pos++) {
    positionChunganCombined[pos] = {
      heesin: chunganHeesinList[pos] || [],
      gisin: chunganGisinList[pos] || []
    };
    positionJijiCombined[pos] = {
      heesin: jijiHeesinList[pos] || [],
      gisin: jijiGisinList[pos] || []
    };
  }

  // 8. 렌더링 호출
  renderDangryeongShik(
    dangryeong,
    positionChunganCombined,
    positionJijiCombined,
    chunganList,
    jijiSibganList
  );
}

// 실행 트리거
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", doRender);
} else {
  setTimeout(doRender, 0);
}
