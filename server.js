var app = require('express')()
var server = require('http').Server(app)
var socket = require('./socket/socket')
var path = require('path')
var static = require('express-static')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')
socket.listen(server)

var mongoose = require('mongoose')

var userRouter = require('./router/user')
var adminRouter = require('./router/admin/admin')

//app配置
//获取请求数据
//get自带
//post:
app.use(bodyParser.urlencoded())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

//cookie、session
app.use(cookieParser())
app.use(cookieSession({
  name: 'sess_id',
  keys: ['qeq','sfaf','eef'],
  maxAge: 30*60*1000 //30min
}))


const api = require('./util/api')

//配置端口
const totalConfig = api.totalConfig
const { totalHost, totalPort }= totalConfig
server.listen(totalPort)

//配置mongodb
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


//路由
// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html');
// });
app.use('/user', userRouter)
app.use('/admin', adminRouter)

console.log('listen http://' + totalHost + ':8080')

app.use(static(path.join(__dirname, 'static')))
