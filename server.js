// 引入HTTP模块
const http = require('http');
// 引入express模块
const express = require('express');
// 引入socket.io模块
const socketio = require('socket.io');

// 创建一个服务器
const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);
const users = [];

app.use('/', express.static(__dirname + '/www')); // 指定静态HTML文件的位置

// 监听3000端口
server.listen(3000);

//socket部分
io.sockets.on('connection', function (socket) {
  //昵称设置
  socket.on('login', function (nickname) {
    if (users.indexOf(nickname) > -1) {
      socket.emit('nickExisted');
    } else {
      socket.userIndex = users.length;
      socket.nickname = nickname;
      users.push(nickname);
      socket.emit('loginSuccess');
      io.sockets.emit('system', nickname, users.length, 'login'); //向所有连接到服务器的客户端发送当前登陆用户的昵称 
    };
  });
  //断开连接的事件
  socket.on('disconnect', function () {
    //将断开连接的用户从users中删除
    if (socket.nickname != null) {
      users.splice(socket.userIndex, 1);
      //通知除自己以外的所有人
      socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    }
  });
  //接收新消息
  socket.on('postMsg', function (msg, color) {
    socket.broadcast.emit('newMsg', socket.nickname, msg, color);
  });
  //接收用户发来的图片
  socket.on('img', function (imgData, color) {
    //通过一个newImg事件分发到除自己外的每个用户
    socket.broadcast.emit('newImg', socket.nickname, imgData, color);
  });
});
