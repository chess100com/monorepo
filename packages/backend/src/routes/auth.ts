import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { RegisterDto } from '../dto/RegisterDto';
import { LoginDto } from '../dto/LoginDto';

type SessionWithUser = Express.Request['session'] & { userId?: number };

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const dto = plainToInstance(RegisterDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    res.status(400).json({ errors: errors.map(e => e.constraints) });
    return;
  }

  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOneBy({ email: dto.email });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hashed = await bcrypt.hash(dto.password, 10);
  const user = repo.create({
    username: dto.username,
    username_unique: dto.username.toLowerCase(),
    email: dto.email,
    password: hashed,
  });
  await repo.save(user);

  res.status(200).json({ ok: true });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const dto = plainToInstance(LoginDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    res.status(400).json({ errors: errors.map(e => e.constraints) });
    return;
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ email: dto.email });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  user.lastLogin = new Date();
  await repo.save(user);

  (req.session as SessionWithUser).userId = user.id;
  res.status(200).json({ ok: true });
}));

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.status(200).json({ ok: true });
  });
});

router.post('/my-info', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req.session as SessionWithUser).userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: userId });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({ username: user.username, email: user.email });
}));

export default router;
