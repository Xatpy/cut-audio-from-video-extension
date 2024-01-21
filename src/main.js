var currentUrl = window.location.href;

console.log("Hello world!!!", currentUrl);

const isInstagram = currentUrl.includes("instagram.com");
if (isInstagram) {
  instagramDownloaderMain();
} else {
  console.log("TODO. Twitter");
}
