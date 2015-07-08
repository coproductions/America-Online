(function(){
  var SERVER_ADDRESS = 'http://localhost:8000';
    // var SERVER_ADDRESS = 'http://10.0.1.30:8000';
  // var moment = require('../bower_components/moment/moment.js');
  // moment().format();

  var SOCKET_CONNECT = 'connect';
  var SOCKET_RECONNECTING = 'reconnecting';
  var SOCKET_DISCONNECT = 'disconnect';
  var SOCKET_RECONNECT = 'reconnect';
  var SOCKET_ERROR = 'error';
  var SOCKET_USER_MESSAGE = 'user message';
  var SOCKET_USER_REGISTRATION = 'user registration';
  var PRIVATE_MESSAGE = 'private message';
  var myNickname;
  var ignoreList = {};


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



 socket.on(PRIVATE_MESSAGE,receivePrivateMessage)

 function receivePrivateMessage(fromUser,user,theMessage){
    if(fromUser in ighoreList){
      //do nothing
      return;
    } else if(user === myNickname){
      theMessage = 'sent you a private message: '+theMessage;
      message(fromUser,theMessage);
    }
 }

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
    var lowerCaseMessage = ' '+message.toLowerCase()+' ';
    if(myNickname){
      var myNicknameWithSpace = ' '+myNickname.toLowerCase()+' ';
    }
    var newMessage = $('<p>');
    var fromTag = $('<b>',{
      text : from
    });
    var messageTag = $('<span>',{
      text : message
    });
    var dateTag = $('<div>',{
      text : moment().format('MMMM Do YYYY, h:mm:ss a'),
      class : 'dateTag'
    });

    if(from === 'server'){
      messageTag.addClass("serverMessage");
    }else{
      newMessage.append(fromTag);
    }
    if(lowerCaseMessage.indexOf(myNicknameWithSpace) >= 0){
      var nameIndex = lowerCaseMessage.indexOf(myNicknameWithSpace);
      var messageBeforeNameTag = $('<span>',{
        text : message.slice(0,nameIndex)
              });
      var messageAfterNameTag = $('<span>',{
        text : message.slice(nameIndex+myNickname.length)
      });
      var messageMentionNameTag = $('<span>',{
        text : message.slice(nameIndex,nameIndex+myNickname.length),
        class : 'mentionedName'
      });
      newMessage.addClass('mention')
      newMessage.append(messageBeforeNameTag,messageMentionNameTag,messageAfterNameTag)
    } else if(from in ignoreList){
      //do not display message
      return;

    } else{

      newMessage.append(messageTag);
      newMessage.append(dateTag);
    }
    $('#chatlog').append(newMessage).get(0).scrollTop = 100000;
  }

  $('#messageForm').submit(function(){
    var messageField = $('#message')
    var theMessage = messageField.val();

    if(theMessage.slice(0,7) === '/ignore'){
      var userToIgnore = theMessage.split(' ')[1];
      var reasonToIgnore = theMessage.split(' ')[2];
      ignoreList[userToIgnore] = userToIgnore;
      socket.emit('ignore',userToIgnore,reasonToIgnore);
      message('server','you have successfully ignored '+userToIgnore+' and will no longer receive this user\'s messages')
    } else{

      //add my message to the chatlog
      message('me',theMessage)

      //send message to the server
      socket.emit(SOCKET_USER_MESSAGE,theMessage)

      //clear the message input
      messageField.val('');
    }

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
