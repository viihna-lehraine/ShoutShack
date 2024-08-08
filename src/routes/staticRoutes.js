import express from 'express';
import path from 'path';
import { setupLogger, __dirname } from '../index.js';

const router = express.Router();

async function setupRoutes() {
  const logger = await setupLogger();

  // Define routes
  router.get('/', (req, res) => {
    logger.info('GET request received at /');
    res.sendFile(path.join(__dirname, '../../public/index.html'));
    logger.info('index.html was accessed');
  });

  router.get('/about', (req, res) => {
    logger.info('GET request received at /about');
    res.sendFile(path.join(__dirname, '../../public/about.html'));
    logger.info('about.html was accessed');
  });

  router.get('/confirm', (req, res) => {
    logger.info('GET request received at /confirm');
    res.sendFile(path.join(__dirname, '../../public/confirm.html'));
    logger.info('confirm.html was accessed');
  });

  router.get('/contact', (req, res) => {
    logger.info('GET request received at /contact');
    res.sendFile(path.join(__dirname, '../../public/contact.html'));
    logger.info('contact.html was accessed');
  });

  router.get('/dashboard', (req, res) => {
    logger.info('GET request received at /dashboard');
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
    logger.info('dashboard.html was accessed');
  });

  router.get('/faq', (req, res) => {
    logger.info('GET request received at /faq');
    res.sendFile(path.join(__dirname, '../../public/faq.html'));
    logger.info('faq.html was accessed');
  });

  router.get('/password-reset', (req, res) => {
    logger.info('GET request received at /password-reset');
    res.sendFile(path.join(__dirname, '../../public/password-reset.html'));
    logger.info('password-reset.html was accessed');
  });

  router.get('/privacy-policy', (req, res) => {
    logger.info('GET request received at /privacy-policy');
    res.sendFile(path.join(__dirname, '../../public/privacy-policy.html'));
    logger.info('privacy-policy.html was accessed');
  });

  router.get('/register', (req, res) => {
    logger.info('GET request received at /register');
    res.sendFile(path.join(__dirname, '../../public/register.html'));
    logger.info('register.html was accessed');
  });

  router.get('/resources', (req, res) => {
    logger.info('GET request received at /resources');
    res.sendFile(path.join(__dirname, '../../public/resources.html'));
    logger.info('resources.html was accessed');
  });

  router.get('/security-acknowledgements', (req, res) => {
    logger.info('GET request received at /security-acknowledgements');
    res.sendFile(
      path.join(__dirname, '../../public/security-acknowledgements.html'),
    );
    logger.info('security-acknowledgements.html was accessed');
  });

  router.get('/security-policy', (req, res) => {
    logger.info('GET request received at /security-policy');
    res.sendFile(path.join(__dirname, '../../public/security-policy.html'));
    logger.info('security-policy.html was accessed');
  });

  router.get('/tos', (req, res) => {
    logger.info('GET request received at /tos');
    res.sendFile(path.join(__dirname, '../../public/tos.html'));
    logger.info('tos.html was accessed');
  });

  // Routes for /public/dashboard/
  router.get('/dashboard/security', (req, res) => {
    logger.info('GET request received at /dashboard/security');
    res.sendFile(path.join(__dirname, '../../public/dashboard/security.html'));
    logger.info('dashboard/security.html was accessed');
  });

  router.get('/dashboard/settings', (req, res) => {
    logger.info('GET request received at /dashboard/settings');
    res.sendFile(path.join(__dirname, '../../public/dashboard/settings.html'));
    logger.info('dashboard/settings.html was accessed');
  });

  // Routes for /public/guestbook/
  router.get('/guestbook/guestbook-blank', (req, res) => {
    logger.info('GET request received at /guestbook/guestbook-blank');
    res.sendFile(
      path.join(__dirname, '../../public/guestbook/guestbook-blank.html'),
    );
    logger.info('guestbook/guestbook-blank.html was accessed');
  });

  // 404 handler for unmatched routes
  router.use((req, res) => {
    res
      .status(404)
      .sendFile(path.join(__dirname, '../../public/not-found.html'));
    logger.info('404 - Not Found');
  });
}

// Call setupRoutes to initialize routes
setupRoutes().catch((err) => {
  console.error('Error setting up routes: ', err);
});

export default router;
