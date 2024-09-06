import express, { Request, Response } from 'express';
import http from 'http';
import { Server as socketIO } from 'socket.io';
import fs from 'fs';
import { HistoryMessage, MessageRequestBody } from './interfaces';

const app = express();
const server = http.createServer(app);
const io = new socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());



app.get('/', (req: Request, res: Response) => {
    res.render('index');
});

app.post('/api/messages', (req: Request<{}, {}, MessageRequestBody>, res: Response) => {
    const startTime = Date.now();
    const { message, username } = req.body;

    if (!message || !username) {
        return res.status(400).json({ success: false, message: 'Missing message or username parameter' });
    }

    if (!isValidMessage(message)) {
        return res.status(400).json({ success: false, message: 'Message must not be empty and should be under 200 characters!' });
    }

    io.emit('chatMessage', { username: filterMessage(username), message: filterMessage(message) });

    const executionTime: number = Date.now() - startTime;
    const censoredMessage: string = filterMessage(message);
    const date: string = formatDate(new Date().toISOString());
    const endpoint: string = req.headers['x-forwarded-for'] as string || '127.0.0.1';
    logMessage(censoredMessage, username, date, endpoint);
    res.status(200).json({ 
        success: true,
        execution_time: `${executionTime}ms`,
        message: 'Message sent successfully' 
    });
});

function loadRoomHistory(room: string): HistoryMessage[] {
    const data = fs.readFileSync('history.json', 'utf8');
    const history: HistoryMessage[] = JSON.parse(data);
    return history.filter((message) => message.room === room);
}

function isValidMessage(message: string): boolean {
    const trimmedMessage = message.trim();
    return trimmedMessage.length > 0 && trimmedMessage.length <= 200;
}

function filterMessage(message: string): string {
    const badWords: string[] = [
        'nigger',
        'faggot'
    ];

    const censorWord = (word: string) => word[0] + '*'.repeat(word.length - 1);

    let censoredMessage = message;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censoredMessage = censoredMessage.replace(regex, (match) => {
            return censorWord(match);
        });
    });

    return censoredMessage;
}

app.get('/api/history', (req: Request, res: Response) => {
    const data = fs.readFileSync('history.json', 'utf8');
    const { room } = req.query;

    if (room && typeof room === 'string') {
        const history: HistoryMessage[] = loadRoomHistory(room);
        return res.send({ history: history });
    } // i did it the wrong way last time Woops
    res.send({
        history: JSON.parse(data)
    });
});

function logMessage(message: string, username: string, date: string, endpoint: string, room?: string) {
    const data = fs.readFileSync('history.json', 'utf8');
    const history: HistoryMessage[] = JSON.parse(data);
    history.push({ message, username, date, endpoint, room });
    fs.writeFileSync('history.json', JSON.stringify(history, null, 2), 'utf8');
}

function formatDate(date: string): string {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

io.on('connection', (socket: any) => {
    let username = 'Anonymous';

    socket.on('setUsername', (uname: string) => {
        let censoredName = filterMessage(uname);
        username = censoredName;
    });

    socket.on('sendMessage', (msg: string) => {
        const censoredMessage: string = filterMessage(msg);
        const date: string = formatDate(new Date().toISOString());
        const endpoint: string = socket.handshake.address || 'Unknown';
        logMessage(censoredMessage, username, date, endpoint);
        io.emit('chatMessage', { username, message: censoredMessage });
    });
});



server.listen(6969, () => {
    console.log('Server running on port http://localhost:6969');
});
