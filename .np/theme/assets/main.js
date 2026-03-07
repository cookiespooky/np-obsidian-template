(function () {
  function withBasePath(path) {
    var base = (window.__notepubBaseURL || "").replace(/\/+$/, "");
    if (!path) return base || "/";
    if (/^https?:\/\//.test(path)) return path;
    if (path.charAt(0) !== "/") path = "/" + path;
    return (base || "") + path;
  }

  function onIdle(fn) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fn, { timeout: 1200 });
      return;
    }
    window.setTimeout(fn, 350);
  }

  function isRootRelative(url) {
    return !!url && url.charAt(0) === "/" && url.indexOf("//") !== 0;
  }

  function normalizeRootRelativeUrls(scope) {
    var root = scope || document;
    var attrs = [
      { selector: "a[href]", attr: "href" },
      { selector: "img[src]", attr: "src" },
      { selector: "video[src]", attr: "src" },
      { selector: "audio[src]", attr: "src" },
      { selector: "source[src]", attr: "src" }
    ];

    attrs.forEach(function (item) {
      var nodes = root.querySelectorAll(item.selector);
      nodes.forEach(function (node) {
        var value = node.getAttribute(item.attr) || "";
        if (!isRootRelative(value)) return;
        node.setAttribute(item.attr, withBasePath(value));
      });
    });
  }

  function isVideoAsset(path) {
    return /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[\?#].*)?$/i.test(path || "");
  }

  function normalizeVideoEmbeds(scope) {
    var root = scope || document;
    var imgs = root.querySelectorAll(".prose img[src]");
    imgs.forEach(function (img) {
      var src = img.getAttribute("src") || "";
      if (!isVideoAsset(src)) return;

      var video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.preload = "metadata";
      video.className = "prose-video";

      var alt = img.getAttribute("alt");
      if (alt) video.setAttribute("aria-label", alt);
      var title = img.getAttribute("title");
      if (title) video.setAttribute("title", title);

      img.replaceWith(video);
    });
  }

  function markExternalLinks(scope) {
    var root = scope || document;
    var links = root.querySelectorAll(".prose a[href]");
    if (!links.length) return;
    var host = window.location.hostname;
    links.forEach(function (link) {
      if (link.dataset.externalMarked === "1") return;
      link.dataset.externalMarked = "1";

      var href = link.getAttribute("href") || "";
      if (!href || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
        return;
      }
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (e) {
        return;
      }
      if (url.hostname && url.hostname !== host) {
        link.classList.add("is-external");
      }
    });
  }

  function initHeadingAnchors(scope) {
    var root = scope || document;
    var headings = root.querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6");
    if (!headings.length) return;

    var cyrMap = {
      "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
      "ж": "zh", "з": "z", "и": "i", "й": "i", "к": "k", "л": "l", "м": "m",
      "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
      "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "shch",
      "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya"
    };

    function slugify(text) {
      var s = (text || "").toLowerCase().trim();
      var out = "";
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        out += Object.prototype.hasOwnProperty.call(cyrMap, ch) ? cyrMap[ch] : ch;
      }
      out = out
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      return out;
    }

    var used = Object.create(null);
    headings.forEach(function (h) {
      if (h.id) {
        used[h.id] = true;
        return;
      }
      var base = slugify(h.textContent || "");
      if (!base) return;
      var id = base;
      var n = 2;
      while (used[id] || document.getElementById(id)) {
        id = base + "-" + n;
        n += 1;
      }
      h.id = id;
      used[id] = true;
    });
  }

  function initSearchModal() {
    var modal = document.querySelector("[data-search-modal]");
    var openBtn = document.querySelector("[data-search-open]");
    var closeBtns = document.querySelectorAll("[data-search-close]");
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");

    if (!modal || !openBtn) return;

    var inited = false;
    var timeout;
    var staticIndexPromise = null;

    function openModal() {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      if (!inited) {
        initSearchLogic();
        inited = true;
      }
      if (input) input.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    function renderItems(items) {
      if (!results) return;
      if (!items || items.length === 0) {
        results.innerHTML = '<p class="muted">Пока ничего не найдено.</p>';
        return;
      }
      var html = "<ul>";
      items.forEach(function (item) {
        var title = item.title || "";
        var path = withBasePath(item.path || "");
        var snippet = item.snippet || "";
        var thumb = item.image || item.thumbnail || "/assets/placeholder.svg";
        if (!/^https?:\/\//.test(thumb)) thumb = withBasePath(thumb);
        html += '<li><a class="search-item-card" href="' + path + '">';
        html += '<img class="search-item-thumb" src="' + thumb + '" alt="" loading="lazy" decoding="async">';
        html += '<span class="search-item-body"><span class="search-item-title">' + title + "</span>";
        if (snippet) html += '<span class="search-item-snippet muted">' + snippet + "</span>";
        html += "</span></a></li>";
      });
      html += "</ul>";
      results.innerHTML = html;
    }

    function getStaticIndex() {
      if (staticIndexPromise) return staticIndexPromise;
      staticIndexPromise = fetch(withBasePath("/search.json"))
        .then(function (res) { return res.json(); })
        .then(function (data) { return data.items || []; })
        .catch(function () { return []; });
      return staticIndexPromise;
    }

    function fetchStatic(query) {
      return getStaticIndex().then(function (all) {
        var q = query.toLowerCase();
        var items = all.filter(function (item) {
          return (item.title || "").toLowerCase().indexOf(q) !== -1 ||
            (item.snippet || "").toLowerCase().indexOf(q) !== -1;
        }).slice(0, 10);
        renderItems(items);
      });
    }

    function fetchServer(query) {
      return fetch(withBasePath("/v1/search") + "?q=" + encodeURIComponent(query))
        .then(function (res) { return res.json(); })
        .then(function (data) { renderItems(data.items || []); })
        .catch(function () { renderItems([]); });
    }

    function runSearch(query) {
      if (!query || query.length < 2) {
        renderItems([]);
        return;
      }
      if (window.__notepubSearchMode === "static") {
        fetchStatic(query);
      } else {
        fetchServer(query);
      }
    }

    function initSearchLogic() {
      if (!input) return;
      input.addEventListener("input", function () {
        var q = input.value.trim();
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          runSearch(q);
        }, 180);
      });
    }

    openBtn.addEventListener("click", openModal);
    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function initHubFilters() {
    var filterWrap = document.querySelector("[data-hub-filters]");
    if (!filterWrap) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-article-card]"));
    if (!cards.length) return;
    var titleEl = document.querySelector("[data-blog-title]");
    var descEl = document.querySelector("[data-blog-description]");

    function setActive(btn) {
      var buttons = filterWrap.querySelectorAll("[data-hub]");
      buttons.forEach(function (button) {
        button.classList.toggle("is-active", button === btn);
      });
    }

    function applyFilter(hub) {
      cards.forEach(function (card) {
        var hubs = (card.getAttribute("data-hubs") || "").split(/\s+/).filter(Boolean);
        var matches = hub === "all" || hubs.indexOf(hub) !== -1;
        card.classList.toggle("is-hidden", !matches);
      });
    }

    function applyHeader(btn) {
      if (!titleEl || !descEl || !btn) return;
      var title = btn.getAttribute("data-hub-title") || "Последние публикации по всем хабам";
      var desc = btn.getAttribute("data-hub-description") || "Выберите хаб, чтобы отфильтровать статьи.";
      titleEl.textContent = title;
      descEl.textContent = desc;
      descEl.style.display = "";
    }

    filterWrap.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.hasAttribute("data-hub")) return;
      var hub = target.getAttribute("data-hub");
      setActive(target);
      applyFilter(hub);
      applyHeader(target);
    });
  }

  function initMobileNav() {
    var navPanel = document.querySelector("[data-nav-panel]");
    var navOpen = document.querySelector("[data-nav-open]");
    var navCloseBtns = document.querySelectorAll("[data-nav-close]");
    var header = document.querySelector(".site-header");
    if (!navPanel || !navOpen || !header) return;

    function lockBodyScroll() {
      document.body.classList.add("nav-open");
    }

    function unlockBodyScroll() {
      document.body.classList.remove("nav-open");
    }

    function openNav() {
      navPanel.classList.add("is-open");
      navPanel.setAttribute("aria-hidden", "false");
      lockBodyScroll();
      navOpen.classList.add("is-open");
      navOpen.setAttribute("aria-label", "Закрыть навигацию");
    }

    function closeNav() {
      navPanel.classList.remove("is-open");
      navPanel.setAttribute("aria-hidden", "true");
      unlockBodyScroll();
      navOpen.classList.remove("is-open");
      navOpen.setAttribute("aria-label", "Открыть навигацию");
    }

    function toggleNav() {
      if (navPanel.classList.contains("is-open")) {
        closeNav();
      } else {
        openNav();
      }
    }

    navOpen.addEventListener("click", toggleNav);
    navCloseBtns.forEach(function (btn) {
      btn.addEventListener("click", closeNav);
    });

    header.addEventListener("click", function (event) {
      var target = event.target;
      if (!target) return;
      var button = target.closest("a, button");
      if (!button) return;
      if (button.hasAttribute("data-nav-open")) return;
      closeNav();
    });

    function setHeaderHeight() {
      document.documentElement.style.setProperty("--header-height", header.offsetHeight + "px");
    }

    setHeaderHeight();
    window.addEventListener("resize", setHeaderHeight);
  }

  function parseNpEmbedConfig(raw) {
    var config = {};
    if (!raw) return config;
    raw.split(/\r?\n/).forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var idx = trimmed.indexOf(":");
      if (idx <= 0) return;
      var key = trimmed.slice(0, idx).trim().toLowerCase();
      var value = trimmed.slice(idx + 1).trim();
      if (!value) return;
      config[key] = value;
    });
    return config;
  }

  function initMarkdownEmbeds(scope) {
    var root = scope || document;
    var blocks = root.querySelectorAll("pre > code.language-np-embed");
    if (!blocks.length) return;

    blocks.forEach(function (code) {
      var pre = code.parentElement;
      if (!pre || pre.dataset.embedInited === "1") return;
      pre.dataset.embedInited = "1";

      var cfg = parseNpEmbedConfig(code.textContent || "");
      var id = (cfg.id || "").toLowerCase();

      // Allow only simple slug-like ids to avoid path injection.
      if (!/^[a-z0-9-]+$/.test(id)) return;

      var title = cfg.title || ("Animation: " + id);
      var src = withBasePath("/assets/animations/" + id + "/index.html?motion=on");

      var wrapper = document.createElement("div");
      wrapper.className = "np-embed";

      var iframe = document.createElement("iframe");
      iframe.className = "np-embed-frame";
      iframe.src = src;
      iframe.title = title;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer";
      // Needed for fetch/XHR to same-site assets from inside the sandboxed iframe.
      iframe.sandbox = "allow-scripts allow-same-origin";
      iframe.style.width = "100%";
      iframe.style.aspectRatio = "1 / 1";
      iframe.style.border = "none";
      iframe.style.display = "block";
      iframe.style.background = "#fff";

      wrapper.appendChild(iframe);
      pre.replaceWith(wrapper);
    });
  }

  normalizeRootRelativeUrls(document);
  normalizeVideoEmbeds(document.querySelector("main") || document);
  initMarkdownEmbeds(document.querySelector("main") || document);
  initSearchModal();
  initHubFilters();
  initMobileNav();

  if (window.location.hash) {
    window.setTimeout(function () {
      initHeadingAnchors(document.querySelector("main") || document);
      var id = decodeURIComponent(window.location.hash.slice(1));
      var target = document.getElementById(id);
      if (target) target.scrollIntoView();
    }, 0);
  } else {
    onIdle(function () {
      initHeadingAnchors(document.querySelector("main") || document);
    });
  }

  window.addEventListener("hashchange", function () {
    var hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "";
    if (!hash) return;
    var target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView();
      return;
    }
    initHeadingAnchors(document.querySelector("main") || document);
    target = document.getElementById(hash);
    if (target) target.scrollIntoView();
  });

  onIdle(function () {
    markExternalLinks(document.querySelector("main") || document);
  });
})();
