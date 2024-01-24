// We need to inject the script in the twitter page
// in order to be able to inspect all the XHR requests
const element = document.createElement("script");
element.src = chrome.runtime.getURL("src/twitterDownloader.js");
(document.head || document.documentElement).appendChild(element);
