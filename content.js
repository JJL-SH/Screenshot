chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
  // 获取页面尺寸然后使用回调函数回传数据
  if (msg.status === 1) {
    var pageSize = {
      scrollWidth: document.body.scrollWidth,
      scrollHeight: document.body.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight
    };
    
    callback(pageSize);
  }
  // 执行滚动任务
  if (msg.status === 2) {
    window.scrollBy(msg.x, msg.y);
    callback();
  }
  // 获取到后台图片资源在前台下载图片
  if(msg.status === 3) {
    var link = document.createElement('a');
    link.download = 'test.png';
    link.href = msg.base64;

    $('body').append(link);
    link.click()
  }
})