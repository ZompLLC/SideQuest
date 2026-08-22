import express, { Request, Response } from 'express';

const app = express();

app.get('/status', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server listening at http://localhost:3000');
});
