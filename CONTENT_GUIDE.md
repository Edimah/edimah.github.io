# Content Guide — edimah.github.io

This document describes how to publish content on this al-folio Jekyll site. Read it whenever you return after a break.

---

## Folder map

```
website/
├── _config.yml          ← central config: plugins, collections, math, permalinks
├── _posts/              ← English blog posts (the main stream)
├── _santepub/           ← French public-health collection (separate stream)
├── _pages/              ← static pages (about, blog index, contact…)
├── _projects/           ← project cards shown on the /projects page
├── _books/              ← book notes collection
├── _news/               ← short news items shown on the about page
├── _bibliography/       ← .bib files for jekyll-scholar citations
├── _templateposts/      ← al-folio example posts (NOT built — reference only)
├── assets/
│   ├── img/             ← images for blog posts
│   │   └── santepub/    ← images for santepub posts specifically
│   ├── html/            ← embedded HTML artefacts (Plotly exports, iframes…)
│   └── json/            ← resume JSON
├── _layouts/            ← Liquid templates
├── _includes/           ← reusable Liquid partials
├── _sass/               ← stylesheets
├── .github/workflows/   ← CI/CD — deploy.yml is the one that matters
└── bin/                 ← cibuild (just `bundle exec jekyll build`)
```

`_site/` is the built output — never edit it manually.

---

## Two content streams

| | `_posts/` | `_santepub/` |
|---|---|---|
| Language | English | French |
| Audience | General technical / research blog | French public-health data analyses |
| URL pattern | `/blog/:year/:title/` | `/santepub/:name/` |
| Shows up in… | Blog page, tag/category archives | Dedicated Santé Pub section |
| Thumbnail image | Optional | **Required** (`image:` field) |
| Tags & categories | Yes | No |

---

## Creating a new English blog post

### 1. Filename format

```
_posts/YYYY-MM-DD-slug-with-hyphens.md
```

The date **in the filename** controls publication order. The slug becomes part of the URL.

### 2. Frontmatter template (copy-paste this)

```yaml
---
layout: post
title: Your Post Title Here
date: 2026-06-02 10:00:00
description: One sentence shown on the blog listing as a subtitle.
tags: tag1 tag2 tag3
categories: posts
---
```

**Required:** `layout`, `title`, `date`, `categories: posts`
**Optional but recommended:** `description`, `tags`
**Less common:** `related_posts: false` (disables the "related posts" section), `featured: true` (pins to top)

The `description` field is the blurb shown in the blog listing — keep it to one sentence.

### 3. Where the post appears

- Blog listing at `/blog/`
- Per-year archive at `/blog/:year/`
- Per-tag archive at `/blog/tags/:tag/`
- Per-category archive at `/blog/categories/posts/`

> **Note:** only the tags in `display_tags: ["dataviz", "chess", "fitness", "music"]` (_config.yml line 262) are shown as chips on the blog front page. Other tags are still archived and searchable — just not highlighted on the home view. Add a new tag to that list if you want it surfaced.

---

## Adding images

### Standard blog post image

1. Put the file in `assets/img/` (e.g., `assets/img/my-chart.png`).
2. Reference with an absolute path:

```html
<img src="/assets/img/my-chart.png"
     alt="Descriptive alt text"
     title="Caption"
     style="max-width: 80%; height: auto;">
```

### Styled figure (Bootstrap, as used in santepub)

```html
<div class="row justify-content-center my-4">
  <div class="col-lg-10">
    <figure class="figure">
      <img class="figure-img img-fluid rounded shadow-sm"
           src="/assets/img/my-chart.png"
           alt="Descriptive alt text">
      <figcaption class="figure-caption text-center">
        Caption text here.
      </figcaption>
    </figure>
  </div>
</div>
```

### imagemagick / WebP

imagemagick is enabled and automatically generates responsive WebP versions at 480, 800, and 1400px during the build. No extra steps needed — just put the source image in `assets/img/` and reference it as normal.

### Embedded interactive HTML (Plotly, etc.)

Export your plot as a standalone HTML file into `assets/html/`, then embed it:

```html
<iframe src="/assets/html/my-plot.html" width="100%" height="600" frameborder="0"></iframe>
```

---

## Writing math

`enable_math: true` in `_config.yml` loads **MathJax 3.2.2**. The delimiter is `$$` (double dollar) for both inline and display.

### Inline math

Wrap `$$` inside a paragraph:

```
The log-odds are $$ \alpha_c = \log(p_c / (1 - p_c)) $$.
```

### Display math (block)

Place `$$` as a standalone paragraph (blank lines above and below):

```
$$
\alpha_c \sim \mathcal{N}(\mu, \sigma^2)
$$
```

### Numbered equations

Use `\begin{equation}...\end{equation}` (MathJax will auto-number) and optionally `\label{eq:name}` + `\eqref{eq:name}` for cross-references:

```
\begin{equation}
\label{eq:logistic}
\text{logit}(p_i) = \alpha_{c(i)}
\end{equation}
```

---

## Code blocks with R syntax highlighting

Rouge (the highlighter) supports R. Use a fenced code block with `r` as the language tag:

````markdown
```r
library(brms)
fit <- brm(outcome ~ (1 | center), data = df, family = bernoulli())
```
````

Line numbers are off by default. To enable them for a specific block use the Liquid tag:

```
{% highlight r linenos %}
your_code_here()
{% endhighlight %}
```

---

## Tags and categories

- **`tags:`** space-separated list in the frontmatter (e.g., `tags: bayesian statistics r`)
- **`categories:`** always set to `posts` for blog posts
- Archives are auto-generated by `jekyll-archives-v2`:
  - Tags → `/blog/tags/:tag/`
  - Categories → `/blog/categories/:category/`
- To surface a tag on the blog front page, add it to `display_tags` in `_config.yml`

---

## Local preview

From the `website/` directory:

```bash
bundle exec jekyll serve
```

Open <http://localhost:4000> in a browser. Jekyll watches for file changes and rebuilds automatically (expect a few seconds per rebuild). The `_site/` folder is regenerated on each build — don't edit it directly.

If imagemagick conversion is slow locally, you can temporarily set `imagemagick.enabled: false` in `_config.yml` and revert before pushing.

**Docker alternative** (avoids Ruby version issues):

```bash
docker-compose up
```

---

## Deploy: from draft saved to live on edimah.github.io

1. **Save your file** in `_posts/YYYY-MM-DD-slug.md` (and any images in `assets/img/`).
2. **Commit and push** to `master` or `main`:
   ```bash
   git add _posts/YYYY-MM-DD-slug.md assets/img/your-image.png
   git commit -m "Add post: slug"
   git push origin master
   ```
3. **GitHub Actions triggers** automatically (`.github/workflows/deploy.yml`):
   - Installs Ruby 3.3.5, Python 3.13, and imagemagick
   - Runs `bundle exec jekyll build` + PurgeCSS
   - Deploys the `_site/` folder to the `gh-pages` branch
4. **GitHub Pages** serves from `gh-pages`. Rebuild takes **2–5 minutes** on average.
5. **Verify** at <https://edimah.github.io> — check [Actions tab on GitHub](https://github.com/Edimah/edimah.github.io/actions) for the workflow run status (green checkmark = success).

> The deploy step is skipped on pull requests — it only runs on direct pushes to `master`/`main`.

---

## Gotchas

**Frontmatter YAML syntax errors break the build silently.**
Missing quotes around a title with a colon (e.g., `title: Bayesian: A Guide`) causes a YAML parse error. Always quote titles that contain `:`, `#`, `[`, `]`, or `{`.

```yaml
title: "Bayesian: A Guide"   # ✓ safe
title: Bayesian: A Guide     # ✗ breaks YAML
```

**`categories: posts` is required for the post to appear on the blog page.**
If you omit it, the post still builds but won't show in the listing or archives.

**The `date:` field in frontmatter must match (or be consistent with) the filename date.**
If the frontmatter date is in the future relative to the build time, Jekyll may suppress the post. Use the actual publication date.

**imagemagick processes only `.jpg`, `.jpeg`, `.png`, `.tiff`, `.gif`** in `assets/img/`. SVGs and WebP sources are not processed.

**`description:` in frontmatter is the listing blurb, not a meta description** (OG meta is disabled: `serve_og_meta: false`). Keep it to one sentence.

**The santepub collection has no `tags` or `categories`.** Don't add them — they're not wired to any archive logic for that collection.

**`_templateposts/` is for reference only** — it is not in the build. If you copy a template from there, move it to `_posts/` and update the frontmatter.

**Math inside YAML values** (title, description) is not rendered by MathJax. Only put math in the post body.

**PurgeCSS runs in CI but not locally.** If a style looks fine locally but broken in production, a CSS class may have been purged. Check `purgecss.config.js` if this happens.
