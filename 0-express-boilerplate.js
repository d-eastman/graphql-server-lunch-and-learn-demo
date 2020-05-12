const express = require('express');
const PORT = process.env.PORT || 4000;
const app = express();

//
// Add stuff here
//




//
// Handle root and 404 request, start server
//
app.get('', (req, res) => res.send('You have arrived, tho there ain\'t much here :)'));
app.use('*', (req, res) => res.send('Well done, you broke it :p'));
app.listen(PORT, () => console.log(`Started http://localhost:${PORT}`));
