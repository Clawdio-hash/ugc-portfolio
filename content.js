/*
  ============================================================================
  CONTENT.JS — THE ONLY FILE YOU SHOULD EVER NEED TO EDIT
  ============================================================================
  This file is plain JavaScript, not HTML. Everything on the site — your
  bio, your videos, your rates — is generated from the SITE object below.

  RULES FOR EDITING SAFELY:
  - Keep the commas between items. Every "{ ... }," needs that trailing comma
    (except the very last item in a list).
  - Wrap text in "double quotes" or 'single quotes' — either is fine, just
    don't forget to close the quote.
  - Lists (arrays) are the stuff between [ square brackets ], separated
    by commas.
  - If you break the file, most code editors (and your browser's console —
    press F12) will point at the line number that's wrong.
  - This is a plain <script> tag, not an ES module — that's on purpose, so
    the site still works when you just double-click index.html. Don't add
    "export" anywhere in this file.

  See README.md for step-by-step instructions on adding a video, making a
  poster thumbnail, and deploying.
  ============================================================================
*/

const SITE = {

  // --------------------------------------------------------------------
  // GLOBAL SETTINGS
  // --------------------------------------------------------------------

  // Set to false to completely hide the "Rates & Services" section.
  // Useful when an agency won't forward a portfolio that shows pricing.
  showRates: false,

  // Shown in the footer as "Last updated: <this date>". Update it whenever
  // you add new work, in any format you like (e.g. "August 2026").
  lastUpdated: "August 9, 2026",

  // --------------------------------------------------------------------
  // SITE / SEO META — used for the browser tab title, search engines,
  // and the preview card that shows up when this link is pasted into
  // Slack, iMessage, or email.
  // --------------------------------------------------------------------
  meta: {
    // The full public URL where this site will live once deployed.
    // Used for Open Graph tags and the JSON-LD schema. Update this after
    // your first deploy (e.g. "https://jordan-ellis-ugc.netlify.app").
    siteUrl: "https://clawdio-hash.github.io/ugc-portfolio/",

    // Browser tab title and the headline in link previews.
    title: "Emil Mequita — UGC Creator Portfolio",

    // One or two sentences. Shows under the title in link previews and
    // in search results.
    description:
      "UGC creator portfolio: luxury fashion, LA lifestyle, travel, and " +
      "product reviews & unboxings. Fluent English & Spanish.",

    // Optional social preview image. 1200x630px recommended. Path is
    // relative to index.html. Leave as "" to skip.
    ogImage: "",
  },

  // --------------------------------------------------------------------
  // HERO — the first thing a sourcer sees. Should be screenshot-able on
  // its own: age, location, languages, niches, turnaround.
  // --------------------------------------------------------------------
  person: {
    name: "Emil Mequita",
    // Short line under your name.
    tagline: "UGC Creator & Creative Director — Fashion & Lifestyle",

    // Your real headshot (media/headshot.jpg, cropped from the photo you
    // sent). If this file is missing, the site shows a neat initials
    // placeholder instead of a broken image.
    headshot: {
      src: "media/headshot.jpg",
      alt: "Headshot of Emil Mequita",
    },

    age: 37,
    city: "Los Angeles",
    state: "CA",
    country: "USA",

    // Languages shown as compact tags in the hero (e.g. "English", "Spanish").
    languages: ["English", "Spanish"],

    // Exactly the niches you want a sourcer to see first. Keep this to 3 —
    // it's meant to be skimmed, not a full list (the portfolio filters
    // below show everything you actually shoot). You mentioned 4 niches
    // (luxury fashion, LA lifestyle, travel, product reviews/unboxings) —
    // trimmed to 3 for the hero; swap any of these for "Travel" if you'd
    // rather lead with that instead.
    topNiches: ["Luxury Fashion", "LA Lifestyle", "Product Reviews"],

    turnaround: "1–2 week turnaround",
  },

  // --------------------------------------------------------------------
  // CALL TO ACTION BUTTONS (hero + contact section)
  // --------------------------------------------------------------------
  cta: {
    email: "management@emilsmusic.com",
    // Pre-fills the subject line when someone clicks the email button.
    emailSubject: "UGC Collab Inquiry",

    // Link to a hosted PDF (Google Drive, Dropbox, etc). Leave as ""
    // to hide the "Download Media Kit" button entirely.
    mediaKitUrl: "",
  },

  // --------------------------------------------------------------------
  // SERVICE LEVEL — how involved you are in the creative process.
  // level must be one of: "strategist" | "executor" | "hybrid"
  // --------------------------------------------------------------------
  // TODO: drafted from your niches (luxury fashion, LA lifestyle, travel,
  // product reviews/unboxings) — read it over and adjust to taste.
  serviceLevel: {
    level: "hybrid",
    label: "Hybrid — Strategist + Executor",
    // Keep this to two sentences: what you do, and what you don't.
    description:
      "As a creative director, I concept, shoot, and edit every piece myself — from luxury fashion features and LA lifestyle content to travel and product unboxings. " +
      "I don't handle paid media buying or manage brand ad accounts — that stays with your team.",
  },

  // --------------------------------------------------------------------
  // ABOUT-ME VIDEO — one featured video that shows your face and your
  // editing style. Same object shape as a portfolio item's `source`.
  // --------------------------------------------------------------------
  // Short bio paragraph shown above the video in the About Me section.
  aboutVideo: {
    bio:
      "I'm a creative director with a love for fashion and 90s aesthetics. " +
      "Based in Los Angeles, where health and wellness are always a priority.",
    caption: "Direct-to-camera delivery, pacing, and editing style — unscripted.",
    source: {
      type: "local", // "local" | "tiktok" | "instagram"
      src: "media/videos/sneaker-review.mp4",
      // Poster is the Cafe Dulce outfit photo you sent, cropped to 9:16.
      poster: "media/posters/about-me.jpg",
    },
  },

  // --------------------------------------------------------------------
  // PORTFOLIO — add one object per video. This is the list that powers
  // the filterable grid.
  //
  // Fields:
  //   id         unique short slug, no spaces (used for links/filters)
  //   title      shown on the card
  //   niches     list of lowercase niche tags — new tags just work, the
  //              filter bar builds itself from whatever you put here
  //   format     one of: talking-head | unboxing | skit | street-interview
  //              | voiceover | demo  (you can add new formats the same way)
  //   language   lowercase, e.g. "english" or "spanish"
  //   source     EITHER a local file:
  //                { type: "local", src: "media/videos/x.mp4", poster: "media/posters/x.jpg" }
  //              OR a social embed (no video file needed):
  //                { type: "tiktok", url: "https://www.tiktok.com/@you/video/123", poster: "media/posters/x.jpg" }
  //                { type: "instagram", url: "https://www.instagram.com/reel/xyz/", poster: "media/posters/x.jpg" }
  //   downloadUrl  optional — adds a "Download" button (Drive/Dropbox link)
  //   brand        brand name shown on the card
  //   note         one short line: what you did (scripted? filmed? turnaround?)
  // --------------------------------------------------------------------
  portfolio: [
    {
      id: "sample-sale-haul",
      title: "260 Sample Sale Haul",
      niches: ["fashion", "streetwear"],
      format: "unboxing",
      language: "english",
      source: {
        type: "local",
        src: "media/videos/sample-sale-haul.mp4",
        poster: "media/posters/sample-sale-haul.jpg",
      },
      downloadUrl: "",
      brand: "",
      note: "Sample sale haul, shot and edited solo.",
    },
    {
      id: "beaspunge-sneaker-review",
      title: "Satoshi Nakamoto x BeaSpunge 'Osmosis' — sneaker review",
      niches: ["fashion", "sneakers"],
      format: "talking-head",
      language: "english",
      source: {
        type: "local",
        src: "media/videos/sneaker-review.mp4",
        poster: "media/posters/sneaker-review.jpg",
      },
      downloadUrl: "",
      brand: "BeaSpunge",
      // TODO: note is my best guess from the clip — rewrite in your own words.
      note: "Talking-head sneaker review, shot and edited solo.",
    },
    {
      id: "luudan-denim-haul",
      title: "LU/UDAN oversized denim — styled reveal",
      niches: ["fashion", "streetwear"],
      format: "talking-head",
      language: "english",
      source: {
        type: "local",
        src: "media/videos/denim-haul.mp4",
        poster: "media/posters/denim-haul.jpg",
      },
      downloadUrl: "",
      brand: "LU/UDAN",
      note: "Styled reveal referencing a celebrity performance look.",
    },
    {
      id: "her-skit",
      title: "\"HER\" — comedic skit",
      niches: ["comedy"],
      format: "skit",
      language: "english",
      source: {
        type: "local",
        src: "media/videos/her-skit.mp4",
        poster: "media/posters/her-skit.jpg",
      },
      downloadUrl: "",
      brand: "",
      note: "Solo-performed comedic skit with on-screen caption gags.",
    },
    {
      id: "chrome-hearts-storytime",
      title: "Chrome Hearts founder storytime",
      niches: ["fashion"],
      format: "talking-head",
      language: "english",
      source: {
        type: "tiktok",
        url: "https://www.tiktok.com/@emilsmusic1/video/7600572393152597279",
        poster: "media/posters/chrome-hearts-storytime.jpg",
      },
      downloadUrl: "",
      brand: "Chrome Hearts",
      note: "Green-screen storytime format — fashion history trivia.",
    },
    {
      id: "mesdyven-brand-discovery",
      title: "Mesdyven — brand discovery",
      niches: ["fashion"],
      format: "talking-head",
      language: "english",
      source: {
        type: "tiktok",
        url: "https://www.tiktok.com/@emilsmusic1/video/7595329420584307998",
        poster: "media/posters/mesdyven-brand-discovery.jpg",
      },
      downloadUrl: "",
      brand: "Mesdyven",
      note: "Green-screen brand-discovery/shoutout format.",
    },
    {
      id: "off-white-unboxing",
      title: "Off-White \"Be Right Back\" sneaker unboxing",
      niches: ["fashion", "sneakers"],
      format: "unboxing",
      language: "english",
      source: {
        type: "tiktok",
        url: "https://www.tiktok.com/@emilsmusic1/video/7385684286306864415",
        poster: "media/posters/off-white-unboxing.jpg",
      },
      downloadUrl: "",
      brand: "Off-White",
      note: "First-impressions sneaker unboxing.",
    },
    {
      id: "footwear-collection",
      title: "Designer footwear collection walkthrough",
      niches: ["fashion", "sneakers"],
      format: "talking-head",
      language: "english",
      source: {
        type: "tiktok",
        url: "https://www.tiktok.com/@emilsmusic1/video/7344151401163001130",
        poster: "media/posters/footwear-collection.jpg",
      },
      downloadUrl: "",
      brand: "",
      note: "Personal collection showcase, long-form talking-head.",
    },
    {
      id: "lanvin-curb-unboxing",
      title: "Lanvin Curb sneaker — unbox & style",
      niches: ["fashion", "sneakers", "streetwear"],
      format: "unboxing",
      language: "english",
      source: {
        type: "tiktok",
        url: "https://www.tiktok.com/@emilsmusic1/video/7335953910374403370",
        poster: "media/posters/lanvin-curb-unboxing.jpg",
      },
      downloadUrl: "",
      brand: "Lanvin",
      note: "Unbox-and-style format for a standout silhouette.",
    },
  ],

  // --------------------------------------------------------------------
  // OPTIONAL: display-name overrides for filter chips.
  // The filter bar builds its niche/format list automatically from the
  // `portfolio` array above — you never need to add a niche or format
  // here for it to show up. This section ONLY controls how a slug is
  // capitalized in the UI (e.g. "saas" -> "SaaS" instead of "Saas").
  // Anything not listed here just gets Title Cased automatically.
  // --------------------------------------------------------------------
  filterLabels: {
    niche: {},
    format: {},
  },

  // --------------------------------------------------------------------
  // LANGUAGES — each entry links to a portfolio video (by its `id`
  // above) that proves you can actually perform in that language.
  // --------------------------------------------------------------------
  languages: [
    {
      name: "English",
      level: "Fluent",
      exampleVideoId: "beaspunge-sneaker-review",
    },
    {
      name: "Spanish",
      level: "Fluent",
      // TODO: no Spanish-language clip in the portfolio yet, so this entry
      // won't show a "Watch example" link until you add one. Add a
      // `exampleVideoId` here once you have a Spanish video's `id`.
    },
  ],

  // --------------------------------------------------------------------
  // RATES & SERVICES — only shown if showRates is true, above.
  // `packages` is the main pricing table. `whitelisting` is the paid-ads
  // usage add-on table for 30/60/90-day terms.
  // --------------------------------------------------------------------
  // TODO: every number below is placeholder demo pricing — replace with
  // your real rates before sending this link to anyone. showRates (top of
  // this file) hides this whole section if you're not ready to show pricing.
  rates: {
    currency: "USD",
    note: "Rates are per finished video. Rush turnaround (under 48 hours) adds 25%.",
    packages: [
      {
        name: "1 UGC Video (15–30s)",
        price: "$250",
        usageRights: "Organic use only (brand's own social channels)",
      },
      {
        name: "1 UGC Video + Raw Footage",
        price: "$350",
        usageRights: "Organic use + raw clips for your own re-edits",
      },
      {
        name: "3-Video Bundle",
        price: "$650",
        usageRights: "Organic use only, mix of hooks/formats",
      },
      {
        name: "Add: Paid Usage Rights (90 days)",
        price: "+$200",
        usageRights: "Adds paid social ad usage on top of any package above",
      },
    ],
    whitelisting: {
      note: "Whitelisting lets the brand run the video from my handle as a paid ad (spark ads).",
      days30: "$150",
      days60: "$225",
      days90: "$300",
    },
  },

  // --------------------------------------------------------------------
  // BRANDS WORKED WITH — logo strip. If a logo file is missing, the
  // site shows a plain text badge with the brand name instead of a
  // broken image.
  //
  // Empty on purpose — no official paid brand partnerships yet, so the
  // whole "Brands I've Worked With" section is automatically hidden from
  // the page. Add entries here the moment you land a paid collab; the
  // section reappears on its own. (Lanvin and Off-White logos are already
  // sitting in media/brands/ — lanvin.png, off-white.png — ready to use.)
  // --------------------------------------------------------------------
  brands: [],

  // --------------------------------------------------------------------
  // HOW I WORK — short bullet facts, shown as-is.
  // TODO: still placeholder text — rewrite to match your real process.
  // --------------------------------------------------------------------
  howIWork: {
    turnaround: "1–2 weeks, depending on the assets needed.",
    revisionPolicy: "1 round of revisions included on every package. Additional rounds are $50 each.",
    briefNeeds: [
      "Product name, link, and 2–3 key claims you want said on camera",
      "Anything I legally can't say (allergens, medical claims, competitor mentions)",
      "Any brand voice examples — past ads, brand guidelines, or a reference video",
      "Preferred hook style, if you have one (question, bold claim, POV, etc.)",
    ],
    footageDelivery: "Raw + edited footage delivered via a shared Google Drive folder within 24 hours of filming.",
  },

  // --------------------------------------------------------------------
  // CONTACT — no backend, so this is just a mailto link + handles.
  // TODO: TikTok below is your real handle — add an Instagram entry too
  // if you want it listed here.
  // --------------------------------------------------------------------
  contact: {
    email: "management@emilsmusic.com",
    socials: [
      { platform: "TikTok", handle: "@emilsmusic1", url: "https://www.tiktok.com/@emilsmusic1" },
    ],
  },
};
