const socketConfig = require('../util/api').socketConfig

var io = require('socket.io')(socketConfig)

var mongoose = require('mongoose')

var util = require('../util/util')

var socketControl = require('../control/socket')

var userDB = require('../mongo/userDB')

// var userList = [] //保存在线人数

var waitClients = [] //等待进入的队列

io.on('connection', function (socket) {
    // console.log(socket.request._query.openId)
    // query = socket.request._query

     //保存用户数据
    socket.openId = socket.request._query.openId
    
    socket.on('entry', function (user) {
        // console.log('socket：', user)

        //存储用户数据
        if(user.nickName){
            userDB.saveUserInfo({...user,openId: socket.openId})
        }

        //用户和socket.id的集合
        // userDB.saveOnlineUser({socketId: socket.id, openId: socket.openId})
        // console.log('在线的人：', userList)

        console.log('someone come on')
    
        socket.emit('login', "欢迎回来")
    });

    var answerDetail = [] //存储答题信息

    //进入房间
    socket.on('joinRoom', function(msg){

        var roomUsers;

        if(msg.otherId){

        }else{
            roomUsers = socketControl.randomMatch(waitClients, socket)
        }

        if(roomUsers !== undefined){
            socketControl.createRoom(roomUsers, socket, io)
        }

        answerDetail = []

    })

    //回答每一个问题
    socket.on('answer', function(msg){

        socketControl.answerProcess(socket, io, msg, answerDetail)
       
    })

    //用户在答题页面离开
    socket.on('leaveGameRoom', function(msg){
        socketControl.leaveGameRoom(socket)
    })
  
   socket.on('disconnect', function(){
        socketControl.leaveApp(socket)
   })
});

exports.listen = function(server){
    io.listen(server)
}