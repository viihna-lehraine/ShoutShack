// Loads Test Routes if Environment is 'Development' or 'Testing'
export async function loadTestRoutes(app) {
    if (process.env.NODE_ENV !== 'production') {
        console.log("Loading test routes...");
        const { default: testRoutes } = await import('../routes/testRoutes.js');
        app.use('/', testRoutes);
    }
};