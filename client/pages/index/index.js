//index.js
const io = require('../../assets/weapp.socket.io.js')
const app = getApp()
const hostname = require('../../utils/util.js').hostname

Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo')
    },
    onLoad: function (options) {
        var that = this
        // if (app.globalData.socket){
        //   app.globalData.socket.removeAllListeners('connect')
        //   app.globalData.socket.removeAllListeners('connect_error')
        //   app.globalData.socket.removeAllListeners('login')
        //   app.globalData.socket.removeAllListeners('disconnect')
        //   app.globalData.socket.removeAllListeners('reconnect')
        // }
        console.log('进入首页')
        // app.globalData.socket.removeAllListeners('login');
        if (app.globalData.userInfo) {
            this.entrySocket(app.globalData.userInfo)

        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.entrySocket(res.userInfo)
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })
        }
        if(options.otherId){
          wx.navigateTo({
            url: '/pages/detail/detail?type=friendBattle&otherId=' + options.otherId,
          })
        }
    },
    getUserInfo: function (e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo
        // this.setData({
        //     userInfo: e.detail.userInfo,
        //     hasUserInfo: true
        // })
        this.entrySocket(e.detail.userInfo)
    },
    //初始化socket
    entrySocket(userInfo){
        var that = this
        var openId = wx.getStorageSync('openId')
        that.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
        if (!app.globalData.socket){
          app.globalData.socket = io.connect(hostname + '?openId=' + openId)   
          var userInfo = {
            nickName: that.data.userInfo.nickName,
            gender: that.data.userInfo.gender,
            avatarUrl: that.data.userInfo.avatarUrl
          }
          //TODO
          app.globalData.socket.emit('entry', userInfo);
          app.globalData.socket.on('login', function (data) {
            console.log(data);
          });
          console.log('my openId:', openId)
          wx.hideLoading()
        }
        

        // app.globalData.socket.on('connect', function(){
        //   app.globalData.socket.emit('entry', userInfo)
        //   wx.hideLoading()
          
        // })

        app.globalData.socket.on('disconnect', function () {
          console.log('断开连接')
        })

        app.globalData.socket.on('reconnect', function () {
          wx.showLoading({
            title: '重新连接',
          })
          setTimeout(()=>{
            wx.hideLoading()
            app.globalData.socket.emit('entry', userInfo)
          },1000)
        })

        app.globalData.socket.on('connect_error', () => {
          wx.getNetworkType({
            success: function (res) {
              if (res.networkType == 'none') {
                  wx.showModal({
                    content: '当前网络不可用，请检查网络连接！',
                    showCancel: false,
                    success: function () {

                    }
                  })
              }
            }
          })
        })
    },
    onsocketTap() {
      wx.navigateTo({
          url: '/pages/detail/detail'
      })
    },
    onHide: function () {
      app.globalData.socket.removeAllListeners('login');
    },
    onShareAppMessage: function(){
      if (res.from === 'button') {
        // 来自页面内转发按钮
        var openId = wx.getStorageSync('openId')
        return {
          title: '快来挑战',
          path: '/pages/detail?otherId=' + openId,
          success: function (){
            wx.navigateTo({
              url: '/pages/detail/detail?type=friendBattle'
            })
          }
        }
      }
    },
    onUnload: function () {
      app.globalData.socket.removeAllListeners('connect')
      app.globalData.socket.removeAllListeners('connect_error')
      app.globalData.socket.removeAllListeners('login')
      app.globalData.socket.removeAllListeners('disconnect')
      app.globalData.socket.removeAllListeners('reconnect')
    }
})
