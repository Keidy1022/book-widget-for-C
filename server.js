const express = require('express');
const fetch = require('node-fetch');
const csv = require('csv-parser');
const cors = require('cors');
const { Readable } = require('stream');

const app = express();
app.use(cors());

// 숫자 변환 함수
const cleanNumber = (value) => {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, '').trim());
};

app.get('/sheet', async (req, res) => {
  const sheetUrl = req.query.url;

  if (!sheetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = [];

    Readable.from(csvText)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
        rows.push(Object.values(row));
      })
      .on('end', () => {
        if (rows.length > 1) {
          const books = cleanNumber(rows[1][4]);     // E2
          const pages = cleanNumber(rows[1][5]);     // F2
          const thickness = cleanNumber(rows[1][6]); // G2

          res.json({ books, pages, thickness });
        } else {
          res.status(400).json({ error: 'No data found in sheet' });
        }
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
