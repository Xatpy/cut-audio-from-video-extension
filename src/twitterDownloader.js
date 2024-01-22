const downloadVideo = function (url, name) {
  return fetch(url)
    .then(function (response) {
      return response.blob();
    })
    .then(function (response) {
      debugger;
      const newLink = `https://cut-audio-from-video.com?url=${url}`;
      const element = document.createElement("a");
      element.style.display = "none";
      document.body.appendChild(element);
      element.href = window.URL.createObjectURL(response);
      element.setAttribute("target", "_blank");
      //element.setAttribute("download", `${name}.mp4`);
      element.setAttribute("href", newLink);
      element.click();

      console.log("Open link: ");

      window.URL.revokeObjectURL(element.href);
      document.body.removeChild(element);
    });
};

const onRequestDone = function (callback) {
  const xhrOpen = XMLHttpRequest.prototype.open;
  debugger;
  XMLHttpRequest.prototype.open = function (_, requestUrl) {
    debugger;
    if (
      /(api\.)?twitter\.com\/(i\/api\/)?(2|graphql|1\.1)\//i.test(requestUrl)
    ) {
      const xhrSend = this.send;
      this.send = function () {
        const xhrStateChange = this.onreadystatechange;
        this.onreadystatechange = function () {
          const { readyState, responseText } = this;
          if (readyState === XMLHttpRequest.DONE && responseText) {
            try {
              callback(JSON.parse(responseText));
            } catch (e) {
              console.log(e);
            }
          }
          return xhrStateChange.apply(this, arguments);
        };
        return xhrSend.apply(this, arguments);
      };
    }
    return xhrOpen.apply(this, arguments);
  };
};

const observeDom = function (callback) {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function ($element) {
        if ($element instanceof HTMLElement === false) {
          return false;
        }
        if ($element.nodeName === "IMG") {
          const $container = $element.closest("article[role='article']");
          if ($container) {
            const $group = $container.querySelector(
              "[role='group']:last-child"
            );
            if ($group) {
              callback({
                $image: $element,
                $group: $group,
              });
            }
          }
        }
      });
    });
  });
  observer.observe(document, { childList: true, subtree: true });
};

function find(source, key, list = []) {
  if (!source) {
    return list;
  }

  if (typeof source !== "object") {
    return list;
  }

  if (typeof source[key] !== "undefined") {
    list.push(source);
  } else {
    Object.values(source).forEach(function (deep) {
      list.push(...find(deep, key));
    });
  }

  return list;
}

function textify(entity) {
  const entityId = entity.id_str || entity.conversation_id_str;

  if (!entity.full_text) {
    return entityId;
  }

  let text = entity.full_text
    .split("https://t.co")[0]
    .trim()
    .replace(/(\r\n|\n|\r)/gm, "")
    .substr(0, 50);

  if (!text) {
    text = entityId;
  }

  return text;
}

function checkMediaHasVideo(media) {
  return media.type === "video" || media.type === "animated_gif";
}

const parseRequest = function (response) {
  // tweet entites
  debugger;
  const entities = [...find(response, "extended_entities")];

  // tweet card entites
  const cards = [...find(response, "string_value")]
    .map(function (value) {
      try {
        const parsedValue = JSON.parse(value.string_value);
        const mediaEntity = Object.values(parsedValue.media_entities)
          .filter(function (media) {
            return ["video", "animated_gif"].indexOf(media.type) > -1;
          })
          .shift();
        if (mediaEntity) {
          return {
            extended_entities: {
              media: [mediaEntity],
            },
            id_str: mediaEntity.id_str,
          };
        }
      } catch (e) {
        return false;
      }
      return false;
    })
    .filter(Boolean);

  return [...cards, ...entities]
    .filter(function (entity) {
      return entity.extended_entities.media.filter(checkMediaHasVideo).length;
    })
    .flatMap(function (entity) {
      const entityId = entity.id_str || entity.conversation_id_str;
      const {
        extended_entities: { media },
      } = entity;
      return media.filter(checkMediaHasVideo).map(function (item) {
        const video = item.video_info.variants
          .filter(function (variant) {
            return variant.content_type === "video/mp4";
          })
          .sort(function (first, second) {
            return second.bitrate - first.bitrate;
          })
          .shift();
        return {
          id: item.id_str,
          entityId: entityId,
          photo: item.media_url_https.substr(
            0,
            item.media_url_https.lastIndexOf(".")
          ),
          video: video.url,
          text: textify(entity),
        };
      });
    })
    .filter(function (video, index, self) {
      return self.indexOf(video) === index;
    });
};

function twitterDownloaderMain() {
  console.log("twitterDownloader Main!!");
  const videoList = [];

  onRequestDone(function (response) {
    console.log("onRequests Done!! que hay aqui()");
    debugger;
    const requestVideos = parseRequest(response);
    if (requestVideos.length) {
      videoList.push(...requestVideos);
    }
  });

  observeDom(function ({ $group, $image }) {
    const findVideo = videoList.find(function (video) {
      return $image.src.indexOf(video.photo) > -1;
    });
    const checkExtensionButton = $group.getAttribute(
      "data-twitter-video-downloader-extension"
    );
    if (findVideo && !checkExtensionButton) {
      debugger;
      $group.setAttribute("data-twitter-video-downloader-extension", "true");
      const { width, height } = $group
        .querySelector("svg")
        .getBoundingClientRect();

      const $button = document.createElement("button");
      $button.classList.add("extension-button");
      $button.setAttribute("role", "button");
      $button.setAttribute("title", "Open with");
      $button.insertAdjacentHTML(
        "beforeend",
        Mustache.render(Button, {
          width,
          height,
        })
      );
      $group.appendChild($button);
      $button.addEventListener("click", async function (event) {
        event.preventDefault();
        this.disabled = true;
        this.classList.add("loading");
        const mixedVideos = videoList
          .filter(function (v) {
            return v.entityId === findVideo.entityId;
          })
          .filter(function (value, index, self) {
            return (
              index ===
              self.findIndex(function (find) {
                return find.id === value.id;
              })
            );
          });
        for (const video of mixedVideos) {
          console.log("--+++++++- Video from!!!!: ", video.video, video);
          await downloadVideo(video.video, video.text);
        }
        this.classList.remove("loading");
        this.classList.add("success");
      });
    }
  });
}
