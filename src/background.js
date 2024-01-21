chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.url) {
    // Log or use the URL as needed
    console.log("Current URL on Twitter:", message.url);
  }
});
