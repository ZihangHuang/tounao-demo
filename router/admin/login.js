const express = require('express')
const router = express.Router()

var adminDB = require('../../mongo/adminDB')

var util = require('../../util/util')

router.get('/', function(req, res){
  res.render('admin/login')
})

router.post('/', function(req, res){
  var password = util.md5(req.body.password + util.MD5_SUFFIX)

  adminDB.findManager(req.body.username, password).then(data=>{
    if(data){
      if(data.password === password){
        req.session['admin'] = data.username
        return res.redirect('/admin')
      }else{
        res.status(404).send('password err!')
      }
    }else{
      res.status(404).send('cant find the manager!').end()
    }
  }).catch(data=>{
    res.status(500).send('server error!').end()
  })


})
module.exports = router