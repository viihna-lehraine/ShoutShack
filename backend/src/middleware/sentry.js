import Sentry from '@sentry/node';

Sentry.init({
    // dsn: 'your-dsn-url-here',
    tracesSampleRate: 1.0,
});