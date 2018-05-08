var _ = require('lodash');
var http = require('http');
var browserify = require('browserify-middleware');
var express = require('express');
var io = require('socket.io')(server);

var app = express();
var server = http.Server(app);
var debug = text => console.log(text);
var DEFAULT_PEER_COUNT = 5;

app.use(express.static(__dirname));

io.on('connection', function (socket) {
  debug('Connection with ID:', socket.id);
  var peersToAdvertise = _.chain(io.sockets.connected)
    .values()
    .without(socket)
    .sample(DEFAULT_PEER_COUNT)
    .value();
  debug('advertising peers', _.map(peersToAdvertise, 'id'));
  peersToAdvertise.forEach(function(socket2) {
    debug('Advertising peer %s to %s', socket.id, socket2.id);
    socket2.emit('peer', {
      peerId: socket.id,
      initiator: true
    });
    socket.emit('peer', {
      peerId: socket2.id,
      initiator: false
    });
  });

  socket.on('signal', function(data) {
    var socket2 = io.sockets.connected[data.peerId];
    if (!socket2) { return; }
    debug('Proxying signal from peer %s to %s', socket.id, socket2.id);

    socket2.emit('signal', {
      signal: data.signal,
      peerId: socket.id
    });
  });
});

server.listen(process.env.PORT || '3000');
