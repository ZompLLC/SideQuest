const express = require('express');

const app = express();

app.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server listening at http://localhost:3000');
});
