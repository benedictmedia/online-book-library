// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use port 3000 by default

// Basic route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the Online Book Library Backend!');
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});