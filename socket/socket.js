const socketConfig = require('../util/api').socketConfig

var io = require('socket.io')(socketConfig)

var mongoose = require('mongoose')

var util = require('../util/util')

var models = require('../model/model')

var redis = require('../redis/index')

var gameDB = require('../mongo/gameDB')
var userDB = require('../mongo/userDB')
var questionDB = require('../mongo/questionDB')

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
        userDB.saveOnlineUser({socketId: socket.id, openId: socket.openId})
        // console.log('在线的人：', userList)
    
        socket.emit('login', "欢迎回来")
    });

    // socket.on('xintiao', function(){

    // })

    //进入房间
    socket.on('joinRoom', function(msg){
        //保存socket
        waitClients.push(socket)

        var socketId = socket.id

        //有两个人则开始创建房间
        if(waitClients.length > 1){
         
            //创建房间           
            async function createRoom(){

                try {

                    //获取问题
                    var questionList = await questionDB.getQuestion

                    var questionSetId = questionList[0]['questionSetId']

                    //创建房间
                    var roomId = await gameDB.createRoom(waitClients, questionSetId, socket)

                    //获取房间信息
                    var roomUserInfo = await gameDB.getRoomUserInfo(roomId)

                    //发送双方个人信息
                    io.to(roomId).emit('showUserInfo', {data: roomUserInfo})

                    //发送房间id和第一道题目
                    io.to(roomId).emit('showQuestion', {roomId: roomId, data: questionList[0]}) 

                    // console.log("问题：", questionList)

                    //把问题存入redis
                    redis.saveQuestion(roomId, questionList)

                }catch(err){

                    console.log(err)
                }
            }

            createRoom()
            
        }

        //回答每一个问题
    
        var answerDetail = [] //存储答题信息

        socket.on('answer', function(msg){

            console.log("socket.id:", socket.id)
            console.log("msg:",msg)

            //客户端发送来的房间id
            var roomId = msg.roomId

            //从redis取出问题
            redis.getQuestion(roomId).then(res=>{
                var questionList = res

                 //房间里的人
                 //TODO
                console.log('room users:', Object.keys(io.sockets.adapter.rooms[roomId.toString()]['sockets']))
                var currentUsers = Object.keys(io.sockets.adapter.rooms[roomId.toString()]['sockets'])

                //如果有人掉线了或退出
                if(currentUsers.length < 2){

                    // console.log('who win:', io.sockets.connected[currentUsers[0]])
                    console.log('someone win')

                    //直接给出胜者
                    gameDB.updateWinUser(roomId, socket.openId).then(function(doc){

                        console.log('update who win result:',doc)

                        //获取结果
                        gameDB.getGameResult(roomId).then((results) => {
                            socket.emit('gameResult', results)
                            socket.doneLength = 0
                            socket.leave(roomId)

                            // console.log('我的房间：', socket.rooms)
                        }).catch(err=>{console.log(err)})
                        
                    }).catch(err=>{console.log(err)})

                    //如果确保此socket在线，因为有可能是已经掉线的socket
                }else if(socket.connected){

                     var updatePromise

                    //防止答题次数比题目数量还多
                    if(answerDetail.length == 0 || answerDetail[answerDetail.length-1]['questionId'] !== msg.questionId){
                        
                        //存储答题信息
                        // console.log('我的id:',socket.openId)
                        answerDetail.push( { questionId: msg.questionId, isTrue: false, option: msg.option } )

                        //记录已答题条数
                        socket.doneLength = answerDetail.length

                        //判断对错
                        if(!questionList[answerDetail.length-1]){

                            console.log('question dont exist!')

                        }else if(msg.option == questionList[answerDetail.length-1]['answer']){

                            answerDetail[answerDetail.length-1]['isTrue'] = true
                            console.log('right answerDetail:', answerDetail)

                            updatePromise = new Promise((resolve, reject) => {

                                //更新分数
                                gameDB.updateScore(socket.openId, roomId, 100).then(function(doc){

                                    gameDB.getScore(socket.openId, roomId).then(function(res){
                                        console.log("score result:", res)

                                        //发送对的消息
                                        socket.emit('isTrue', {msg: true})

                                        //给双方发送分数
                                        io.to(roomId).emit('getScore', {data: res})
                                        
                                        resolve()
                                    }).catch(err=>{console.log(err)})

                                }).catch(err=>{console.log(err)})
                            })
                        }else{
                            console.log('error answerDetail:', answerDetail)
                            socket.emit('isTrue', {msg: false})
                        }



                        //开始处理每道题的结果
                        
                        console.log('user1 length:', io.sockets.connected[currentUsers[0]].doneLength)
                        console.log('user2 length:', io.sockets.connected[currentUsers[1]].doneLength)



                        //对双方处理，不是一方
                        if(io.sockets.connected[currentUsers[0]].doneLength == io.sockets.connected[currentUsers[1]].doneLength){
                            //答题未结束
                            if(answerDetail.length < questionList.length){

                                io.to(roomId).emit('showQuestion', {roomId: roomId, data: questionList[answerDetail.length]})

                            //双方都答题结束
                            }else if(answerDetail.length == questionList.length){

                                //存储结果并获取
                                async function saveGameResult(){
                                    try{

                                        var save = await gameDB.saveGameResult(socket.openId, roomId, answerDetail)

                                        var gameResult = await gameDB.getGameResult(roomId)

                                        io.to(roomId).emit('gameResult', gameResult)

                                        socket.doneLength = 0

                                        socket.leave(roomId)

                                    }catch (err){
                                        console.log(err)
                                    }
                                }

                                //如果最后一题答对了，要保证更新完才处理结果
                                if(updatePromise != undefined){
                                    updatePromise.then(()=>{
                                        
                                        saveGameResult()

                                    }).catch((err) => {console.log(err)})
                                }else{

                                //最后一题没答对则不做处理，直接处理结果
                                    saveGameResult()
                                }
                            }
                        }

                        //每个用户答题结束
                        if(answerDetail.length == questionList.length){
                            //存储答题详情
                            gameDB.saveGameUserDetail(socket.openId, roomId, answerDetail)
                        }
                    }
                }

            })
           
        })
    })
  
  socket.on('disconnect', function(){
    console.log('some one leave')
  })
});

exports.listen = function(server){
    io.listen(server)
}