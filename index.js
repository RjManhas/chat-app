const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const Fuse = require('fuse.js');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/api/messages', (req, res) => {
    const message = req.body.message;
    io.emit('chatMessage', { username: req.body.username, message });
    res.status(200).json({ success: true });
});

function filterMessage(message) {
    const badWords = [
        'nigger',
        'faggot'
    ];

    const fuse = new Fuse(badWords, {
        includeScore: true,
        threshold: 0.4
    });

    const censorWord = (word) => word[0] + '*'.repeat(word.length - 1);

    let censoredMessage = message;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censoredMessage = censoredMessage.replace(regex, (match) => {
            return censorWord(match);
        });
    });

    fuse.search(message).forEach(({ item, score }) => {
        if (score < 0.4) {
            const regex = new RegExp(item, 'gi');
            censoredMessage = censoredMessage.replace(regex, censorWord(item));
        }
    });

    return censoredMessage;
}

io.on('connection', (socket) => {
    let username = 'Anonymous';

    socket.on('setUsername', (uname) => {
        let censoredMessage = filterMessage(uname);
        username = censoredMessage; // mwaahahah no bad names now!
    });

    socket.on('sendMessage', (msg) => {
        const censoredMessage = filterMessage(msg);
        io.emit('chatMessage', { username, message: censoredMessage });
    });
});

server.listen(6969, () => {
    console.log('Server running on port http://localhost:6969');
});
