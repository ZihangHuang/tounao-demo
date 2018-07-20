const express = require('express')
const router = express.Router()

var loginRouter = require('./login')

var questionDB = require('../../mongo/questionDB')

router.use(function(req, res, next){
  if(!req.session['admin'] && req.url != '/login'){
    res.redirect('/admin/login')
  }else{
    next()
  }
})

router.get('/', function(req, res){
  switch(req.query.act){
    case 'delete':
      questionDB.deleteQuestion(req.query.id).then(()=>{
          res.redirect('/admin')
      }).catch(()=>{
        res.status(500).send('服务器出错').end()
      })
      break
    default:
      questionDB.getQuestion().then((docs)=>{
        res.render('admin/index', { AllQuestion: docs, username: req.session['admin'] })
      }).catch(()=>{
        res.status(500).send('服务器出错').end()
      })
      break
  }
})

router.get('/logout', function(req, res){
  if(req.session['admin']){
    req.session['admin'] = null
    return res.redirect('/admin/login')
  }
})

router.post('/add', function(req, res){
  var ques = {
    questionSetId: req.body.questionSetId, 
    question: req.body.question, 
    answer: req.body.answer, 
    option1: req.body.option1,
    option2: req.body.option2,
    option3: req.body.option3,
    option4: req.body.option4
  }
  questionDB.createQuestion(ques).then(()=>{
    return res.redirect('/admin')
  }).catch(()=>{
    res.status(500).send('服务器出错').end()
  })
})

router.use('/login', loginRouter)

module.exports = router