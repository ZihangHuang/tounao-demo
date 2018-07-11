var models = require('../model/model')
var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/tounao')

// //根据socketId获取openId
function getUserOpenId(socketId){
    return new Promise((resolve, reject)=>{
    	models.onlineUser.findOne({'socketId': socketId}, {'openId': 1, '_id': 0}, function(err, doc){
    		if(err){console.log(err)}
    		else{
    			resolve(doc)
    		}
    	})
    })
}

//根据socketId获取用户信息
function getUserInfo(socketId){
	return getUserOpenId(socketId).then(doc=>{
		console.log("doc.openid",doc)
		return new Promise((resolve, reject)=>{
			models.userInfo.findOne({'openId': doc.openId}, { '_id': 0, '__v': 0 }, function(err, doc){
				if(err){console.log(err)}
	    		else{
	    			resolve(doc)
	    		}
			})
		})
	}).catch(err=> console.log(err))
}

function getGameResult(roomId){
		models.roomList.findById(roomId, {'_id': 0}, function(err, doc){
			if(err){console.log(err)}
			// console.log("game over:",doc) 
            var results = {
                userInfo: [],
                successUserId: ''
            }

            var promiseArr = []

            var p1 = getUserOpenId(doc.userInfo[0].socketId).then((res)=>{
            	console.log('res.ssscokitt:', res)
            	results.successUserId = res.openId
            })
            promiseArr.push(p1)

            doc.userInfo.forEach((item, index)=>{
	            var p2= getUserInfo(item.socketId).then((res)=>{
	            	// console.log('userInfo:', res)
					results.userInfo.push({...res._doc, score: item.score})
				})
				promiseArr.push(p2)
        	})

            Promise.all(promiseArr).then((res)=>{
            	console.log("game over:",results) 
            }).catch(err=>{console.log(err)})
		})
}

function getRoomUserInfo(roomId){
		models.roomList.findById(roomId, {'_id': 0}, function(err, doc){
			if(err){console.log(err)}
			// console.log("game over:",doc) 
            var userInfo = []

            var promiseArr = []

            doc.userInfo.forEach((item, index)=>{
	            var p2= getUserInfo(item.socketId).then((res)=>{
	            	// console.log('userInfo:', res)
					userInfo.push(res._doc)
				})
				promiseArr.push(p2)
        	})

            Promise.all(promiseArr).then((res)=>{
            	console.log("game over:",userInfo) 
            }).catch(err=>{console.log(err)})
		})
}

// getGameResult('5b165240d97a0821c89fd429')
// getRoomUserInfo('5b165240d97a0821c89fd429')
// getUserInfo('w69AdHvW8ioCAA23AAAD').then((res)=>{
// 	console.log('userInfo:', res)
// })


//答题对更新分数
function updateScore(socketId, roomId, addScore){
	return models.roomList.update({'userInfo.socketId': socketId, '_id': roomId}, {$inc:{'userInfo.$.score': addScore}}, { multi: false})
}

//获取分数
function getScore(socketId, roomId){
    return models.roomList.findOne({'userInfo.socketId': socketId, '_id': roomId}, { 'userInfo.socketId':1, 'userInfo.openId': 1, 'userInfo.score': 1, '_id': 0 }).then(doc=>{
    	var res = doc.userInfo.filter(item=>item.socketId === socketId)
    	res = {openId: res[0].openId, score: res[0].score}
    	return res
    })
}

var socketId = 'pvIosvWaHlTOuCg4AAAD'
var roomId = '5b174ba45a49fc0fc847d35c'
 updateScore(socketId, roomId, 100).then(function(doc){
    getScore(socketId, roomId).then(function(res){
        console.log("score result:", res)
        
    }).catch(err=>{console.log(err)})
}).catch(err=>{console.log(err)})