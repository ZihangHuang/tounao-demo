var models = require('../model/model')
var mongoose = require('mongoose')

var util = require('../util/util')

var questionList = util.questionList

var questionSetId = "2" //临时设置的问题集id

function createQuestion(questionList){
	models.questions.create(questionList, (err, docs)=>{
		if(err){
			console.log(err)
		}
		console.log('create:', docs)
	})
}

function getQuestion(questionSetId){
	return new Promise((resolve, reject) => {
		models.questions.find({questionSetId: questionSetId}, {'__v': 0},(err, docs)=>{
			if(err){
				console.log(err)
			}
			//把_id属性名换成questionId
			docs = JSON.parse(JSON.stringify(docs).replace(/_id/g, "questionId"))
			resolve(docs)
		})
	})
}

module.exports = {
	getQuestion: getQuestion(questionSetId)
}