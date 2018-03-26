var capture = {
  tabId: null,
  canvas: document.createElement('canvas'),
  /**
   * 获取页面尺寸
   * @param  {[type]} tabId 当前激活页面 ID
   * @return {[type]}       [description]
   *
   * 在回调函数种处理返回数据
   */
  fetchPageSize: function (tabId) {
    var self = this;

    chrome.tabs.sendMessage(tabId, {status:1}, self.onResponseSize)
  },

  /**
   * 预开始截屏
   * @return {[type]} [description]
   *
   * 初始位置数据
   */
  startCapture: function () {
    this.posY = 0;
    this.scrollPage(this.tabId, 0, -1 * this.scrollHeight);
  },

  /**
   * 滚动页面
   * @param  {[type]} tabId 当前激活页面 ID
   * @param  {[type]} x     X 轴位置
   * @param  {[type]} y     Y 轴位置
   * @return {[type]}       [description]
   *
   * 向前台页面发送滚动请求，在回调函数中处理结束滚动方法
   */
  scrollPage: function (tabId, x, y) {
    var self = this;

    chrome.tabs.sendMessage(tabId, {status:2, x:x, y:y}, self.onScrollDone);
  },

  /**
   * 截屏任务
   * @param  {[type]} w 初始宽度
   * @param  {[type]} h 初始高度
   * @return {[type]}   [description]
   *
   * 执行 chrome 截屏方法获取图片数据
   * 图片数据为 base64 数据
   * 然后利用 canvas 把图片数据写入指定位置（这里需要新建一个图片资源，并且需要在加载完毕之后才能执行写入图片任务）
   * 判断当前滚动位置是否为最后的位置，如果是则触发保存图片任务
   * 否则的话再次发送滚动页面请求
   */
  captureBlock: function (w, h) {
    var self = this;
    var width = w || self.clientWidth;
    var height = h || self.clientHeight; 
    var blockImg = new Image();
    var canvas = self.canvas;

    chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    }, function (img) {

      blockImg.onload = function () {
        var ctx = canvas.getContext('2d');
        var y = 0;

        if (self.posY + self.clientHeight >= self.scrollHeight) {
          y = self.clientHeight - self.scrollHeight % self.clientHeight;
          ctx.drawImage(blockImg, 0, 0, width, height, 0, self.posY - y, width, height);
          self.postImg();
        } else {
          ctx.drawImage(blockImg, 0, 0, width, height, 0, self.posY, width, height);
          self.posY += self.clientHeight;
          self.scrollPage(self.tabId, 0, self.clientHeight)
        }
      }

      blockImg.src = img;
    })
  },

  /**
   * 获取图片
   * @return {[type]} [description]
   *
   * 把 canvas 转化成 base64 发送到前台页面
   */
  postImg: function () {
    chrome.tabs.sendMessage(capture.tabId, {status:3, base64:capture.canvas.toDataURL()})
  },

  /**
   * 处理数据
   * @param  {[type]} size 回调数据
   * @return {[type]}      [description]
   *
   * 把所有数据添加入 capture 中
   * 然后执行截屏任务
   */
  onResponseSize: function (size) {
    capture.scrollWidth = size.scrollWidth;
    capture.scrollHeight = size.scrollHeight;
    capture.clientWidth = size.clientWidth;
    capture.clientHeight = size.clientHeight;

    capture.canvas.width = size.scrollWidth;
    capture.canvas.height = size.scrollHeight;

    capture.startCapture();
  },

  /**
   * 结束滚动
   * @return {[type]} [description]
   *
   * 在 300毫秒之后执行截屏任务
   */
  onScrollDone: function () {
    setTimeout(function () {
      capture.captureBlock();
    }, 300);
  }
}

/**
 * 绑定点击事件触发截屏功能
 * @return {[type]} [description]
 *
 * 在这里获取到当前激活页面的 ID 用于之后通知前台所用
 * 之后执行获取页面尺寸方法
 */
document.getElementById('screenshot').onclick = function () {
  chrome.tabs.getSelected(function (tab) {
    capture.tabId = tab.id;
    capture.fetchPageSize(tab.id);
  })
}
