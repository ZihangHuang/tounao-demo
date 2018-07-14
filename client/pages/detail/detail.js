// pages/detail/detail.js
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    question: '',
    options: [],
    answer: '',
    // roomId: '',
    questionId: 0,
    userInfo: [],
    successUser: '',
    failUser: '',
    currentClick: -1,
    answerTime: 40
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // for (var listener in app.globalData.socket._callbacks) {
    //   if (listener != undefined) {
    //     console.log("ttt", listener)
    //     // app.globalData.socket.removeAllListeners(listener)
    //   }
    // }
    app.globalData.socket.removeAllListeners('showUserInfo')
    app.globalData.socket.removeAllListeners('showQuestion')
    app.globalData.socket.removeAllListeners('isTrue')
    app.globalData.socket.removeAllListeners('getScore')
    app.globalData.socket.removeAllListeners('gameResult')
    app.globalData.socket.removeAllListeners('disconnect')
    app.globalData.socket.removeAllListeners('reconnect')

      var that = this
      var openId = wx.getStorageSync('openId')
      //加入房间
      if (options.otherId){
        app.globalData.socket.emit('joinRoom', { otherId: otherId})
      }else{
        app.globalData.socket.emit('joinRoom', {})
      }

      //监听双方的信息 
      app.globalData.socket.on('showUserInfo', function (res) {
          that.setData({
              userInfo: res.data
          })
      })
      
      var timer
      //监听问题
      app.globalData.socket.on('showQuestion', function (res) {
        setTimeout(function(){
          console.log(res)
          that.setData({
            // roomId: res.roomId,
            questionId: res.data.questionId,
            question: res.data.question,
            answer: res.data.answer,
            options: [
              { option: res.data.option1, optionClass: 'option' },
              { option: res.data.option2, optionClass: 'option' },
              { option: res.data.option3, optionClass: 'option' },
              { option: res.data.option4, optionClass: 'option' },
            ],
            currentClick: -1,
            answerTime: 40
          })
          clearInterval(timer)
          timer = setInterval(() => {
            if (that.data.answerTime === 0) {
              app.globalData.socket.emit("answer", { questionId: that.data.questionId, option: "overtime", openId: openId })
              clearInterval(timer)
            } else {
              that.setData({
                answerTime: that.data.answerTime - 1
              })
            }
          }, 1000)
        },1000)

      });

      //监听对错
      app.globalData.socket.on('isTrue', function(res){
          console.log(res.msg)
          console.log(that.data.currentClick)
         if(that.data.currentClick !== -1){
             var options = that.data.options
             options[that.data.currentClick].optionClass = res.msg ? 'option right' : 'option error'
             that.setData({
                 options: options
             })
         }
         
      })

      //监听返回的分数
      app.globalData.socket.on('getScore', function (res) {
          if(res.data.score){
              console.log('data:',res)
              var userInfo = that.data.userInfo
            //   console.log('user:', that.data.userInfo)
              that.data.userInfo.forEach((item, index) => {
                  if (item.openId === res.data.openId) {
                      userInfo[index]['score'] = res.data.score
                      that.setData({
                          userInfo: userInfo
                      })
                  }
              })
          }
      })

      //监听结果
      app.globalData.socket.on('gameResult', function (res) {
          console.log('result: ', res)
          clearInterval(timer)
          that.setData({
              question: '',
              options: [],
              answer: '',
              // roomId: '',
              questionId: 0,
              answerTime: 40
          })
          if(res.isPingJu){
              that.setData({
                  successUser: '平局'
              })
          } else if (res.failUserId === "dropped"){
              that.setData({
                  successUser: '对方离开游戏，你获胜'
              })
          }else{
              that.setData({
                  successUser: res.successUserId === openId ? '挑战成功' : '挑战失败'
              })
          }
      })
      app.globalData.socket.on('disconnect', function () {
        console.log('断开连接')
        clearInterval(timer)
      })
      app.globalData.socket.on('reconnect', function () {
          clearInterval(timer)
          console.log('重新连接')
          // console.log('openId:', openId)
          // that.setData({
          //     question: '',
          //     options: [],
          //     answer: '',
          //     roomId: '',
          //     questionId: 0,
          //     successUser: '你已断线，点击下面重新进行挑战吧！'
          // })

          

          wx.showModal({
            content: '你已断线,重新进行挑战吧！',
            showCancel: false,
            success: () => {
              wx.navigateTo({
                url: '/pages/index/index',
              })
            }
          })
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.globalData.socket.emit('leaveGameRoom', {})
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  onanswerTap(e){
    var option = e.target.dataset.option
    var index = e.target.dataset.index
    this.setData({
        currentClick: index
    })
    console.log('dianji')
    app.globalData.socket.emit("answer", { questionId: this.data.questionId, option: option})
  }
})