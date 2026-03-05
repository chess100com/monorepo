import 'reflect-metadata';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis-client';
import { AppDataSource } from './data-source';
import { User } from './entity/User';
import authRouter from './routes/auth';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET ?? 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true },
});

app.use(express.json());
app.use(sessionMiddleware);

app.get('/healthcheck', (_req, res) => {
  res.status(200).send('OK');
});

app.use(authRouter);

// Share session with socket.io
io.engine.use(sessionMiddleware);

io.on('connection', (socket) => {
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('my-info', async () => {
    const req = socket.request as express.Request;
    const userId = (req.session as session.Session & { userId?: number }).userId;
    if (!userId) {
      socket.emit('my-info', { error: 'Unauthorized' });
      return;
    }
    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      socket.emit('my-info', { error: 'Unauthorized' });
      return;
    }
    socket.emit('my-info', { username: user.username, email: user.email });
  });
});

const PORT = process.env.PORT ?? 3000;

async function start() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  httpServer.listen(PORT);
}

// oxlint-disable-next-line no-console unicorn/prefer-top-level-await
start().catch(console.error);

export { app, httpServer, io };
