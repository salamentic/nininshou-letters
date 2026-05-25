# Writing Letter Pages

Each page is an HTML file in `public/letters/{lang}/`, named like `en/1-1.html` (envelope 1, page 1, English).

## Text

```html
<p class="boy">Boy's handwriting — warm brown, Caveat font.</p>
<p class="sensei">Sensei's handwriting — red, La Belle Aurore font.</p>
```

## Inline styles

```html
<span class="strikethrough">crossed out</span>
<span class="underline">underlined</span>
<span class="scribble">hasty, slightly tilted</span>
<span class="highlight">red highlight</span>
<span class="annotation">small footnote text</span>
```

## Hand-drawn annotations

```html
<span class="rn-circle">word</span>     <!-- red circle -->
<span class="rn-cross">word</span>      <!-- crossed out -->
<span class="rn-underline">word</span>      <!-- underline -->
<span class="rn-underline-red">word</span>  <!-- red underline -->
```

## Hover tooltips

```html
<span class="note" data-note="translation or footnote">word</span>
```

## Margin notes

```html
<aside class="margin-note">right margin note</aside>
<aside class="margin-note-left">left margin note</aside>
<aside class="margin-note-top">top of page note</aside>
```

## Images

```html
<img src="/your-image.png" alt="description" />
```

Place images in `public/`.

## Page types

Set in `nininshou.json` — each page has a `pagetype` field:
- `lined` — white background with blue ruled lines
- `manuscript` — aged parchment with sepia lines
