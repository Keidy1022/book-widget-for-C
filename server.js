const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/data", async (req, res) => {
  const sheetUrl = req.query.url;
  if (!sheetUrl) {
    return res.status(400).json({ error: "Missing Google Apps Script URL" });
  }

  try {
    // Google Apps Script JSON 불러오기
    const response = await axios.get(sheetUrl);
    const data = response.data; // { books: 3, pages: 520, thickness: 5.2 }

    if (!data.books || !data.pages || !data.thickness) {
      return res.status(500).json({ error: "Invalid data format", details: data });
    }

    const summary = `📚 ${data.books}권, 📄 ${data.pages}페이지, 📏 ${data.thickness}cm`;

    res.json({ summary, ...data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
