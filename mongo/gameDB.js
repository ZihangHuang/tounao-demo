var models = require('../model/model')

var userDB = require('../mongo/userDB')

//创建房间
function createRoom(roomUsers, questionSetId, socket){

    return new Promise((resolve, reject) => {

        //为存进mongodb设置的变量
        var userInfo = []

        roomUsers.forEach(function(item, index){
            var current = {}
            current.socketId = item.id,
            current.openId = item.openId
            current.score = 0
            current.detail = []
            userInfo.push(current)
        })
        // console.log('roomUsers:', roomUsers)

        var obj = {
            userInfo: userInfo,
            questionSetId: questionSetId,
            successUserId: 0,
            failUserId: 0
        }
        // console.log('要存进mongodb:', obj)
        
        //存进mongodb
        var roomList = new models.roomList(obj)

        roomList.save(function(err, doc){
            if(err){
                console.log(err)
            }
            console.log('分配房间成功！')

            //把两个用户带进房间
            roomUsers.forEach(function(item, index){
                console.log('user的id：', item.id)

                item.roomId = doc.id
                
                item.join(doc.id, function(){
                    console.log("房间:",item.rooms)
                })
            })

            //返回房间id
            resolve(doc.id)
        })
    })

}

//根据roomId获取双方信息
function getRoomUserInfo(roomId){
    return new Promise((resolve, reject)=>{
        models.roomList.findById(roomId, {'_id': 0}, function(err, doc){
            if(err){console.log(err)}
            // console.log("game over:",doc) 
            var roomUserInfo = []

            var promiseArr = []
            
            doc.userInfo.forEach((item, index)=>{
                var p2= userDB.getUserInfo(item.openId).then((res)=>{
                    if(res){
                        // console.log('userInfoss:', res)
                        roomUserInfo.push({...res._doc, score: item.score})
                    }else{
                        console.log("have no openId")
                    }
                })
                promiseArr.push(p2)
            })

            Promise.all(promiseArr).then((res)=>{
                // console.log("room userInfo:",roomUserInfo) 
                resolve(roomUserInfo)
            }).catch(err=>{console.log(err)})
        })
    })
}

//答题结果
function getGameResult(roomId){
	return new Promise((resolve, reject)=>{
		models.roomList.findById(roomId, {'_id': 0}, function(err, doc){
            if(err){
                console.log(err)
            }else{

                var results = {}
                //平局
                if(doc.successUserId === '000'){
                    results = {isPingJu: true}
                }else{
                    results = { isPingJu: false, successUserId: doc.successUserId,  failUserId: doc.failUserId}
                }

                console.log('who win:: ', results)
                resolve(results)
            }

        })
	})
}

//有人掉线直接给出获胜者
function updateWinUser(roomId, successUserId){
	return models.roomList.update({'_id': roomId}, { 'successUserId': successUserId, 'failUserId': 'dropped' })
}

//答题对更新分数
function updateScore(openId, roomId, addScore){
	return models.roomList.update({'userInfo.openId': openId, '_id': roomId}, {$inc:{'userInfo.$.score': addScore}}, { multi: false})
}

function getScore(openId, roomId){
    console.log("openId:", openId)
    return models.roomList.findOne({'userInfo.openId': openId, '_id': roomId}, { 'userInfo.openId': 1, 'userInfo.score': 1, '_id': 0 }).then(doc=>{
        // console.log('分数：', doc)
        var res = doc.userInfo.filter(item=>item.openId === openId)
        res = {openId: res[0].openId, score: res[0].score}
        return res
    })
}

//存储双方比赛结果
function saveGameResult(openId, roomId, answerDetail){

    return new Promise((resolve,reject)=>{
        models.roomList.findOne({'userInfo.openId': openId, '_id': roomId}).then(doc => {
            // console.log("findOne result:",doc)

            //根据得分判断胜负
            if(doc['userInfo'][0]['score'] > doc['userInfo'][1]['score']){
                doc['successUserId'] = doc['userInfo'][0]['openId']
                doc['failUserId'] = doc['userInfo'][1]['openId']
                // console.log('000')
            }else if(doc['userInfo'][0]['score'] < doc['userInfo'][1]['score']){
                doc['successUserId'] = doc['userInfo'][1]['openId']
                doc['failUserId'] = doc['userInfo'][0]['openId']
                // console.log('111')
            }else{
                doc['successUserId'] = '000'
                doc['failUserId'] = '000'
                // console.log('平局')
            }
       
            doc.save(function(err, doc){
                if(err){console.log(err)}
                // console.log('save:', doc)
                resolve()
            })
        })
    })
}

//存储每个用户的答题详情
function saveGameUserDetail(openId, roomId, answerDetail){
    // console.log('socket.id:', socketId)
    models.roomList.update({'userInfo.openId': openId, '_id': roomId}, {$set: {'userInfo.$.detail': answerDetail}}, function(err, doc){
        if(err){
            console.log(err)
        }
        console.log('save detail:', doc)

        answerDetail = null
    })
}

module.exports = {
    createRoom: createRoom,
	getGameResult: getGameResult,
	updateWinUser: updateWinUser,
	updateScore: updateScore,
	saveGameResult: saveGameResult,
    saveGameUserDetail: saveGameUserDetail,
    getRoomUserInfo: getRoomUserInfo,
    getScore: getScore
}