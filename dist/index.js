"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
app.set('view engine', 'ejs');
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.render('index');
});
app.post('/api/messages', (req, res) => {
    const startTime = Date.now();
    const { message, username } = req.body;
    if (!message || !username) {
        return res.status(400).json({ success: false, message: 'Missing message or username parameter' });
    }
    if (!isValidMessage(message)) {
        return res.status(400).json({ success: false, message: 'Message must not be empty and should be under 200 characters!' });
    }
    io.emit('chatMessage', { username: filterMessage(username), message: filterMessage(message) });
    const executionTime = Date.now() - startTime;
    const censoredMessage = filterMessage(message);
    const date = formatDate(new Date().toISOString());
    const endpoint = req.headers['x-forwarded-for'] || '127.0.0.1';
    logMessage(censoredMessage, username, date, endpoint);
    res.status(200).json({
        success: true,
        execution_time: executionTime,
        message: 'Message sent successfully'
    });
});
function loadRoomHistory(room) {
    const data = fs_1.default.readFileSync('history.json', 'utf8');
    const history = JSON.parse(data);
    return history.filter((message) => message.room === room);
}
function isValidMessage(message) {
    const trimmedMessage = message.trim();
    return trimmedMessage.length > 0 && trimmedMessage.length <= 200;
}
function filterMessage(message) {
    const badWords = [
        'nigger',
        'faggot'
    ];
    const censorWord = (word) => word[0] + '*'.repeat(word.length - 1);
    let censoredMessage = message;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censoredMessage = censoredMessage.replace(regex, (match) => {
            return censorWord(match);
        });
    });
    return censoredMessage;
}
app.get('/api/history', (req, res) => {
    const data = fs_1.default.readFileSync('history.json', 'utf8');
    const { room } = req.query;
    if (room && typeof room === 'string') {
        const history = loadRoomHistory(room);
        return res.send({ history: history });
    }
    else {
        res.send({
            history: JSON.parse(data)
        });
    }
});
function logMessage(message, username, date, endpoint, room) {
    const data = fs_1.default.readFileSync('history.json', 'utf8');
    const history = JSON.parse(data);
    history.push({ message, username, date, endpoint, room });
    fs_1.default.writeFileSync('history.json', JSON.stringify(history, null, 2), 'utf8');
}
function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}
io.on('connection', (socket) => {
    let username = 'Anonymous';
    socket.on('setUsername', (uname) => {
        let censoredName = filterMessage(uname);
        username = censoredName;
    });
    socket.on('sendMessage', (msg) => {
        const censoredMessage = filterMessage(msg);
        const date = formatDate(new Date().toISOString());
        const endpoint = socket.handshake.address || 'Unknown';
        logMessage(censoredMessage, username, date, endpoint);
        io.emit('chatMessage', { username, message: censoredMessage });
    });
});
server.listen(6969, () => {
    console.log('Server running on port http://localhost:6969');
});
