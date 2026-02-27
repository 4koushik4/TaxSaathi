const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve the main HTML file for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});