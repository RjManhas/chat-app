document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let username;

    socket.on('setUsername', (uname) => {
        username = uname || 'Anonymous';
    });

    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messages = document.getElementById('messages');

    function isValidMessage(message) {
        const trimmedMessage = message.trim();
        return trimmedMessage.length > 0 && trimmedMessage.length <= 200;
    }

    sendBtn.addEventListener('click', () => {
        const message = messageInput.value;

        if (!isValidMessage(message)) {
            alert('Message must not be empty and should be under 200 characters!');
            return;
        }

        socket.emit('sendMessage', message);
        messageInput.value = ''; 
    });

    socket.on('chatMessage', (data) => {
        if (!data || !data.message) return; 

        const newMessage = document.createElement('li');
        newMessage.textContent = `${data.username}: ${data.message}`;

        messages.prepend(newMessage);
    });
});
