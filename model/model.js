var mongoose = require('mongoose')

const roomList = mongoose.Schema({
	userInfo: Array,
	failUserId: String,
	successUserId: String,
	questionSetId: Number,
	create: {
		type: Date,
		default: Date.now()
	}
})

const userInfo = mongoose.Schema({
	openId: {
		type: String,
		unique: false
	},
	nickName: String,
	avatarUrl: String,
	gender: Number
})

const questions = mongoose.Schema({
	question: String,
	questionSetId: String,
	answer: String,
	option1: String,
	option2: String,
	option3: String,
	option4: String,
	score: Number
})

const questionSet = mongoose.Schema({
	type: String,
	questionSetId: String
})

const onlineUser = mongoose.Schema({
	openId: String,
	socketId: String
})
module.exports = {
	roomList: mongoose.model('roomList', roomList),
	userInfo: mongoose.model('userInfo', userInfo),
	onlineUser: mongoose.model('onlineUser', onlineUser),
	questions: mongoose.model('questions', questions)
}