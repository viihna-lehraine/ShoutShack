router.get('/about', (req, res) => {
    logger.info('GET request received at /about');
    res.sendFile(path.join(staticRootPath, 'about.html'));
    logger.info('about.html was accessed');
});

router.get('/confirm', (req, res) => {
    logger.info('GET request received at /confirm');
    res.sendFile(path.join(staticRootPath, 'confirm.html'));
    logger.info('confirm.html was accessed');
});

router.get('/contact', (req, res) => {
    logger.info('GET request received at /contact');
    res.sendFile(path.join(staticRootPath, 'contact.html'));
    logger.info('contact.html was accessed');
});

router.get('/dashboard', (req, res) => {
    logger.info('GET request received at /dashboard');
    res.sendFile(path.join(staticRootPath, 'dashboard.html'));
    logger.info('dashboard.html was accessed');
});

router.get('/faq', (req, res) => {
    logger.info('GET request received at /faq');
    res.sendFile(path.join(staticRootPath, 'faq.html'));
    logger.info('faq.html was accessed');
});

router.get('/password-reset', (req, res) => {
    logger.info('GET request received at /password-reset');
    res.sendFile(path.join(staticRootPath, 'password-reset.html'));
    logger.info('password-reset.html was accessed');
});

router.get('/privacy-policy', (req, res) => {
    logger.info('GET request received at /privacy-policy');
    res.sendFile(path.join(staticRootPath, 'privacy-policy.html'));
    logger.info('privacy-policy.html was accessed');
});

router.get('/register', (req, res) => {
    logger.info('GET request received at /register');
    res.sendFile(path.join(staticRootPath, 'register.html'));
    logger.info('register.html was accessed');
});

router.get('/resources', (req, res) => {
    logger.info('GET request received at /resources');
    res.sendFile(path.join(staticRootPath, 'resources.html'));
    logger.info('resources.html was accessed');
});

router.get('/security-acknowledgements', (req, res) => {
    logger.info('GET request received at /security-acknowledgements');
    res.sendFile(path.join(staticRootPath, 'security-acknowledgements.html'));
    logger.info('security-acknowledgements.html was accessed');
});

router.get('/security-policy', (req, res) => {
    logger.info('GET request received at /security-policy');
    res.sendFile(path.join(staticRootPath, 'security-policy.html'));
    logger.info('security-policy.html was accessed');
});

router.get('/tos', (req, res) => {
    logger.info('GET request received at /tos');
    res.sendFile(path.join(staticRootPath, 'tos.html'));
    logger.info('tos.html was accessed');
});

// Routes for /public/dashboard/
router.get('/dashboard/security', (req, res) => {
    logger.info('GET request received at /dashboard/security');
    res.sendFile(path.join(staticRootPath, 'dashboard/security.html'));
    logger.info('dashboard/security.html was accessed');
});

router.get('/dashboard/settings', (req, res) => {
    logger.info('GET request received at /dashboard/settings');
    res.sendFile(path.join(staticRootPath, '/dashboard/settings.html'));
    logger.info('dashboard/settings.html was accessed');
});