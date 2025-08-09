const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/data", async (req, res) => {
  const sheetUrl = req.query.url;
  if (!sheetUrl) {
    return res.status(400).json({ error: "Missing Google Sheets URL" });
  }

  try {
    // Google Sheets JSON 불러오기
    const response = await axios.get(sheetUrl);
    const data = response.data;

    // E2, F2, G2 셀 값 읽기 (Apps Script JSON 형식 기준)
    const bookCount = data.values[1][4]; // E2
    const pageCount = data.values[1][5]; // F2
    const thickness = parseFloat(data.values[1][6]).toFixed(2); // G2 (소수점 2자리)

    const summary = `📚 ${bookCount}권, 📄 ${pageCount}페이지, 📏 ${thickness}cm`;

    res.json({
      summary,
      books: bookCount,
      pages: pageCount,
      thickness: thickness
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
