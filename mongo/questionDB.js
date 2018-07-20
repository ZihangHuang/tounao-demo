var models = require('../model/model')
var mongoose = require('mongoose')

//存入问题
function createQuestion(questionList){
  return new Promise((resolve, reject) => {
    models.questions.create(questionList, (err, docs)=>{
      if(err){
        console.log(err)
      }
      console.log('create questions:', docs)
      resolve()
    })
  })
}

//取出问题
function getQuestion(count){
	return new Promise((resolve, reject) => {
		models.questions.find({}, {'__v': 0},(err, docs)=>{
			if(err){
				console.log(err)
			}
      var ques
      if(count){
        ques = getRandomArrayElements(docs, count)
      }else{
        ques = docs
      }

			//把_id属性名换成questionId
			ques = JSON.parse(JSON.stringify(ques).replace(/_id/g, "questionId"))
			resolve(ques)
		})
	})
}
//删除问题
function deleteQuestion(questionId){
  return new Promise((resolve, reject) => {
    models.questions.findOne({ '_id': questionId}, function(err, doc){
      if(err){
        console.log('err:', err)
        return
      }
      if(doc){
        doc.remove()
        console.log('delete success')
        resolve()
      }
    })
  })
}



//随机从数组中取出几个元素
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}
module.exports = {
	getQuestion: getQuestion,
	createQuestion: createQuestion,
  deleteQuestion: deleteQuestion
}