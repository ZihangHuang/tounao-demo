let weixin = {
	// appId: 'wxa5077852becbca77',
	// appSecret: '7691d4a40d890d3e5ff8151ce372c4b9',
	appId: 'wx9aed9cf601074306',
	appSecret: 'bf84a0d13287ae8456cceb9dde3af487'
}

// const host = '192.168.2.46'
const totalConfig = {
	totalHost: '192.168.0.102',
	totalPort: 8080
}

const redisConfig = {
    redisHost: "127.0.0.1",
    redisPort: "6379"
}

const mongodbConfig = {
	mongoHost: "127.0.0.1",
	mongoPort: "27017",
	database: "tounao"
}

const socketConfig = {
  pingInterval: 10000,
  pingTimeout: 5000,
}

module.exports = {
	weixin: weixin,
	totalConfig: totalConfig,
	redisConfig: redisConfig,
	mongodbConfig: mongodbConfig
}