chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.query(
    { url: "*://twitter.com/*", currentWindow: true },
    function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.reload(tab.id);
      });
    }
  );
});
