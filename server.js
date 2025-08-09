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
    // Google Apps Script JSON 데이터 불러오기
    const response = await axios.get(sheetUrl);
    const data = response.data;

    const books = data.books;
    const pages = data.pages;
    const thickness = parseFloat(data.thickness).toFixed(2); // 소수점 2자리

    const summary = `📚 ${books}권, 📄 ${pages}페이지, 📏 ${thickness}cm`;

    res.json({
      summary,
      books,
      pages,
      thickness
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
