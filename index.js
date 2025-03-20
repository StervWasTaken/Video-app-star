const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const { ExpressPeerServer } = require('peer');

// Set up peer server
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs'
});

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/room/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// Socket.io connection handling
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        // Join the room
        socket.join(roomId);
        
        // Notify others in the room
        socket.to(roomId).emit('user-connected', userId, userName);
        
        // Handle chat messages
        socket.on('send-message', (message, userName) => {
            // Broadcast the message to all users in the room
            io.to(roomId).emit('receive-message', message, userName);
        });
        
        // Handle screen sharing status
        socket.on('screen-sharing-started', (userId) => {
            socket.to(roomId).emit('user-screen-sharing', userId);
        });
        
        socket.on('screen-sharing-stopped', () => {
            socket.to(roomId).emit('user-stopped-screen-sharing');
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId, userName);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});