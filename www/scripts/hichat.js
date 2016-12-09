window.onload = function () {
  // 实例并初始化我们的hichat程序
  const hichat = new hiChat();
  hichat.init();
};

// 定义我们的hichat类
const hiChat = function () {
  this.socket = null;
};

// 向原型添加业务方法
hiChat.prototype = {
  init: function () {
    // 此方法初始化程序
    const that = this;
    // 建立到服务器的socket连接
    this.socket = io.connect();
    // 监听socket的connect事件，此事件表示连接已经建立
    this.socket.on('connect', function () {
      // 连接到服务器后，显示昵称输入框
      document.getElementById('info').textContent = '御风欢迎您加入风之吟 :';
      document.getElementById('nickWrapper').style.display = 'block';
      document.getElementById('nicknameInput').focus();
    });

    // 监听用户名是否被使用
    this.socket.on('nickExisted', function () {
      document.getElementById('info').textContent = '对不起，您的昵称已被使用'; //显示昵称被占用的提示
    });

    // 登录成功
    this.socket.on('loginSuccess', function () {
      document.title = '风之吟欢迎您：' + document.getElementById('nicknameInput').value;
      document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层显聊天界面
      document.getElementById('messageInput').focus();//让消息输入框获得焦点
    });

    // 系统错误
    this.socket.on('error', function (err) {
      if (document.getElementById('loginWrapper').style.display == 'none') {
        document.getElementById('status').textContent = '!fail to connect :(';
      } else {
        document.getElementById('info').textContent = '!fail to connect :(';
      }
    });

    // 系统事件提示
    this.socket.on('system', function (nickName, userCount, type) {
      const msg = nickName + (type == 'login' ? ' 加入群聊' : ' 已离开');
      that._displayNewMsg('系统提示', msg, 'red');
      document.getElementById('status').textContent = userCount + '人在线';
    });

    // 客户端接收服务器发送消息事件
    this.socket.on('newMsg', function (user, msg, color) {
      that._displayNewMsg(user, msg, color);
    });

    // 客户端接收服务器发送图片事件，接收显示图片
    this.socket.on('newImg', function (user, img, color) {
      that._displayImage(user, img, color);
    });

    //设置昵称的确定按钮
    document.getElementById('loginBtn').addEventListener('click', function () {
      const nickName = document.getElementById('nicknameInput').value;
      if (nickName.trim().length != 0) {
        //不为空，则发起一个login事件并将输入的昵称发送到服务器
        that.socket.emit('login', nickName);
      } else {
        //否则输入框获得焦点
        document.getElementById('nicknameInput').focus();
      }
    }, false);
    document.getElementById('nicknameInput').addEventListener('keyup', function (e) {
      if (e.keyCode == 13) {
        var nickName = document.getElementById('nicknameInput').value;
        if (nickName.trim().length != 0) {
          that.socket.emit('login', nickName);
        };
      };
    }, false);

    // 发送信息按钮事件
    document.getElementById('sendBtn').addEventListener('click', function () {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value,
        //获取颜色值
        color = document.getElementById('colorStyle').value;
      messageInput.value = '';
      messageInput.focus();
      if (msg.trim().length != 0) {
        that.socket.emit('postMsg', msg, color); //把消息发送到服务器
        that._displayNewMsg('我', msg, color); //把自己的消息显示到自己的窗口中
        return;
      };
    }, false);

    // 发送信息回车事件
    document.getElementById('messageInput').addEventListener('keyup', function (e) {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value,
        color = document.getElementById('colorStyle').value;
      if (e.keyCode == 13 && msg.trim().length != 0) {
        messageInput.value = '';
        that.socket.emit('postMsg', msg, color); //把消息发送到服务器
        that._displayNewMsg('我', msg, color);  //把自己的消息显示到自己的窗口中
      };
    }, false);

    // 清空消息事件
    document.getElementById('clearBtn').addEventListener('click', function () {
      document.getElementById('historyMsg').innerHTML = '';
    }, false);

    // 发送图片事件
    document.getElementById('sendImage').addEventListener('change', function () {
      //检查是否有文件被选中
      if (this.files.length != 0) {
        //获取文件并用FileReader进行读取
        var file = this.files[0],
          reader = new FileReader(),
          color = document.getElementById('colorStyle').value;
        if (!reader) {
          that._displayNewMsg('系统提示', '!your browser doesn\'t support fileReader', 'red');
          this.value = '';
          return;
        };
        reader.onload = function (e) {
          //读取成功，显示到页面并发送到服务器
          this.value = '';
          that.socket.emit('img', e.target.result, color);
          that._displayImage('我', e.target.result, color);
        };
        reader.readAsDataURL(file);
      };
    }, false);
    this._initialEmoji();

    // 发送表情事件
    document.getElementById('emoji').addEventListener('click', function (e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      emojiwrapper.style.display = 'block';
      e.stopPropagation();
    }, false);

    // 选择表情
    document.body.addEventListener('click', function (e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      if (e.target != emojiwrapper) {
        emojiwrapper.style.display = 'none';
      };
    });
    document.getElementById('emojiWrapper').addEventListener('click', function (e) {
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('messageInput');
        messageInput.focus();
        messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
      };
    }, false);
  },

  // 初始化所有表情
  _initialEmoji: function () {
    var emojiContainer = document.getElementById('emojiWrapper'),
      docFragment = document.createDocumentFragment();
    for (var i = 69; i > 0; i--) {
      var emojiItem = document.createElement('img');
      emojiItem.src = '../content/emoji/' + i + '.gif';
      emojiItem.title = i;
      docFragment.appendChild(emojiItem);
    };
    emojiContainer.appendChild(docFragment);
  },

  //  接收要显示的消息，消息来自谁，以及一个颜色共三个参数
  _displayNewMsg: function (user, msg, color) {
    var container = document.getElementById('historyMsg'),
      msgToDisplay = document.createElement('p'),
      date = new Date().toTimeString().substr(0, 8),
      //determine whether the msg contains emoji
      msg = this._showEmoji(msg);
    const text = msg.indexOf('<p class="sendEmoji">');
    msgToDisplay.style.color = color || '#000';
    const message = user === '系统提示' || text !== -1 ? msg : '<p class="sendMsg">' + msg + '</p>';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + message;
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },

  //  接收要显示的图片，图片来自谁，以及一个颜色共三个参数
  _displayImage: function (user, imgData, color) {
    var container = document.getElementById('historyMsg'),
      msgToDisplay = document.createElement('p'),
      date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" class="sendImg" target="_blank"><img src="' + imgData + '"/></a>';
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },

  // 显示表情
  _showEmoji: function (msg) {
    var match, result = msg,
      reg = /\[emoji:\d+\]/g,
      emojiIndex,
      totalEmojiNum = document.getElementById('emojiWrapper').children.length;
    while (match = reg.exec(msg)) {
      emojiIndex = match[0].slice(7, -1);
      if (emojiIndex > totalEmojiNum) {
        result = result.replace(match[0], '[X]');
      } else {
        result = result.replace(match[0], '<p class="sendEmoji"><img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" /></p>');//todo:fix this in chrome it will cause a new request for the image
      };
    };
    return result;
  }
};
