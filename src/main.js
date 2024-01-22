var currentUrl = window.location.href;

console.log("Hello world!!!", currentUrl);

// Intercept XHR requests
const originalOpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function (method, url) {
  // Log the URL
  console.log(`XHR Request: ${url}`);

  // Send a message to the extension to log the URL
  chrome.runtime.sendMessage({ action: "logXHR", url: url });

  // Call the original open method
  originalOpen.apply(this, arguments);
};

const isInstagram = currentUrl.includes("instagram.com");
if (isInstagram) {
  instagramDownloaderMain();
} else {
  twitterDownloaderMain();
}
