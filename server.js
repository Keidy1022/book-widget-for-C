const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// 요청 들어오는지 로그로 확인
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/data", async (req, res) => {
  // Android 위젯이 보내는 파라미터명
  const sheetUrl = req.query.sheetUrl;

  if (!sheetUrl) {
    return res.status(400).json({ error: "Missing Google Sheets URL" });
  }

  try {
    // Google Apps Script JSON 데이터 불러오기
    const response = await axios.get(sheetUrl);
    const data = response.data;

    const books = data.books;
    const pages = data.pages;

    // 🔥 thickness 안전 파싱 (문자, cm, 콤마 등 제거)
    const rawThickness = data.thickness;
    const cleaned = String(rawThickness ?? "")
      .replace(",", ".")
      .replace(/[^0-9.\-]/g, "");

    const thicknessNum = Number.parseFloat(cleaned);
    const thickness = Number.isFinite(thicknessNum)
      ? thicknessNum.toFixed(2)
      : "0.00";

    console.log("raw thickness =", rawThickness, "→ cleaned =", cleaned);

    res.json({
      books,
      pages,
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


