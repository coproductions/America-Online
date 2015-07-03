(function(){
  var SERVER_ADDRESS = 'http://localhost:8000';
  var SOCKET_CONNECT = 'connect';
  var SOCKET_RECONNECTING = 'reconnecting';
  var SOCKET_DISCONNECT = 'disconnect';
  var SOCKET_RECONNECT = 'reconnect';
  var SOCKET_ERROR = 'error';
  var SOCKET_USER_MESSAGE = 'user message';
  var SOCKET_USER_REGISTRATION = 'user registration';
  var myNickname;


  var SYSTEM = 'System';
  var socket = io.connect(SERVER_ADDRESS);

  socket.on(SOCKET_CONNECT, function(){
    message(SYSTEM,'connected to '+SERVER_ADDRESS)
    console.log('connected')
  })

  socket.on(SOCKET_RECONNECTING, function(){
    message(SYSTEM, 'Attempting to re-connect to '+SERVER_ADDRESS);
  })

  socket.on(SOCKET_DISCONNECT, function(){
    socket.emit('user disconnected',socket.nickname)
    message(SYSTEM, 'Disconnected from '+SERVER_ADDRESS);
  })

  socket.on(SOCKET_RECONNECT, function(){
    message(SYSTEM, 'Reconnected to '+SERVER_ADDRESS);
  })

 socket.on(SOCKET_ERROR, function(err){
   if(err !== undefined){
    message(SYSTEM,err)
   }
   else{
    message(SYSTEM,'An unknown error occurred.')
   }
  });

 socket.on(SOCKET_USER_MESSAGE, function(from,userMessage){
  message(from,userMessage)
 })


 socket.on('user change',renderUserList);

 function renderUserList(list){
  var connectedUserList = $('#connectedUserList');
  connectedUserList.text('Connected Users:');
  for(var key in list){
    var listItem = $('<li>',{
      text : key
    });
    connectedUserList.append(listItem);
  }
 }



  function message(from, message){
    var newMessage = $('<p>');
    var fromTag = $('<b>',{
      text : from
    });
    var messageTag = $('<span>',{
      text : message
    });

    if(from === 'server'){
      messageTag.addClass("serverMessage");
    }else{
      newMessage.append(fromTag);
    }
    if(message.indexOf(myNickname) >= 0){
      messageTag.addClass('mention')
    }
    newMessage.append(messageTag);
    $('#chatlog').append(newMessage).get(0).scrollTop = 100000;
  }

  $('#messageForm').submit(function(){
    var messageField = $('#message')
    var theMessage = messageField.val();
    //add my message to the chatlog
    message('me',theMessage)

    //send message to the server
    socket.emit(SOCKET_USER_MESSAGE,theMessage)

    //clear the message input
    messageField.val('');

    return false;
  })
  $('#registration_form').submit(function(){
    var nickname = $('#nickname').val();
    //send nickname to server
    socket.emit(SOCKET_USER_REGISTRATION, nickname,function(available){
      //if nickname is available then go to chatroom state
      console.log(available)
      if(available){
        changeStateToChatroom();
        myNickname = nickname;
      }else{
        $('#nickname_error').html('Nickname is taken!');
      }
    })
    return false;
  })

  //manage state
  var registration = $('#registration');
  var chatroom = $('#chatroom');

  //default state, show registration and hide chat
  chatroom.hide();
  function changeStateToChatroom(){
    chatroom.show();
    registration.hide();
  }
})();
