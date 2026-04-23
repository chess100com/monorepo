import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { redisClient } from '../redis-client.js';
import { renderTemplate, sendMail } from '../mailer.js';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const RESET_CODE_TTL_SEC = 60 * 60;
const NEW_PASSWORD_BYTES = 9;

const resetKey = (code: string) => `pwreset:${code}`;

const joinUrl = (base: string, path: string): string => {
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = path.startsWith('/') ? path.slice(1) : path;
  return `${left}/${right}`;
};

const publicUrl = (path: string): string =>
  joinUrl(process.env.API_PUBLIC_URL ?? 'http://localhost:3000/', path);

const router = Router();

router.post('/password/request-reset', asyncHandler(async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const user = await AppDataSource.getRepository(User).findOneBy({ email });
  // Respond identically whether or not the address exists, so attackers can't
  // probe for registered emails. Only actually send a mail if the user exists.
  if (user) {
    const code = randomUUID();
    await redisClient.set(resetKey(code), String(user.id), 'EX', RESET_CODE_TTL_SEC);
    const resetUrl = `${publicUrl('password/reset')}?code=${encodeURIComponent(code)}`;
    const body = renderTemplate('reset-link', { username: user.username, resetUrl });
    await sendMail({ to: user.email, subject: 'chess100 password reset', body });
  }

  res.status(200).json({ ok: true });
}));

router.get('/password/reset', asyncHandler(async (req: Request, res: Response) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) {
    res.status(400).type('text/plain').send('Invalid or expired reset link.');
    return;
  }

  const key = resetKey(code);
  const userIdRaw = await redisClient.get(key);
  if (!userIdRaw) {
    res.status(400).type('text/plain').send('Invalid or expired reset link.');
    return;
  }
  // Single-use: consume the code even if we fail later, so it can't be replayed.
  await redisClient.del(key);

  const userId = Number(userIdRaw);
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: userId });
  if (!user) {
    res.status(400).type('text/plain').send('Invalid or expired reset link.');
    return;
  }

  const newPassword = randomBytes(NEW_PASSWORD_BYTES).toString('base64url');
  user.password = await bcrypt.hash(newPassword, 10);
  await repo.save(user);

  const body = renderTemplate('new-password', { username: user.username, password: newPassword });
  await sendMail({ to: user.email, subject: 'chess100 new password', body });

  res.status(200).type('text/plain').send('A new password has been emailed to you.');
}));

export default router;
