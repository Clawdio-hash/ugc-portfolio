# UGC Creator Portfolio

A single-page portfolio for pitching brand managers and UGC agency sourcers.
Plain HTML/CSS/JS — no build step, no npm, no frameworks. Open `index.html`
directly in a browser and it works.

**You only ever need to edit `content.js`.** Never touch `index.html` or
`styles.css` to add a video, change your rates, or update your bio.

## File structure

```
index.html          the page shell (don't edit)
styles.css           all styling (don't edit, except the one accent color line)
app.js               renders everything from content.js (don't edit)
content.js            <- THE FILE YOU EDIT
/media
  /videos             your .mp4 files
  /posters            .jpg thumbnails, same basename as the video
  /brands             brand logo images
  headshot.jpg
```

---

## Adding a video

Open `content.js` and find the `portfolio: [ ... ]` list. Copy one of the
existing `{ ... }` entries and change the values. Every field has a comment
above the `portfolio` array explaining what it does.

### Option A — a local video file (recommended, most reliable)

1. Drop your `.mp4` into `media/videos/`.
2. Make a poster thumbnail (see next section) and drop it into
   `media/posters/` with the **same filename** as the video (just a
   different extension).
3. Add an entry to `content.js`:

```js
{
  id: "my-new-video",                 // unique, no spaces
  title: "Brand X — hook test",
  niches: ["beauty"],                 // any tags you want — filters build themselves
  format: "talking-head",             // talking-head | unboxing | skit | street-interview | voiceover | demo
  language: "english",
  source: {
    type: "local",
    src: "media/videos/my-new-video.mp4",
    poster: "media/posters/my-new-video.jpg",
  },
  downloadUrl: "",                    // optional Google Drive / Dropbox link
  brand: "Brand X",
  note: "Scripted + shot by me. 2-day turnaround.",
},
```

If you forget the poster file (or the video file), the site doesn't break —
it shows a clean neutral placeholder card instead of a broken image icon.

### Option B — a TikTok or Instagram link (no video file needed)

```js
{
  id: "my-tiktok-post",
  title: "Brand Y — unboxing",
  niches: ["pet"],
  format: "unboxing",
  language: "english",
  source: {
    type: "tiktok",                   // or "instagram"
    url: "https://www.tiktok.com/@you/video/1234567890123456789",
    poster: "media/posters/my-tiktok-post.jpg",   // optional but recommended
  },
  downloadUrl: "",
  brand: "Brand Y",
  note: "First-impressions unboxing.",
},
```

The real TikTok/Instagram embed only loads when a visitor **clicks play** —
nothing is fetched from TikTok or Instagram just from having the page open.
If the embed can't load within 3 seconds (bad link, ad blocker, offline),
the card automatically falls back to a plain "View on TikTok ↗" button.

---

## Making a poster thumbnail from an MP4

Posters are just a still frame from the video, saved as a `.jpg`. If you
have [ffmpeg](https://ffmpeg.org/) installed, grab a frame at the 1-second
mark:

```bash
ffmpeg -i media/videos/my-new-video.mp4 -ss 00:00:01 -vframes 1 -q:v 3 media/posters/my-new-video.jpg
```

- `-ss 00:00:01` — pick a frame at 1 second in (adjust to land on a good frame)
- `-vframes 1` — grab exactly one frame
- `-q:v 3` — JPEG quality (2 = highest quality/biggest file, 5 = smaller file)

The output filename must match the video's filename (different extension)
if you're relying on the "same basename" convention, though you can also
just point `poster:` at whatever filename you gave it.

---

## Toggling rates on/off

At the top of `content.js`:

```js
showRates: true,   // change to false to hide the entire Rates & Services section
```

Set it to `false` before sending your link to an agency that doesn't want
pricing visible to their downstream clients.

---

## Changing the accent color

Open `styles.css` and change **one line** near the top:

```css
--accent: #ff5a3c;
```

Any valid CSS color works (hex, `rgb()`, a named color, etc). Every button,
badge, active filter chip, and highlight on the site uses this variable.

---

## Filter links (share pre-filtered work with a brand)

The portfolio filters store their state in the URL, so you can send a
brand a link that opens with only their relevant work showing:

```
https://your-site.com/#niche=saas
https://your-site.com/#niche=saas&format=demo
```

Just filter the page yourself first, then copy the address bar URL — it
updates automatically as you click filters.

---

## Deploying

### Netlify (drag-and-drop)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder (the one containing `index.html`) onto
   the page.
3. Netlify gives you a live URL immediately. You can rename it or add a
   custom domain from the site settings.
4. To update the site later: make your changes to `content.js`, then drag
   the folder onto the same site's "Deploys" tab to redeploy.

### Cloudflare Pages

1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** →
   **Pages** → **Upload assets**.
2. Give the project a name and drag in the project folder (or the files
   inside it).
3. Cloudflare deploys it and gives you a `*.pages.dev` URL.
4. To update: go back to the project → **Create deployment** → upload the
   folder again.

Either way, once deployed, open `content.js` and update
`meta.siteUrl` to your real live URL — that value is used in the Open
Graph tags and the JSON-LD schema so link previews and search engines
point at the right place.

---

## A note on link previews (Open Graph tags)

Because this site has no build step, `index.html` ships with static
`<meta>` tags (title/description) that already match the placeholder
`content.js`. When the page loads in a real browser, `app.js` updates the
page title, meta description, and JSON-LD from `content.js` live — so what
a *visitor* sees is always accurate.

Some chat apps generate link previews using a bot that does **not** run
JavaScript, so it only sees the static tags baked into `index.html`. If you
change your name, tagline, or description in `content.js`, your live page
will reflect it instantly, but a "perfect" link preview in every app may
need you to also update the handful of `<meta>` tags near the top of
`index.html`. This is optional — the page itself is always correct.

---

## What's intentionally not included

No blog, no CMS, no analytics, no cookie banner, no contact-form backend,
and nothing that calls the TikTok or Instagram APIs. Contact is a plain
`mailto:` link and copyable text — that's it.
