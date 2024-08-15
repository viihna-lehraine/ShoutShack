import testRoutes from '../../routes/testRoutes.js';
import setupLogger from '../../config/logger.js';

export function loadTestRoutes(app) {
    setupLogger().then((logger) => {
        if (process.env.FEATURE_LOAD_TEST_ROUTES) {
            app.use('/test', testRoutes);
            logger.info('Test routes loaded');
        } else {
            logger.info('Test routes not loaded; feature flag is set to FALSE')
        }
    }).catch((err) => {
        console.error('Error setting up logger: ', err);
    });
}

export default loadTestRoutes;