const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public')); // serve index.html, script.js, frases.json etc.


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
