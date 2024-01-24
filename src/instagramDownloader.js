const BASE_URL = "https://www.instagram.com";
const QUERY_HASH_MD5 = "9f8827793ef34641b2fb195d4d41151c";

async function download_by_url(url, extension) {
  const newLink = `https://cut-audio-from-video.com?url=${encodeURIComponent(
    url
  )}`;
  const element = document.createElement("a");
  element.style.display = "none";
  document.body.appendChild(element);
  //   element.href = window.URL.createObjectURL(response);
  element.setAttribute("target", "_blank");
  element.setAttribute("href", newLink + ".mp4");
  element.click();

  window.URL.revokeObjectURL(element.href);
  document.body.removeChild(element);

  return true;
}

async function get_info(post_id) {
  const csrftoken = document.cookie.split(" ")[2].split("=")[1];
  const claim = sessionStorage.getItem("www-claim-v2");
  const options = {
    headers: {
      "x-asbd-id": "198387",
      "x-csrftoken": csrftoken,
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": claim,
      "x-instagram-ajax": "1006598911",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: "https://www.instagram.com",
    referrerPolicy: "strict-origin-when-cross-origin",
    method: "GET",
    mode: "cors",
    credentials: "include",
  };

  const post_info_url = new URL(`/api/v1/media/${post_id}/info`, BASE_URL);
  const post_info = await fetch(post_info_url, options).then((res) =>
    res.json()
  );

  return post_info;
}

function download_button_constructor(parent) {
  const newEl = document.createElement("div");
  //   newEl.innerText = "Cut-audio-from-video.com";

  newEl.style.background = "#404040";
  newEl.style.color = "#feb244";
  newEl.style.zIndex = 100;
  newEl.style.padding = "1rem";
  newEl.style.height = "fit-content";
  newEl.style.borderRadius = "15px";
  newEl.style.cursor = "pointer";
  newEl.style.display = "flex";
  newEl.style.alignItems = "center";

  parent.position = "relative";
  newEl.style.position = "absolute";
  newEl.style.top = 0;
  newEl.style.left = 0;
  newEl.className = "download_button";
  parent.prepend(newEl);

  const image = document.createElement("img");
  image.src =
    "https://www.cut-audio-from-video.com/imgs/chitulaLogodf5a0280963d444acef2..svg";
  image.width = 24;
  image.height = 24;
  newEl.prepend(image);

  return newEl;
}

async function post_video(node) {
  const story_candidate_arr = window.location.pathname.split("/stories/");
  if (story_candidate_arr.length > 1) return;

  const videoEl = node.querySelector("video.x1lliihq.x5yr21d.xh8yej3");
  if (!videoEl) return;

  const parent = videoEl.parentNode;

  const newEl = download_button_constructor(parent);

  newEl.addEventListener("click", async () => {
    const post_regex = /\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/;
    let post_regex_groups = window.location.pathname.match(post_regex);
    if (!post_regex_groups) {
      let _flag = true;
      const box =
        parent.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
          .parentNode.parentNode.parentNode.parentNode.parentNode;
      if (box.tagName === "ARTICLE") {
        const linkEl =
          box?.childNodes[0].childNodes[0].childNodes[0].childNodes[1]
            .childNodes[0].childNodes[0].childNodes[1].childNodes[1]
            .childNodes[0];
        if (linkEl.tagName === "A") {
          const href = linkEl.href;
          post_regex_groups = href.match(post_regex);
          _flag = false;
        }
      }
      if (_flag) return;
    }
    const shortcode = post_regex_groups[2];

    const url = new URL("/graphql/query/", BASE_URL);
    url.searchParams.set("query_hash", QUERY_HASH_MD5);
    url.searchParams.set("variables", JSON.stringify({ shortcode }));

    const response = await fetch(url).then((res) => res.json());
    const post_id = response.data.shortcode_media.id;

    const post_info = await get_info(post_id);

    if (
      post_info.items[0].video_versions &&
      post_info.items[0].media_type === 2
    ) {
      const video_url = post_info.items[0].video_versions.shift().url;
      await download_by_url(video_url, "mp4");
      return;
    }

    const media_list = post_info.items[0].carousel_media;
    if (media_list.length < 2) return;

    const listEl = document.querySelector("ul._acay");
    let pos = -1;
    listEl.childNodes.forEach((child, index) => {
      if (pos !== -1) return;
      const video_tag = child.querySelector("video.x1lliihq.x5yr21d.xh8yej3");
      if (!video_tag) return;
      const candidate_src = video_tag.src;
      const current_src = videoEl.src;
      if (current_src === candidate_src) {
        pos = index;
      }
    });

    if (pos > 0) {
      const video_item = media_list[pos - 1];
      if (video_item.media_type === 2) {
        const video_url = video_item.video_versions.shift().url;
        await download_by_url(video_url, "mp4");
      }
    }
  });
}

function scan(node) {
  post_video(node);
}

function start_DOM_observer(scan_func) {
  var observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach((node) => {
          scan_func(node);
        });
      }
    });
  });

  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  observer.observe(targetNode, config);
}

function start_DOM_loaded(scan_func) {
  scan_func(document);
}

function instagramDownloaderMain() {
  start_DOM_observer(scan);
  start_DOM_loaded(scan);
}

instagramDownloaderMain();
