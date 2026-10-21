/* ============================================================================
   app.js — renders the whole page from the SITE object in content.js.
   Plain vanilla JS, no build step. Everything here reads content.js;
   nothing here should need editing to update the site's content.
   ============================================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Small DOM helpers                                                   */
  /* ------------------------------------------------------------------ */
  function ce(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function titleCase(slug) {
    return String(slug)
      .split(/[-_]/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  function getLabel(kind, slug) {
    const overrides = (SITE.filterLabels && SITE.filterLabels[kind]) || {};
    return overrides[slug] || titleCase(slug);
  }

  function initials(name) {
    return String(name)
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function testImage(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function resolveUrl(path, base) {
    try {
      return new URL(path, base).toString();
    } catch (e) {
      return path;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.pointerEvents = "none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("execCommand copy failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Video playback: at most one video plays at a time, site-wide.       */
  /* Desktop-only scroll autoplay via IntersectionObserver; disabled on  */
  /* touch devices and when prefers-reduced-motion is set.               */
  /* ------------------------------------------------------------------ */
  const allVideoEls = new Set();
  const autoplayRegistry = new Set();
  let currentPlaying = null;
  let io = null;

  const reducedMotionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopMql = window.matchMedia("(hover: hover) and (pointer: fine)");

  function autoplayEnabled() {
    return desktopMql.matches && !reducedMotionMql.matches;
  }

  function playVideo(video) {
    allVideoEls.forEach((v) => {
      if (v !== video && !v.paused) v.pause();
    });
    currentPlaying = video;
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function pauseVideo(video) {
    video.pause();
    if (currentPlaying === video) currentPlaying = null;
  }

  function ensureObserver() {
    if (io) return io;
    io = new IntersectionObserver(
      (entries) => {
        if (!autoplayEnabled()) return;
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (video.paused) playVideo(video);
          } else if (video === currentPlaying) {
            pauseVideo(video);
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    return io;
  }

  function registerAutoplayCandidate(video) {
    autoplayRegistry.add(video);
    ensureObserver().observe(video);
  }

  /* ------------------------------------------------------------------ */
  /* Icons (inline SVG, no external assets)                              */
  /* ------------------------------------------------------------------ */
  const PLAY_ICON_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"/></svg>';
  const CAMERA_ICON_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4Zm14.5 3.4 3-1.9A1 1 0 0 1 23 7.3v9.4a1 1 0 0 1-1.5.87l-3-1.9v-6.3Z"/></svg>';

  /* ------------------------------------------------------------------ */
  /* Media card: local <video> or social embed facade                    */
  /* ------------------------------------------------------------------ */
  function createPlaceholderNode(title, note) {
    const div = ce("div", "media-placeholder");
    const icon = document.createElement("span");
    icon.className = "media-placeholder__icon";
    icon.innerHTML = CAMERA_ICON_SVG;
    div.appendChild(icon);
    div.appendChild(ce("div", "media-placeholder__title", title));
    div.appendChild(ce("div", "media-placeholder__note", note || "Preview unavailable"));
    return div;
  }

  function buildLocalVideoFrame(item, opts) {
    const frame = ce("div", "media-frame");
    frame.appendChild(ce("span", "media-badge", "MP4"));

    const video = document.createElement("video");
    video.preload = "none";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");
    video.src = item.source.src;

    // Shown until we know a poster loaded OR the video actually starts
    // playing — with preload="none" the <video> never attempts to fetch
    // its source (so 'error' never fires) until playback is requested, so
    // without this the card would just be an empty box until tapped.
    const placeholder = createPlaceholderNode(item.title, item.brand || "");

    if (item.source.poster) {
      testImage(item.source.poster).then((ok) => {
        if (ok) {
          video.poster = item.source.poster;
          placeholder.hidden = true;
        }
      });
    }

    video.addEventListener("playing", () => {
      placeholder.hidden = true;
    });

    video.addEventListener("error", () => {
      video.hidden = true;
      playBtn.hidden = true;
      placeholder.hidden = false;
      allVideoEls.delete(video);
      autoplayRegistry.delete(video);
      if (io) io.unobserve(video);
    });

    const playBtn = ce("button", "media-play-btn");
    playBtn.type = "button";
    playBtn.setAttribute("aria-label", "Play " + item.title);
    const iconWrap = document.createElement("span");
    iconWrap.className = "media-play-btn__icon";
    iconWrap.innerHTML = PLAY_ICON_SVG;
    playBtn.appendChild(iconWrap);

    playBtn.addEventListener("click", () => {
      if (video.paused) playVideo(video);
      else pauseVideo(video);
    });
    video.addEventListener("play", () => {
      playBtn.classList.add("is-playing");
      playBtn.setAttribute("aria-label", "Pause " + item.title);
    });
    video.addEventListener("pause", () => {
      playBtn.classList.remove("is-playing");
      playBtn.setAttribute("aria-label", "Play " + item.title);
    });

    frame.append(video, placeholder, playBtn);
    allVideoEls.add(video);

    if (opts && opts.autoplayEligible) {
      registerAutoplayCandidate(video);
    }

    return frame;
  }

  const EMBED_SRC = {
    tiktok: "https://www.tiktok.com/embed.js",
    instagram: "https://www.instagram.com/embed.js",
  };
  const embedScriptState = { tiktok: "unloaded", instagram: "unloaded" };
  const embedScriptWaiters = { tiktok: [], instagram: [] };

  function rerunTikTokScript() {
    // TikTok's widget.js scans the page for blockquotes on load, but doesn't
    // expose a public re-scan method for blockquotes added afterwards. We
    // re-append a script tag with the same src — the browser serves it from
    // its HTTP cache (no extra network fetch) and the widget re-processes.
    const script = document.createElement("script");
    script.src = EMBED_SRC.tiktok;
    script.async = true;
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    document.body.appendChild(script);
  }

  function ensurePlatformScript(platform) {
    return new Promise((resolve, reject) => {
      const state = embedScriptState[platform];
      if (state === "loaded") {
        if (platform === "tiktok") rerunTikTokScript();
        resolve();
        return;
      }
      if (state === "error") {
        reject();
        return;
      }
      if (state === "loading") {
        embedScriptWaiters[platform].push({ resolve, reject });
        return;
      }
      embedScriptState[platform] = "loading";
      const script = document.createElement("script");
      script.src = EMBED_SRC[platform];
      script.async = true;
      script.onload = () => {
        embedScriptState[platform] = "loaded";
        resolve();
        embedScriptWaiters[platform].forEach((w) => w.resolve());
        embedScriptWaiters[platform] = [];
      };
      script.onerror = () => {
        embedScriptState[platform] = "error";
        reject();
        embedScriptWaiters[platform].forEach((w) => w.reject());
        embedScriptWaiters[platform] = [];
      };
      document.body.appendChild(script);
    });
  }

  function showSocialFallback(frame, item) {
    const badge = frame.querySelector(".media-badge");
    frame.innerHTML = "";
    if (badge) frame.appendChild(badge);
    const fb = ce("div", "media-fallback-link");
    const icon = document.createElement("span");
    icon.className = "media-placeholder__icon";
    icon.innerHTML = CAMERA_ICON_SVG;
    fb.appendChild(icon);
    fb.appendChild(ce("div", "media-placeholder__title", item.title));
    const link = document.createElement("a");
    link.href = item.source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "btn btn--small";
    link.textContent = "View on " + (item.source.type === "tiktok" ? "TikTok" : "Instagram") + " ↗";
    fb.appendChild(link);
    frame.appendChild(fb);
  }

  function loadSocialEmbed(frame, item) {
    const platform = item.source.type;
    const badge = frame.querySelector(".media-badge");
    frame.innerHTML = "";
    if (badge) frame.appendChild(badge);

    const container = ce("div", "media-embed-container");
    container.style.position = "absolute";
    container.style.inset = "0";
    container.style.overflow = "hidden";
    frame.appendChild(container);

    let blockquote;
    if (platform === "tiktok") {
      blockquote = document.createElement("blockquote");
      blockquote.className = "tiktok-embed";
      blockquote.setAttribute("cite", item.source.url);
      // TikTok's embed script reads the video ID from this attribute; without
      // it the embed loads blank (embed/v2/null).
      const idMatch = String(item.source.url).match(/\/(?:video|photo)\/(\d+)/);
      if (idMatch) blockquote.setAttribute("data-video-id", idMatch[1]);
      blockquote.style.maxWidth = "100%";
      blockquote.style.minWidth = "100%";
      const a = document.createElement("a");
      a.href = item.source.url;
      a.textContent = item.title;
      blockquote.appendChild(a);
    } else {
      blockquote = document.createElement("blockquote");
      blockquote.className = "instagram-media";
      blockquote.setAttribute("data-instgrm-permalink", item.source.url);
      blockquote.setAttribute("data-instgrm-version", "14");
      blockquote.style.width = "100%";
    }
    container.appendChild(blockquote);

    let settled = false;

    const mo = new MutationObserver(() => {
      if (settled) return;
      if (container.querySelector("iframe")) {
        settled = true;
        clearTimeout(fallbackTimer);
        mo.disconnect();
      }
    });
    mo.observe(container, { childList: true, subtree: true });

    const fallbackTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      mo.disconnect();
      showSocialFallback(frame, item);
    }, 3000);

    ensurePlatformScript(platform)
      .then(() => {
        if (platform === "instagram" && window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        }
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(fallbackTimer);
        mo.disconnect();
        showSocialFallback(frame, item);
      });
  }

  function buildSocialFrame(item) {
    const frame = ce("div", "media-frame");
    const platform = item.source.type;
    frame.appendChild(ce("span", "media-badge", platform === "tiktok" ? "TikTok" : "Instagram"));

    const placeholder = createPlaceholderNode(item.title, item.brand || "");
    frame.appendChild(placeholder);

    if (item.source.poster) {
      testImage(item.source.poster).then((ok) => {
        if (!ok) return;
        placeholder.hidden = true;
        const img = document.createElement("img");
        img.src = item.source.poster;
        img.alt = "";
        img.style.position = "absolute";
        img.style.inset = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        frame.appendChild(img);
      });
    }

    const playBtn = ce("button", "media-play-btn");
    playBtn.type = "button";
    playBtn.setAttribute(
      "aria-label",
      "Play " + item.title + " on " + (platform === "tiktok" ? "TikTok" : "Instagram")
    );
    const iconWrap = document.createElement("span");
    iconWrap.className = "media-play-btn__icon";
    iconWrap.innerHTML = PLAY_ICON_SVG;
    playBtn.appendChild(iconWrap);
    playBtn.addEventListener("click", () => loadSocialEmbed(frame, item));
    frame.appendChild(playBtn);

    return frame;
  }

  // A still image post: just the picture, no play button or video.
  function buildImageFrame(item) {
    const frame = ce("div", "media-frame");
    frame.appendChild(ce("span", "media-badge", "Photo"));
    const placeholder = createPlaceholderNode(item.title, item.brand || "");
    frame.appendChild(placeholder);
    const src = item.source.src;
    testImage(src).then((ok) => {
      if (!ok) return;
      placeholder.hidden = true;
      const img = document.createElement("img");
      img.src = src;
      img.alt = item.title;
      img.className = "media-still";
      frame.appendChild(img);
    });
    return frame;
  }

  function createMediaFrame(item, opts) {
    if (item.source.type === "local") return buildLocalVideoFrame(item, opts);
    if (item.source.type === "image") return buildImageFrame(item);
    return buildSocialFrame(item);
  }

  /* ------------------------------------------------------------------ */
  /* Hero                                                                 */
  /* ------------------------------------------------------------------ */
  function renderHero() {
    const section = document.getElementById("hero");
    const p = SITE.person;

    const top = ce("div", "hero__top");
    const avatar = ce("div", "hero__avatar");
    avatar.appendChild(ce("span", "hero__avatar-fallback", initials(p.name)));
    if (p.headshot && p.headshot.src) {
      testImage(p.headshot.src).then((ok) => {
        if (!ok) return;
        avatar.innerHTML = "";
        const img = document.createElement("img");
        img.src = p.headshot.src;
        img.alt = p.headshot.alt || p.name;
        avatar.appendChild(img);
      });
    }
    const nameBlock = ce("div", "hero__names");
    nameBlock.appendChild(ce("h1", "hero__name", p.name));
    if (p.tagline) nameBlock.appendChild(ce("p", "hero__tagline", p.tagline));
    top.append(avatar, nameBlock);

    const facts = ce("div", "hero__facts");
    facts.setAttribute("aria-label", "Key facts");
    const factItems = [
      ["Age", String(p.age)],
      ["Location", [p.city, p.state, p.country].filter(Boolean).join(", ")],
      ["Languages", p.languages.join(" • ")],
      ["Turnaround", p.turnaround],
    ];
    factItems.forEach(([label, value]) => {
      const f = ce("div", "hero__fact");
      f.appendChild(ce("div", "hero__fact-label", label));
      f.appendChild(ce("div", "hero__fact-value", value));
      facts.appendChild(f);
    });

    const niches = ce("div", "hero__niches");
    p.topNiches.forEach((n) => niches.appendChild(ce("span", "chip", n)));

    const cta = ce("div", "hero__cta");
    const emailBtn = document.createElement("a");
    emailBtn.href =
      "mailto:" + SITE.cta.email + (SITE.cta.emailSubject ? "?subject=" + encodeURIComponent(SITE.cta.emailSubject) : "");
    emailBtn.className = "btn";
    emailBtn.textContent = "Email me";
    cta.appendChild(emailBtn);
    if (SITE.cta.mediaKitUrl) {
      const kitBtn = document.createElement("a");
      kitBtn.href = SITE.cta.mediaKitUrl;
      kitBtn.target = "_blank";
      kitBtn.rel = "noopener noreferrer";
      kitBtn.className = "btn btn--secondary";
      kitBtn.textContent = "Download media kit";
      cta.appendChild(kitBtn);
    }

    section.append(top, facts, niches, cta);
  }

  /* ------------------------------------------------------------------ */
  /* About video                                                         */
  /* ------------------------------------------------------------------ */
  function renderAboutVideo() {
    const section = document.getElementById("about-video");
    section.appendChild(ce("span", "eyebrow", "Camera presence & editing style"));
    const heading = ce("h2", "section-heading", "About Me");
    heading.id = "about-video-heading";
    section.appendChild(heading);

    if (SITE.aboutVideo.bio) {
      section.appendChild(ce("p", "about-video__bio", SITE.aboutVideo.bio));
    }

    const wrap = ce("div", "about-video__wrap");
    wrap.appendChild(
      createMediaFrame(
        {
          id: "about-me",
          title: SITE.person.name + " — about me",
          brand: "",
          source: SITE.aboutVideo.source,
        },
        { autoplayEligible: true }
      )
    );
    section.appendChild(wrap);
    section.appendChild(ce("p", "about-video__caption", SITE.aboutVideo.caption));
    const aboutLink = createSocialLink(SITE.aboutVideo.source);
    if (aboutLink) {
      const row = ce("div", "about-video__link");
      row.appendChild(aboutLink);
      section.appendChild(row);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Service level                                                       */
  /* ------------------------------------------------------------------ */
  function renderServiceLevel() {
    const section = document.getElementById("service-level");
    const heading = ce("h2", "section-heading", "Service Level");
    heading.id = "service-level-heading";
    section.appendChild(heading);

    const box = ce("div", "service-level");
    box.appendChild(ce("span", "service-level__badge", SITE.serviceLevel.label));
    box.appendChild(ce("p", "service-level__desc", SITE.serviceLevel.description));
    section.appendChild(box);
  }

  /* ------------------------------------------------------------------ */
  /* Portfolio + filters                                                 */
  /* ------------------------------------------------------------------ */
  function getUniqueValues(portfolio, field) {
    const set = new Set();
    portfolio.forEach((item) => {
      if (field === "niche") item.niches.forEach((n) => set.add(n));
      else set.add(item[field]);
    });
    return Array.from(set).sort();
  }

  function parseHash() {
    const hash = location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const niche = params.get("niche");
    const format = params.get("format");
    return {
      niche: niche ? new Set(niche.split(",").filter(Boolean)) : new Set(),
      format: format ? new Set(format.split(",").filter(Boolean)) : new Set(),
    };
  }

  function writeHash(state) {
    const params = new URLSearchParams();
    if (state.niche.size) params.set("niche", Array.from(state.niche).join(","));
    if (state.format.size) params.set("format", Array.from(state.format).join(","));
    const str = params.toString();
    history.replaceState(null, "", str ? "#" + str : location.pathname + location.search);
  }

  function buildFilterRow(label, values, rowKey, onChange) {
    const row = ce("div", "filter-row");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Filter by " + label.toLowerCase());
    row.appendChild(ce("span", "filter-row__label", label));

    const allChip = ce("button", "filter-chip", "All");
    allChip.type = "button";
    allChip.dataset.row = rowKey;
    allChip.dataset.value = "";
    allChip.addEventListener("click", () => onChange(rowKey, ""));
    row.appendChild(allChip);

    values.forEach((v) => {
      const chip = ce("button", "filter-chip", getLabel(rowKey, v));
      chip.type = "button";
      chip.dataset.row = rowKey;
      chip.dataset.value = v;
      chip.addEventListener("click", () => onChange(rowKey, v));
      row.appendChild(chip);
    });

    return row;
  }

  function renderPortfolioSection() {
    const section = document.getElementById("portfolio");
    const heading = ce("h2", "section-heading", "Portfolio");
    heading.id = "portfolio-heading";
    section.appendChild(heading);
    section.appendChild(
      ce(
        "p",
        "section-subheading",
        "Filter by niche or format, or send a brand a pre-filtered link straight from your address bar."
      )
    );

    const niches = getUniqueValues(SITE.portfolio, "niche");
    const formats = getUniqueValues(SITE.portfolio, "format");

    let state = parseHash();

    const filterBar = ce("div", "filter-bar");
    const nicheRow = buildFilterRow("Niche", niches, "niche", onFilterChange);
    const formatRow = buildFilterRow("Format", formats, "format", onFilterChange);
    filterBar.append(nicheRow, formatRow);

    const filterMeta = ce("div", "filter-meta");
    const countEl = ce("span", "filter-meta__count", "");
    const resetBtn = ce("button", "filter-meta__reset", "Reset filters");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => {
      state = { niche: new Set(), format: new Set() };
      syncChips();
      update();
    });
    filterMeta.append(countEl, resetBtn);
    filterBar.appendChild(filterMeta);
    section.appendChild(filterBar);

    const grid = ce("div", "portfolio-grid");
    section.appendChild(grid);

    function matchesFilters(item) {
      const nicheOk = state.niche.size === 0 || item.niches.some((n) => state.niche.has(n));
      const formatOk = state.format.size === 0 || state.format.has(item.format);
      return nicheOk && formatOk;
    }

    function update() {
      grid.innerHTML = "";
      const filtered = SITE.portfolio.filter(matchesFilters);
      if (filtered.length === 0) {
        grid.appendChild(ce("div", "empty-state", "No videos match those filters yet. Try Reset."));
      } else {
        filtered.forEach((item) => grid.appendChild(createPortfolioCard(item)));
      }
      countEl.textContent = filtered.length + " of " + SITE.portfolio.length + " videos";
      writeHash(state);
    }

    function syncChips() {
      filterBar.querySelectorAll(".filter-chip").forEach((chip) => {
        const row = chip.dataset.row;
        const value = chip.dataset.value;
        const active = value === "" ? state[row].size === 0 : state[row].has(value);
        chip.setAttribute("aria-pressed", String(active));
      });
    }

    function onFilterChange(row, value) {
      if (value === "") {
        state[row] = new Set();
      } else if (state[row].has(value)) {
        state[row].delete(value);
      } else {
        state[row].add(value);
      }
      syncChips();
      update();
    }

    window.addEventListener("hashchange", () => {
      state = parseHash();
      syncChips();
      update();
    });

    // Exposed so the Languages section can jump to (and reveal) a video
    // even if it's currently hidden behind an active filter.
    window.__ugcScrollToPortfolioItem = function (id) {
      state = { niche: new Set(), format: new Set() };
      syncChips();
      update();
      requestAnimationFrame(() => {
        const el = document.getElementById("portfolio-" + id);
        if (!el) return;
        el.scrollIntoView({ behavior: reducedMotionMql.matches ? "auto" : "smooth", block: "center" });
        el.classList.add("is-highlighted");
        setTimeout(() => el.classList.remove("is-highlighted"), 1600);
      });
    };

    syncChips();
    update();
  }

  function createPortfolioCard(item) {
    const card = ce("article", "portfolio-card");
    card.id = "portfolio-" + item.id;
    card.appendChild(createMediaFrame(item, { autoplayEligible: true }));

    const meta = ce("div", "portfolio-card__meta");
    if (item.brand) meta.appendChild(ce("span", "portfolio-card__brand", item.brand));
    meta.appendChild(ce("h3", "portfolio-card__title", item.title));
    if (item.note) meta.appendChild(ce("p", "portfolio-card__note", item.note));

    const tags = ce("div", "portfolio-card__tags");
    item.niches.forEach((n) => tags.appendChild(ce("span", "tag", getLabel("niche", n))));
    tags.appendChild(ce("span", "tag", getLabel("format", item.format)));
    meta.appendChild(tags);
    card.appendChild(meta);

    const actions = ce("div", "portfolio-card__actions");
    const social = createSocialLink(item.source);
    if (social) actions.appendChild(social);
    if (item.downloadUrl) {
      const a = document.createElement("a");
      a.href = item.downloadUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "btn btn--secondary btn--small";
      a.textContent = "Download";
      actions.appendChild(a);
    }
    if (actions.children.length) card.appendChild(actions);

    return card;
  }

  // "View on TikTok ↗" / "View on Instagram ↗" link, so every social post is
  // one tap away from its original page (the embed itself only loads on tap).
  function createSocialLink(source) {
    if (!source || (source.type !== "tiktok" && source.type !== "instagram") || !source.url) return null;
    const a = document.createElement("a");
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "btn btn--secondary btn--small";
    a.textContent = "View on " + (source.type === "tiktok" ? "TikTok" : "Instagram") + " ↗";
    return a;
  }

  /* ------------------------------------------------------------------ */
  /* Languages                                                            */
  /* ------------------------------------------------------------------ */
  function renderLanguages() {
    const section = document.getElementById("languages");
    const heading = ce("h2", "section-heading", "Languages");
    heading.id = "languages-heading";
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "language-list";

    SITE.languages.forEach((lang) => {
      const li = document.createElement("li");
      li.className = "language-row";

      const info = ce("div", "language-row__info");
      info.appendChild(ce("span", "language-row__name", lang.name));
      info.appendChild(ce("span", "language-row__level", lang.level));
      li.appendChild(info);

      const example = SITE.portfolio.find((p) => p.id === lang.exampleVideoId);
      if (example) {
        const link = document.createElement("a");
        link.href = "#portfolio-" + example.id;
        link.className = "btn btn--secondary btn--small";
        link.textContent = "Watch example";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.__ugcScrollToPortfolioItem) window.__ugcScrollToPortfolioItem(example.id);
        });
        li.appendChild(link);
      }
      list.appendChild(li);
    });

    section.appendChild(list);
  }

  /* ------------------------------------------------------------------ */
  /* Rates                                                                */
  /* ------------------------------------------------------------------ */
  function renderRates() {
    const section = document.getElementById("rates");
    if (!SITE.showRates) {
      section.remove();
      return;
    }
    const heading = ce("h2", "section-heading", "Rates & Services");
    heading.id = "rates-heading";
    section.appendChild(heading);
    if (SITE.rates.note) section.appendChild(ce("p", "section-subheading", SITE.rates.note));

    const wrap = ce("div", "rates-table-wrap");
    const table = document.createElement("table");
    table.className = "rates-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Package", "Rate", "Usage Rights"].forEach((label) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    SITE.rates.packages.forEach((pkg) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.textContent = pkg.name;
      const tdPrice = document.createElement("td");
      tdPrice.textContent = pkg.price;
      const tdUsage = document.createElement("td");
      tdUsage.textContent = pkg.usageRights;
      tr.append(tdName, tdPrice, tdUsage);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);

    const wl = SITE.rates.whitelisting;
    if (wl) {
      const wlWrap = ce("div", "rates-table-wrap whitelisting-table-wrap");
      const wlTable = document.createElement("table");
      wlTable.className = "rates-table";
      const wlThead = document.createElement("thead");
      const wlHeadRow = document.createElement("tr");
      ["Whitelisting (paid ads from my handle)", "30 days", "60 days", "90 days"].forEach((label) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        wlHeadRow.appendChild(th);
      });
      wlThead.appendChild(wlHeadRow);
      wlTable.appendChild(wlThead);

      const wlTbody = document.createElement("tbody");
      const wlRow = document.createElement("tr");
      const wlLabel = document.createElement("td");
      wlLabel.textContent = wl.note || "Whitelisting add-on";
      const wl30 = document.createElement("td");
      wl30.textContent = wl.days30;
      const wl60 = document.createElement("td");
      wl60.textContent = wl.days60;
      const wl90 = document.createElement("td");
      wl90.textContent = wl.days90;
      wlRow.append(wlLabel, wl30, wl60, wl90);
      wlTbody.appendChild(wlRow);
      wlTable.appendChild(wlTbody);
      wlWrap.appendChild(wlTable);
      section.appendChild(wlWrap);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Brands                                                               */
  /* ------------------------------------------------------------------ */
  function renderBrands() {
    renderBrandStrip("brands", "Brands I’ve Worked With", "", SITE.brands);
  }

  function renderFavoriteBrands() {
    renderBrandStrip(
      "favorite-brands",
      "Brands I Wear & Love",
      "Personal favorites from my own closet and routine — not sponsored partnerships.",
      SITE.favoriteBrands
    );
  }

  // Shared logo strip. The section is removed entirely when there's nothing to
  // show, and any logo that's missing falls back to a text badge.
  function renderBrandStrip(sectionId, headingText, subtext, brands) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    if (!brands || brands.length === 0) {
      section.remove();
      return;
    }
    const heading = ce("h2", "section-heading", headingText);
    heading.id = sectionId + "-heading";
    section.appendChild(heading);
    if (subtext) section.appendChild(ce("p", "section-subheading", subtext));

    const strip = ce("ul", "brand-strip");
    brands.forEach((b) => {
      const item = ce("li", "brand-strip__item");
      item.appendChild(ce("span", "brand-strip__fallback", b.name));
      strip.appendChild(item);
      testImage(b.logo).then((ok) => {
        if (!ok) return;
        item.innerHTML = "";
        const img = document.createElement("img");
        img.src = b.logo;
        img.alt = b.name + " logo";
        item.appendChild(img);
      });
    });
    section.appendChild(strip);
  }

  /* ------------------------------------------------------------------ */
  /* How I Work                                                           */
  /* ------------------------------------------------------------------ */
  function renderHowIWork() {
    const section = document.getElementById("how-i-work");
    const heading = ce("h2", "section-heading", "How I Work");
    heading.id = "how-i-work-heading";
    section.appendChild(heading);

    const grid = ce("div", "how-i-work-grid");

    const turnaround = ce("div", "how-i-work-block");
    turnaround.appendChild(ce("h3", "", "Turnaround"));
    turnaround.appendChild(ce("p", "", SITE.howIWork.turnaround));
    grid.appendChild(turnaround);

    const revisions = ce("div", "how-i-work-block");
    revisions.appendChild(ce("h3", "", "Revisions"));
    revisions.appendChild(ce("p", "", SITE.howIWork.revisionPolicy));
    grid.appendChild(revisions);

    const brief = ce("div", "how-i-work-block");
    brief.appendChild(ce("h3", "", "What I need in a brief"));
    const ul = document.createElement("ul");
    SITE.howIWork.briefNeeds.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      ul.appendChild(li);
    });
    brief.appendChild(ul);
    grid.appendChild(brief);

    const footage = ce("div", "how-i-work-block");
    footage.appendChild(ce("h3", "", "Raw footage delivery"));
    footage.appendChild(ce("p", "", SITE.howIWork.footageDelivery));
    grid.appendChild(footage);

    section.appendChild(grid);
  }

  /* ------------------------------------------------------------------ */
  /* Contact                                                              */
  /* ------------------------------------------------------------------ */
  function renderContact() {
    const section = document.getElementById("contact");
    const heading = ce("h2", "section-heading", "Contact");
    heading.id = "contact-heading";
    section.appendChild(heading);

    const block = ce("div", "contact-block");

    const emailRow = ce("div", "contact-email");
    const mailLink = document.createElement("a");
    mailLink.href =
      "mailto:" + SITE.contact.email + (SITE.cta.emailSubject ? "?subject=" + encodeURIComponent(SITE.cta.emailSubject) : "");
    mailLink.className = "btn btn--small";
    mailLink.textContent = "Email me";
    emailRow.appendChild(mailLink);
    emailRow.appendChild(ce("span", "contact-email__text", SITE.contact.email));
    block.appendChild(emailRow);

    if (SITE.contact.socials && SITE.contact.socials.length) {
      const list = document.createElement("ul");
      list.className = "contact-socials";
      SITE.contact.socials.forEach((s) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = s.platform + " " + s.handle;
        li.appendChild(a);
        list.appendChild(li);
      });
      block.appendChild(list);
    }

    const copyRow = ce("div", "copy-row");
    const copyBtn = ce("button", "btn btn--secondary", "Copy my details");
    copyBtn.type = "button";
    const feedback = ce("span", "copy-feedback", "");
    feedback.setAttribute("role", "status");
    copyBtn.addEventListener("click", () => {
      const p = SITE.person;
      const text = [
        "Name: " + p.name,
        "Location: " + [p.city, p.state, p.country].filter(Boolean).join(", "),
        "Age: " + p.age,
        "Languages: " + p.languages.join(", "),
        "Email: " + SITE.contact.email,
      ].join("\n");
      copyText(text)
        .then(() => {
          feedback.textContent = "Copied!";
          setTimeout(() => {
            feedback.textContent = "";
          }, 2000);
        })
        .catch(() => {
          feedback.textContent = "Couldn't copy — select the email above manually.";
        });
    });
    copyRow.append(copyBtn, feedback);
    block.appendChild(copyRow);

    section.appendChild(block);
  }

  /* ------------------------------------------------------------------ */
  /* Footer                                                               */
  /* ------------------------------------------------------------------ */
  function renderFooter() {
    const footer = document.getElementById("site-footer");
    footer.textContent = "Last updated: " + SITE.lastUpdated;
  }

  /* ------------------------------------------------------------------ */
  /* Meta tags + JSON-LD                                                 */
  /* ------------------------------------------------------------------ */
  function setMetaContent(attr, key, value) {
    let el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function applyMeta() {
    document.title = SITE.meta.title;
    setMetaContent("name", "description", SITE.meta.description);
    setMetaContent("property", "og:title", SITE.meta.title);
    setMetaContent("property", "og:description", SITE.meta.description);
    setMetaContent("property", "og:url", SITE.meta.siteUrl);
    setMetaContent("name", "twitter:title", SITE.meta.title);
    setMetaContent("name", "twitter:description", SITE.meta.description);
    if (SITE.meta.ogImage) {
      const abs = resolveUrl(SITE.meta.ogImage, SITE.meta.siteUrl);
      setMetaContent("property", "og:image", abs);
      setMetaContent("name", "twitter:image", abs);
    }

    const ld = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: SITE.person.name,
      jobTitle: SITE.serviceLevel.label || "UGC Creator",
      email: "mailto:" + SITE.contact.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.person.city,
        addressRegion: SITE.person.state,
        addressCountry: SITE.person.country,
      },
      knowsLanguage: SITE.person.languages,
      url: SITE.meta.siteUrl,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(ld);
    document.getElementById("json-ld-mount").appendChild(script);
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */
  function init() {
    if (typeof SITE === "undefined") {
      console.error("SITE is not defined — check content.js for a syntax error.");
      return;
    }
    try {
      applyMeta();
      renderHero();
      renderAboutVideo();
      renderServiceLevel();
      renderPortfolioSection();
      renderLanguages();
      renderRates();
      renderBrands();
      renderFavoriteBrands();
      renderHowIWork();
      renderContact();
      renderFooter();
    } catch (err) {
      console.error("Failed to render site from content.js:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
