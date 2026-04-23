import { Router } from 'express';
import type { Request, Response } from 'express';

export interface Mail {
  subject: string;
  to: string;
  body: string;
  sentAt: string;
}

const MAX_RETURNED = 10;

const mails: Mail[] = [];

export const resetMails = (): void => {
  mails.length = 0;
};

export const getMails = (): readonly Mail[] => mails;

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

const router = Router();

router.post('/mail/send', (req: Request, res: Response) => {
  const { subject, to, body } = req.body ?? {};
  if (!isString(subject) || !isString(to) || !isString(body)) {
    res.status(400).json({ error: 'subject, to and body are required strings' });
    return;
  }
  mails.push({ subject, to, body, sentAt: new Date().toISOString() });
  res.status(200).json({ ok: true });
});

router.get('/mail/get-last', (_req: Request, res: Response) => {
  res.status(200).json({ mails: mails.slice(-MAX_RETURNED).toReversed() });
});

export default router;
