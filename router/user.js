const express = require('express')
const router = express.Router()
const request = require('request')

const api = require('../util/api')
const weixin = api.weixin

router.get('/', function(req, res){
	var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + weixin.appId + '&secret=' + weixin.appSecret + '&js_code=' + req.query.code + '&grant_type=authorization_code'
	request(url, function (error, response, body) {
	 	if(!error && response.statusCode == 200) {
	 		// console.log("userInfo:",body)
	 		res.send( { openId: JSON.parse(body).openid} )
		}
	})	
})

module.exports = router