const express = require('express');
const cors = require('cors');
const next = require('next');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number.parseInt(process.env.PORT || '5000', 10);
const isDevelopment = process.env.NODE_ENV === 'development';
const frontendRoot = path.join(__dirname, '..', 'frontend');
const buildOutput = path.join(__dirname, 'dist');
const host = process.env.HOST || '0.0.0.0';
const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://${host}:${PORT}`;
const nextApp = next({
  dev: isDevelopment,
  dir: frontendRoot,
  conf: {
    distDir: buildOutput,
  },
});
const handle = nextApp.getRequestHandler();

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.disable('x-powered-by');

// 기본 라우팅
app.get('/health', (req, res) => {
  res.json({ ok: true, environment: process.env.NODE_ENV || 'development' });
});

// 샘플 API 엔드포인트
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!', publicUrl });
});

// 서버 시작
nextApp.prepare().then(() => {
  app.use(async (req, res, nextMiddleware) => {
    try {
      await Promise.resolve(handle(req, res));
    } catch (error) {
      nextMiddleware(error);
    }
  });

  app.use((error, req, res, nextMiddleware) => {
    console.error(error);
    if (res.headersSent) {
      return nextMiddleware(error);
    }

    res.status(500).json({
      error: 'Internal Server Error',
    });
  });

  app.listen(PORT, host, () => {
    console.log(`서버가 ${host}:${PORT}에서 실행 중입니다.`);
    console.log(`공개 주소: ${publicUrl}`);
  });
});
