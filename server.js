const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// 요청 들어오는지 로그로 확인
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Google Sheets URL에서 spreadsheetId 추출
function extractSpreadsheetId(sheetUrl) {
  // https://docs.google.com/spreadsheets/d/{ID}/...
  const m = String(sheetUrl || "").match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

// ✅ sheet gid 추출 (없으면 null)
function extractGid(sheetUrl) {
  // ...gid=123 or #gid=123
  const s = String(sheetUrl || "");
  const m1 = s.match(/[?&]gid=(\d+)/);
  if (m1) return m1[1];
  const m2 = s.match(/#gid=(\d+)/);
  return m2 ? m2[1] : null;
}

// ✅ CSV에서 특정 셀(E2/F2/G2) 값을 읽기: 2행의 5/6/7번째 컬럼
function parseStatsFromCsv(csvText) {
  // 아주 단순 CSV 파서 (따옴표 케이스까지 완벽하진 않지만, 숫자만 있는 시트면 충분)
  const lines = String(csvText || "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { books: null, pages: null, thickness: null };

  // 2번째 줄이 2행
  const row2 = lines[1];

  // 쉼표로 split (값에 쉼표가 들어가면 깨질 수 있음 → 숫자 데이터면 OK)
  const cols = row2.split(",");

  const books = cols[4] ?? null;     // E 열 (0=A,1=B,2=C,3=D,4=E)
  const pages = cols[5] ?? null;     // F 열
  const thicknessRaw = cols[6] ?? null; // G 열

  return { books, pages, thicknessRaw };
}

app.get("/data", async (req, res) => {
  const sheetUrl = req.query.sheetUrl;

  if (!sheetUrl) {
    return res.status(400).json({ error: "Missing Google Sheets URL" });
  }

  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    return res.status(400).json({ error: "Invalid Google Sheets URL" });
  }

  // gid가 있으면 gid 사용, 없으면 0(첫 시트)로 시도
  const gid = extractGid(sheetUrl) || "0";

  try {
    // ✅ 공개 시트라면 CSV export로 읽을 수 있음 (키/인증 불필요)
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    console.log("[EXPORT]", exportUrl);

    const response = await axios.get(exportUrl, { timeout: 60000 });
    const csv = response.data;

    const { books, pages, thicknessRaw } = parseStatsFromCsv(csv);

    // 🔥 thickness 안전 파싱
    const cleaned = String(thicknessRaw ?? "")
      .replace(",", ".")
      .replace(/[^0-9.\-]/g, "");

    const thicknessNum = Number.parseFloat(cleaned);
    const thickness = Number.isFinite(thicknessNum)
      ? thicknessNum.toFixed(2)
      : "0.00";

    console.log("books=", books, "pages=", pages, "raw thickness =", thicknessRaw, "→ cleaned =", cleaned);

    // books/pages도 null/undefined면 "-"로 보내기
    res.json({
      books: (books ?? "").toString().trim() || "-",
      pages: (pages ?? "").toString().trim() || "-",
      thickness
    });

  } catch (error) {
    console.error("Fetch failed:", error.message);
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
