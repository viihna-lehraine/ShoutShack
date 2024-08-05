const getSecrets = require('../src/config/sops');
const express = require('express');
const path = require('path');
const fileURLToPath = require('url');

secrets = getSecrets();

const PORT = secrets.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


// Default Route - Serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});