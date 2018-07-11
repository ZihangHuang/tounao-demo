var app = require('express')();
var server = require('http').Server(app);
var socket = require('./socket/socket');
socket.listen(server)

var mongoose = require('mongoose')

var user = require('./router/user')

const api = require('./util/api')

const totalConfig = api.totalConfig
const { totalHost, totalPort }= totalConfig

const mongodbConfig = api.mongodbConfig
const { mongoHost, mongoPort, database } = mongodbConfig

const connect = function (){
    mongoose.connect('mongodb://' + mongoHost + ':' + mongoPort + '/' + database)
} 
var mongooseConnect
connect()
mongoose.connection.on('connected',function(){
    console.log('mongodb open ok')
    clearInterval(mongooseConnect)
})

mongoose.connection.on('disconnected', () => {
    mongooseConnect = setInterval(connect,120000)
})



server.listen(totalPort)

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html');
// });



app.use('/user', user)

console.log('listen http://' + totalHost + ':8080')