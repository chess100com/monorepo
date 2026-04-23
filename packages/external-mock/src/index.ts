import express from 'express';
import { createServer } from 'node:http';
import mailRouter from './mail';

export const app = express();
app.use(express.json());

app.get('/healthcheck', (_req, res) => {
  res.status(200).send('OK');
});

app.use(mailRouter);

export const httpServer = createServer(app);

export { resetMails, getMails } from './mail';
export type { Mail } from './mail';

const PORT = process.env.PORT ?? 4000;
httpServer.listen(PORT);
