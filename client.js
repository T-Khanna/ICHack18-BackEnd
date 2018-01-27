const io = require('socket.io-client');

url = 'http://129.31.206.169:8080';
//url = 'https://emotion-picker.herokuapp.com/'
const socket = io(url);

socket.emit('message', 'me', 'test message');

socket.on('server-message', function(msg) {
  console.log(msg);
});

