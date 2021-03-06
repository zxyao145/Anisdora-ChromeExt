(function () {
  const api = "https://cdn.jsdelivr.net/gh/zxyao145/awesome-websites/list.json";
  const appName = " ";
  const localStorageVersionKey = appName + "_update";
  const localStorageFullDataKey = appName + "_data";
  const localStorageDiffDataKey = appName + "_diff_data";


  /**
   * 处理返回的json数据
   * @param {object} msg 
   * @param {number} tabId 
   */
  function handleResJson(msg, tab) {
    const version = msg.update;
    const lastVersion = localStorage.getItem(localStorageVersionKey);
    if (!lastVersion) {
      localStorage.setItem(localStorageVersionKey, version);
      const jsonStr = JSON.stringify(msg.data);
      localStorage.setItem(localStorageFullDataKey, jsonStr);
      localStorage.setItem(localStorageDiffDataKey, jsonStr);
      randomJump(msg.data, tab)
    } else {
      if (lastVersion === version) {
        const jsonStr = JSON.stringify(msg.data);
        localStorage.setItem(localStorageFullDataKey, jsonStr);
        localStorage.setItem(localStorageDiffDataKey, jsonStr);
        randomJump(msg.data, tab)
      } else {
        const lastData = JSON.parse(localStorage.getItem(localStorageFullDataKey));
        const curDataDiff = Array.from(new Set(msg.data));
        for (let i = 0; i < lastData.length; i++) {
          let index = curDataDiff.indexOf(lastData[i]);
          if (index > 0) {
            curDataDiff.splice(index, 1);
          }
        }
        localStorage.setItem(localStorageFullDataKey, JSON.stringify(msg.data));
        localStorage.setItem(localStorageDiffDataKey, JSON.stringify(curDataDiff));
        randomJump(curDataDiff, tab)
      }
    }
  }


  let timeout = -1;
  /**
   * 随机跳转到一个网站
   * @param {Array<object>} dataArr 
   * @param {number} tabId 
   */
  function randomJump(dataArr, tab) {
    const randomIndex = Math.floor(Math.random() * dataArr.length);
    const info = dataArr[randomIndex];
    let url = info[0];
    if (!url) {
      url = info.url;
    }
    // console.log(url)
    dataArr.splice(randomIndex, 1)
    localStorage.setItem(localStorageDiffDataKey, JSON.stringify(dataArr));
    chrome.tabs.update(tab.id, { url: url });

    if (timeout !== -1) {
      window.clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      chrome.browserAction.setIcon({
        path: {
          "19": "images/logo-19.png",
          "38": "images/logo-38.png"
        }
      });
      timeout = -1;
    }, 500);
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
    xmlHttp.ontimeout = function () {
      alert(appName + " 请求超时，无法获取随机网站。\n" + appName + " request timed out, unable to get the random website");
    };
    xmlHttp.onerror = function (e) {
      console.error(e);
      alert(appName + " 请求发生错误，无法获取随机网站。\n" + appName + " an error occurred, unable to get the random website");
    };

    // 指定 10 秒钟超时
    xmlHttp.timeout = 10 * 1000;
    xmlHttp.open("GET", api, true);
    xmlHttp.send(null);
  }


  let lastClickTime;
  chrome.browserAction.onClicked.addListener(function (tab) {
    if (timeout === -1) {
      chrome.browserAction.setIcon({
        path: {
          "19": "images/logo-h-19.png",
          "38": "images/logo-h-38.png"
        }
      });
    }

    // 禁止连续点击
    const timeNow = Date.now();
    if (lastClickTime) {
      if (timeNow - lastClickTime < 500) {
        lastClickTime = timeNow;
        return;
      }
    }
    lastClickTime = timeNow;

    const storageDataCache = JSON.parse(localStorage.getItem(localStorageDiffDataKey));
    if (storageDataCache && storageDataCache.length > 0) {
      randomJump(storageDataCache, tab);
    } else {
      queryData(tab);
    }
    return;
  });
})();