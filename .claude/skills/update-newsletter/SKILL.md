---
name: update-newsletter
description: Update the MedTech Mindset newsletter articles on the Tangram MedTech website (index.html) and push to GitHub. Use this skill when Eric wants to add a new LinkedIn article to the site.
---

You are updating the LinkedIn newsletter articles on the Tangram MedTech website. This process is fully automated — do not ask the user for any details.

## Step 1 — Fetch the latest article from LinkedIn

Fetch the newsletter index page to get the most recent article title, date, and URL:
- URL: `https://www.linkedin.com/newsletters/medtech-mindset-7033233055771172864/`
- Extract: title, publication date, and full article URL of the most recent article

Then fetch the article page itself to get the cover image:
- Extract the `og:image` URL from the article page
- Extract any visible article description or summary text

## Step 2 — Generate the excerpt and tag

- **Excerpt**: Write a punchy 1–2 sentence summary based on the article content. Be direct and candid — match Eric's voice.
- **Tag**: Choose the most fitting single-word category: `Regulatory`, `Quality`, `Strategy`, `Commercialization`, or `Manufacturing`

## Step 3 — Read the current index.html

Read the file at `i:/My Drive/Agentic Workflows/Website Designer/index.html` before making any edits.

Check whether the most recent article is already on the site (compare titles). If it is already there, tell the user and stop — no update needed.

## Step 4 — Update the hero newsletter card

Find the hero newsletter card section (elements with IDs `hncImg`, `hncMeta`, `hncTitle`, `hncSub`, `hncLink`). Replace with the new article's data:
- `hncImgLink` href → new LinkedIn URL
- `hncImg` src → new image URL, alt → new title
- `hncMeta` text → formatted date + " · " + tag
- `hncTitle` text → new title
- `hncSub` text → new excerpt
- `hncLink` href → new LinkedIn URL

## Step 5 — Shift the issue cards

The issues grid (`id="issuesGrid"`) contains 3 `.issue-card` divs. Perform this shift:
- **Drop** the 3rd card entirely
- **Move** the 2nd card into the 3rd slot
- **Move** the 1st card into the 2nd slot
- **Insert** a new 1st card using the new article's data

Each issue card follows this structure:
```html
<div class="issue-card">
  <a href="LINKEDIN_URL" target="_blank"><img class="issue-img" src="IMAGE_URL" alt="TITLE"></a>
  <div class="issue-body">
    <div class="issue-meta">
      <span class="issue-date">DATE</span>
      <span class="issue-tag">TAG</span>
    </div>
    <div class="issue-title">TITLE</div>
    <p class="issue-excerpt">EXCERPT</p>
    <a href="LINKEDIN_URL" target="_blank" class="issue-link">
      Read Issue
      <svg class="arrow-svg" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </a>
  </div>
</div>
```

## Step 6 — Push to GitHub

Run the following commands from `i:/My Drive/Agentic Workflows/Website Designer/`:

```
git add index.html
git commit -m "Add newsletter article: TITLE"
git pull origin main --no-edit
git push
```

Replace `TITLE` with the new article title in the commit message.

## Step 7 — Confirm

Tell the user the update is live and will appear on tangrammedtech.com within ~60 seconds. Include the article title and the excerpt that was used.
