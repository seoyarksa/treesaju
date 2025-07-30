export function extractCheonganHeesinGisinBySaju(dangryeong, sajuCheonganList) {
  // 1. 천간 희신 후보 리스트
  const heesinCandidates = Object.entries(HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {}).map(
    ([pos, char]) => ({ char, pos: Number(pos) })
  );

  // 2. 천간 기신 후보 리스트
  const gisinCandidates = [];
  const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  Object.entries(gisinMap).forEach(([pos, chars]) => {
    const posNum = Number(pos);
    chars.forEach(char => {
      gisinCandidates.push({ char, pos: posNum });
    });
  });

  // 3. 사주 천간 리스트 (중복 허용)
  const sajuSet = new Set(sajuCheonganList);

  // 4. 천간 희신 리스트 (사주에 존재하는 희신만)
  const cheonganHeesinList = heesinCandidates.filter(({ char }) => sajuSet.has(char));

  // 5. 천간 기신 리스트 (사주에 존재하는 기신만)
  const rawGisinList = gisinCandidates.filter(({ char }) => sajuSet.has(char));

  // 6. 희신 중복 제거
  const heesinChars = new Set(cheonganHeesinList.map(h => h.char));
  const cheonganGisinList = rawGisinList.filter(({ char }) => !heesinChars.has(char));

  return {
    cheonganHeesinList,
    cheonganGisinList: filteredGisinList,
  };
}









function arrangeByPositionForDangryeong(dangryeongList) {
  const posMap = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  dangryeongList.forEach(({ char }) => {
    const mapped = DANGRYEONGSHIK_MAP[char];
    if (mapped) {
      for (let i = 0; i < 5; i++) {
        posMap[i + 1].push(mapped[i]);
      }
    }
  });

  return posMap;
}
