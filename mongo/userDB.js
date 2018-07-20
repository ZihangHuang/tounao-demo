var models = require('../model/model')

function saveUserInfo(user){
	models.userInfo.update({'openId': user.openId}, { $set: {
		'nickName': user.nickName,
		'gender': user.gender,
		'avatarUrl': user.avatarUrl
	} }, {upsert: true}, function(err, doc){
		if(err){
			console.log(err)
		}
		// console.log(doc)
	})
}

function saveOnlineUser(user){
	models.onlineUser.update({'socketId': user.socketId}, { $set: {
		'openId': user.openId
	}}, {upsert: true}, function(err, doc){
		if(err){
			console.log(err)
		}
		// console.log(doc)
	})
}

//根据openId获取用户信息
function getUserInfo(openId){
	return new Promise((resolve, reject)=>{
		models.userInfo.findOne({'openId': openId}, { '_id': 0, '__v': 0 }, function(err, doc){
			if(err){console.log(err)}
    		else{
    			resolve(doc)
    		}
		})
	})
}



module.exports={
	saveUserInfo: saveUserInfo,
	saveOnlineUser: saveOnlineUser,
	getUserInfo: getUserInfo
}