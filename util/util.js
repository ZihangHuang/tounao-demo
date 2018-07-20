const crypto = require('crypto')

function md5(str){

	var obj = crypto.createHash('md5')

	obj.update(str)

 	return obj.digest('hex')
}

module.exports={
	MD5_SUFFIX: 'dfafwefwef44r43t5y64y3t5%3trft4rffrwfw', //加密后缀
	md5:md5
}