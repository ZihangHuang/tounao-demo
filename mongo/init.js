var mongoose = require('mongoose')

const api = require('../util/api')

const util = require('../util/util')

var questionDB = require('../mongo/questionDB')

const questionList = util.questionList

const mongodbConfig = api.mongodbConfig
const { mongoHost, mongoPort, database } = mongodbConfig

mongoose.connect('mongodb://' + mongoHost + ':' + mongoPort + '/' + database)

questionDB.createQuestion(questionList)