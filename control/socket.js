var models = require('../model/model')

var redis = require('../redis/index')

var gameDB = require('../mongo/gameDB')
var userDB = require('../mongo/userDB')
var questionDB = require('../mongo/questionDB')

//随机匹配
function randomMatch(waitClients, socket){

	//保存socket
    waitClients.push(socket)

    //有两个人则开始创建房间
    if(waitClients.length > 1){
     
        //创建房间           

        //把队列前两个client拿出来
        var roomUsers = waitClients.splice(0, 2)

        //第一个进入房间的用户已退出,或者同一个用户两次进入游戏，则把其重放回队列
        if(!roomUsers[0].connected || roomUsers[0].id == roomUsers[1].id){
            waitClients.push(roomUsers[1])
            // console.log('waitClients:', waitClients)
            return
        }

        return roomUsers
        
    }
}

async function createRoom(roomUsers, socket, io){

    try {

        //获取问题
        var questionList = await questionDB.getQuestion(4)

        var questionSetId = questionList[0]['questionSetId']

        //创建房间
        var roomId = await gameDB.createRoom(roomUsers, questionSetId, socket)

        //获取房间信息
        var roomUserInfo = await gameDB.getRoomUserInfo(roomId)

        //发送双方个人信息
        io.to(roomId).emit('showUserInfo', {data: roomUserInfo})

        //发送房间id和第一道题目
        io.to(roomId).emit('showQuestion', { data: questionList[0]}) 

        // console.log("问题：", questionList)

        //把问题存入redis
        redis.saveQuestion(roomId, questionList)

    }catch(err){

        console.log(err)
    }
}

//回答过程
function answerProcess(socket, io, msg, answerDetail){
	
	// console.log("socket.id:", socket.id)
    console.log("msg:",msg)

    //客户端发送来的房间id
    var roomId = socket.roomId

    redis.getQuestion(roomId).then(res=>{
        var questionList = res
        var isDropp = isDropped(roomId, io)

        //如果有人掉线了或退出
        if(isDropp){

            someDropLine(roomId, socket)

        }else{

             var updatePromise

             var currentUsers = getRoomUser(roomId, io)

            //防止答题次数比题目数量还多
            if(answerDetail.length == 0 || answerDetail[answerDetail.length-1]['questionId'] !== msg.questionId){
                
                //存储答题信息
                answerDetail.push( { questionId: msg.questionId, isTrue: false, option: msg.option } )

                //记录已答题条数
                socket.doneLength = answerDetail.length

                //判断对错
                if(!questionList[answerDetail.length-1]){

                    console.log('question dont exist!')

                }else if(msg.option == questionList[answerDetail.length-1]['answer']){

                    answerDetail[answerDetail.length-1]['isTrue'] = true
                    // console.log('right answerDetail:', answerDetail)
                    console.log('answer right!')

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
                    // console.log('error answerDetail:', answerDetail)
                    console.log('answer error!')
                    socket.emit('isTrue', {msg: false})
                }



                //开始处理每道题的结果
                
                console.log('user1 length:', io.sockets.connected[currentUsers[0]].doneLength)
                console.log('user2 length:', io.sockets.connected[currentUsers[1]].doneLength)



                //对双方处理，不是一方
                if(io.sockets.connected[currentUsers[0]].doneLength == io.sockets.connected[currentUsers[1]].doneLength){
                    //答题未结束
                    if(answerDetail.length < questionList.length){

                        io.to(roomId).emit('showQuestion', {data: questionList[answerDetail.length]})

                    //双方都答题结束
                    }else if(answerDetail.length == questionList.length){

                        //存储结果并获取
                        async function saveGameResult(){
                            try{

                                var save = await gameDB.saveGameResult(socket.openId, roomId, answerDetail)

                                var gameResult = await gameDB.getGameResult(roomId)

                                io.to(roomId).emit('gameResult', gameResult)

                                io.sockets.connected[currentUsers[0]].leave(roomId)
                                io.sockets.connected[currentUsers[1]].leave(roomId)

                                socket.doneLength = 0

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

                    socket.roomId = 0

                }
            }
        }

    })
}

//掉线处理
function someDropLine(roomId, socket){
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
}

function getRoomUser(roomId, io){
    var socketRoom = io.sockets.adapter.rooms[roomId.toString()]

    if(socketRoom != undefined){
        var roomUsers = Object.keys(socketRoom['sockets'])
        return roomUsers
    }
    return false
}

function isDropped(roomId, io){

    var isDropped = false

    var roomUsers = getRoomUser(roomId, io)
    if(roomUsers !== undefined){
        console.log('room users: ', roomUsers)
        if(roomUsers.length < 2){
            isDropped = true
        }
    }else{
        console.log('此房间无效,要出bug了！')
    }

    return isDropped
}


function leaveGameRoom(socket){
    if(socket.roomId !== undefined && socket.roomId !== 0){
        console.log('user back to index page from gaming')
        socket.leave(socket.roomId)
        socket.doneLength = 0
        socket.roomId = 0
    }
}

function leaveApp(socket){
    console.log('some one leave')
    socket.disconnect(true)
    socket.doneLength = 0
    var roomId = socket.roomId
    if(roomId != undefined){
        console.log('disconnect roomId', roomId)
        socket.leave(roomId)
    }
}

module.exports = {
	randomMatch: randomMatch,
	createRoom: createRoom,
	answerProcess: answerProcess,
    leaveGameRoom: leaveGameRoom,
    leaveApp: leaveApp
}


