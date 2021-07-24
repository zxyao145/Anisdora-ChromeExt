(function () {
  const api = "https://cdn.jsdelivr.net/gh/zxyao145/awesome-websites/list.json";
  let storageDataCache = [];

  /**
   * 处理返回的json数据
   * @param {object} msg 
   * @param {number} tabId 
   */
  function handleResJson(msg, tab) {
    randomJump(msg.data, tab)
  }


  /**
   * 随机跳转到一个网站
   * @param {Array<object>} dataArr 
   * @param {number} tabId 
   */
  function randomJump(dataArr, tab) {
    const randomIndex = Math.floor(Math.random() * dataArr.length);
    const info = dataArr[randomIndex];
    const url = info[0];
    // console.log(url)
    dataArr.splice(randomIndex, 1)
    storageDataCache = dataArr;
    chrome.tabs.update(tab.id, { url: url });
  }


  /**
   * 进行ajax请求
   * @param {number} tabId 
   */
  function queryData(tab) {
    const xmlHttp = new XMLHttpRequest();
    if (xmlHttp.overrideMimeType) {//如果来自服务器的响应没有XML mime-type头部，则一些浏览器不能正常运行
      xmlHttp.overrideMimeType("application/text");
    }
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4) {
        if (xmlHttp.status == 200) {
          const msgText = xmlHttp.responseText;
          const msg = JSON.parse(msgText);
          handleResJson(msg, tab);
        }
      }
    };
    xmlHttp.open("GET", api, true);
    xmlHttp.send(null);
  }


  let lastClickTime;
  chrome.browserAction.onClicked.addListener(function (tab) {
    // 禁止连续点击
    const timeNow = Date.now();
    if (lastClickTime) {
      if (timeNow - lastClickTime < 500) {
        lastClickTime = timeNow;
        return;
      }
    }
    lastClickTime = timeNow;

    if (storageDataCache && storageDataCache.length > 0) {
      randomJump(storageDataCache, tab);
    } else {
      queryData(tab);
    }
    return;
  });
})();