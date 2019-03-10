import express = require('express');
import socket = require('socket.io');
const app = express();
const http = require('http').Server(app);
const io = socket(http);

app.use(express.static('src/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log(process.env.TEST);
    console.log('a user connected', socket.id);

    socket.on('chat message', function(msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
});
http.listen(3000, function() {
    console.log('listening on *:3000');
});
