require('dotenv').config();
const express = require('express');
const path = require('path');
import { fileURLToPath } from 'url';

const FRONTEND_PORT = process.env.FRONTEND_SERVER_PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


// Default Route - Serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(FRONTEND_SERVER_PORT, () => {
    console.log(`Frontend server is running on port ${FRONTEND_SERVER_PORT}`);
});