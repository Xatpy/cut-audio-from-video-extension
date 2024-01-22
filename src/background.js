// function injectContentScript() {
//   const script = document.createElement("script");
//   script.src = chrome.runtime.getURL("content.js");
//   document.head.appendChild(script);
// }

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

// chrome.runtime.onInstalled.addListener(function () {
//   console.log("XHR Logger extension installed.");
// });

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (changeInfo.status === "complete") {
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       function: injectContentScript,
//     });
//   }
// });
