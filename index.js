const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

function generateRandomId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/api/messages', (req, res) => {
    const { message, username }= req.body.message;
    io.emit('chatMessage', { username: username, message: message });
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    const username = generateRandomId(8); 
    socket.emit('setUsername', username);

    socket.on('sendMessage', (msg) => {
        io.emit('chatMessage', { username, message: msg });
    });
});

server.listen(3000, () => {
    console.log('Server running on port http://localhost:3000');
});
