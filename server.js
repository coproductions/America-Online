var PORT = 8000;
var SOCKET_CONNECTION = 'connection';
var SOCKET_DISCONNECT = 'disconnect';
var SOCKET_USER_MESSAGE = 'user message';
 var SOCKET_USER_REGISTRATION = 'user registration';
 var SERVER_USER = 'server';
var socketIO = require('socket.io');
//listening for soccket connection on port 8000
var server = socketIO.listen(PORT);
var nicknames = {};
var connectedSockets = {};



//handle connection events
server.sockets.on(SOCKET_CONNECTION, function (socket){

  socket.on(SOCKET_DISCONNECT,function(){
    if(socket.nickname){
    delete nicknames[socket.nickname];
    delete connectedSockets[socket.nickname]
    server.emit('user change',nicknames);
    socket.broadcast.emit(SOCKET_USER_MESSAGE,SERVER_USER,socket.nickname+' has disconnected.')
    console.log('active users: ',nicknames)
    }
  })

  socket.on(SOCKET_USER_MESSAGE, function(message){

    //broadcast this message to connected users
    socket.broadcast.emit(SOCKET_USER_MESSAGE,socket.nickname, message)
  })

  socket.on(SOCKET_USER_REGISTRATION, function(nickname, callback){
    if(nicknames.hasOwnProperty(nickname) || nickname === 'server'){
      //taken not available
      callback(false);
    }
    else{
      //available add it
      nicknames[nickname] = nickname;

      //assign the nickname to the socket
      socket.nickname = nickname;

      //broadcast new user connection
      socket.broadcast.emit(SOCKET_USER_MESSAGE,SERVER_USER,nickname+' has connected.')
      connectedSockets[socket.nickname] = socket;
      server.emit('user change',nicknames)
      //successful registration
      callback(true);
    }
  })

});

  process.stdin.setEncoding('utf8');
  //listening for a kick input
  process.stdin.on('data',function(chunk){
    if(chunk.slice(0,5) === '/kick'){
      var userToKick = chunk.split(' ')[1];
      var reasonToKick = chunk.split(' ')[2];
      if(!reasonToKick){
        userToKick = userToKick.slice(0,userToKick.length-1)
      }
     //kicking the right user
     if(userToKick in nicknames){
        var kickedIp = connectedSockets[userToKick].handshake.address;
        connectedSockets[userToKick].disconnect();
        process.stdout.write('user: '+userToKick+' with IP: '+kickedIp+' has been kicked')
        server.emit(SOCKET_USER_MESSAGE,SERVER_USER,userToKick+' has been kicked')
     }
    }
  })
