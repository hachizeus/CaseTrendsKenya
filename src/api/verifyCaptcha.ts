import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/verify-captcha', async (req, res) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA token is required' });
  }

  const secretKey = '0x4AAAAAADAszfTezIwB2zt2XoW4mSpidys';
  const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;