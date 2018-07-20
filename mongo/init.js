var mongoose = require('mongoose')

const api = require('../util/api')

const util = require('../util/util')

var questionDB = require('../mongo/questionDB')
var adminDB = require('../mongo/adminDB')

const questionList = util.questionList

const mongodbConfig = api.mongodbConfig
const { mongoHost, mongoPort, database } = mongodbConfig

mongoose.connect('mongodb://' + mongoHost + ':' + mongoPort + '/' + database)

// questionDB.createQuestion(questionList)

const username = 'admin'
const password = '123456'
adminDB.createManager(username, password)