var models = require('../model/model')
var util = require('../util/util')

function createManager(username, password){
  var password = util.md5(password + util.MD5_SUFFIX)
  var manager = {
    username,
    password
  }

  return new Promise((resolve, reject)=>{
    models.manager.create(manager, function(err, doc){
      err && console.log(err)

      console.log('create manager:', doc)
      resolve(doc)
    })
  })
}

function findManager(username, password){

  return new Promise((resolve, reject)=>{
    models.manager.findOne({'username': username}, function(err, doc){
      err && console.log(err)
      console.log('res:',doc)
      if(doc){
        resolve(doc)
      }else{
        resolve(false)
      }
    })
  })
}

module.exports = {
  createManager,
  findManager
}