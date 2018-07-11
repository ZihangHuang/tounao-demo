var redis = require('redis')

const redisConfig = require('../util/api').redisConfig

const { redisPort, redisHost } = redisConfig

const __createClient = () => {
    const client = redis.createClient(redisPort, redisHost)
    console.log('redis open ok')

    //记录redis错误
    client.on("error", function (err) {
        logger("redis error: " + err)
    });
    return client
};

const client = __createClient()

// client.expire(*, 120, (err, isSuccess) => {
//     client.quit();
//     if (err || !isSuccess) {
//         //your code
//     } else {
//         //your another code
//     }
// });








//把数组内的字符串对象转化成真正的对象
function translateArray(array){
	return array.map((item,index)=>JSON.parse(item))
}

function saveAnswerDatail(openId, roomId, answerDatail){
	var totolId = openId.substr(-1, 6) + roomId.substr(-1, 6)

	client.sadd(totolId, JSON.stringify(answerDatail))
}

function getAnswerDatail(openId, roomId){
	var totolId = openId.substr(-1, 6) + roomId.substr(-1, 6)

	return new Promise((resolve, reject)=>{
		client.smembers(totolId, function(err, array){
			if(err){
				console.log(err)
			}
			return translateArray(array)
		})
	})
}

function removeAnswerDatail(openId, roomId){
	var totolId = openId.substr(-1, 6) + roomId.substr(-1, 6)
	client.srem(totolId)
}

function saveQuestion(roomId, questionArray){
	questionArray.forEach((item, index)=>{
		client.zadd(roomId + "question", index, JSON.stringify(item))
	})
}

function getQuestion(roomId){
	return new Promise((resolve, reject)=>{
		client.zrange(roomId + "question", 0, -1, function(err, array){
			if(err){
				console.log(err)
			}
			// console.log('arry222:', array)
			resolve(translateArray(array))
		})
	})
}

module.exports = {
	translateArray: translateArray,
	getAnswerDatail: getAnswerDatail,
	saveQuestion: saveQuestion,
	getQuestion: getQuestion
}