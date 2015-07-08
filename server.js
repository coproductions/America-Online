var PORT = 8000;
var SOCKET_CONNECTION = 'connection';
var SOCKET_DISCONNECT = 'disconnect';
var SOCKET_USER_MESSAGE = 'user message';
 var SOCKET_USER_REGISTRATION = 'user registration';
 var SERVER_USER = 'server';
 var PRIVATE_MESSAGE = 'private message';
var socketIO = require('socket.io');
//listening for soccket connection on port 8000
var server = socketIO.listen(PORT);
var nicknames = {};
var connectedSockets = {};
var maxUserMessagePerSecond = 1;
var maxTotalMessagePerSecond = 2;
var totalMessageTimeCache = [];
var banList = {};



//handle connection events
server.sockets.on(SOCKET_CONNECTION, function (socket){
  if(socket.handshake.address in banList){
    socket.disconnect();
  }

  var timeCache = [];


  socket.on('ignore',ignoreFunction);
  function ignoreFunction(ignoredUser,reason){
    // server.emit('ignore notification',ignoredUser,reason,socket.nickname)
    socket.broadcast.emit(SOCKET_USER_MESSAGE,SERVER_USER,socket.nickname+' is ignoring '+ignoredUser+' because of: '+reason)

  }

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
    timeCache.unshift(Date.now());
    totalMessageTimeCache.unshift(Date.now());

    //checking for rate of messages
    if(timeCache[0]-timeCache[1] < 1000/maxUserMessagePerSecond){
      // socket.disconnect();
      socket.broadcast.emit(SOCKET_USER_MESSAGE,SERVER_USER,socket.nickname+' was temporarily blocked for sending too many messages per second.')
      // socket.emit('error','hello i am an error')
    }
    else if(totalMessageTimeCache[0]-totalMessageTimeCache[1] < 1000/maxTotalMessagePerSecond){
      socket.broadcast.emit(SOCKET_USER_MESSAGE,SERVER_USER,'Temporary message overload.')
    }
    else if(message.slice(0,3) === '/pm'){
      sendPrivateMessage(message);
    }

    else{
      socket.broadcast.emit(SOCKET_USER_MESSAGE,socket.nickname, message)
    }

    function sendPrivateMessage(message){
      var userToMessage = message.split(' ')[1];
      if(userToMessage in nicknames){
        var remainingMessage = message.slice(3+userToMessage.length+1,message.length)
        var fromUser = socket.nickname;
        socket.broadcast.emit(PRIVATE_MESSAGE,fromUser,userToMessage,remainingMessage)
      } else{
          server.emit(PRIVATE_MESSAGE,'server',socket.nickname,'the user you are trying to message is not currently online.')

      }
    }
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
  else if(chunk.slice(0,4) === '/ban'){
    var userToBan = chunk.split(' ')[1];
    var reasonToBan = chunk.split(' ')[2];
    if(!reasonToBan){
      userToBan = userToBan.slice(0,userToBan.length-1)
    }
   //banning the right user
    if(userToBan in nicknames){
      banUser(userToBan)
    } else{
      for(var key in connectedSockets){
        if (userToBan === connectedSockets[key].handshake.address){
          banUser(key)
        }
      }
    }
  }
  else if(chunk.slice(0,6) === '/unban'){
    var userToUnBan = chunk.split(' ')[1];
      userToBan = userToBan.slice(0,userToBan.length-1)
   //unbanning the right user
    for(var key in banList){
      if(userToUnBan === banlist[key]){
        delete banList[key];
        var userToUnBanName = userToUnBan;
      } else if (userToBan === key){
        var userToUnBanName = banList[key]
        delete banList[key];
      }
        server.emit(SOCKET_USER_MESSAGE,SERVER_USER,userToUnBanName+' has been unbanned')

    }
  }


  function banUser(userName){
    var bannedIp = connectedSockets[userToBan].handshake.address;
    connectedSockets[userToBan].disconnect();
    banList[bannedIp] = userToBan;
    console.log('banlist',banList)
    process.stdout.write('user: '+userToBan+' with IP: '+bannedIp+' has been banned')
    server.emit(SOCKET_USER_MESSAGE,SERVER_USER,userToBan+' has been banned')
  }
})


server.sockets.on(SOCKET_USER_MESSAGE,function(){
  console.log('listening to a message coming in')
  process.stdout.write('its working')
})
