<?xml version="1.0" encoding="UTF-8"?>
<!-- Makes feed.xml readable when someone opens it in a browser. Feed readers ignore this file. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="robots" content="noindex"/>
        <title>RSS feed | Kauntey Acharya</title>
        <link rel="icon" type="image/png" href="/assets/icons/favicon-32.png"/>
        <style>
          :root { --bg: #F5F5DC; --text: #000; --muted: rgba(0,0,0,.66); --line: rgba(0,0,0,.18); }
          @media (prefers-color-scheme: dark) { :root { --bg: #000; --text: #F5F5DC; --muted: rgba(245,245,220,.66); --line: rgba(245,245,220,.2); } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: var(--bg); color: var(--text); font-family: monospace; line-height: 1.6; }
          main { max-width: 42rem; margin: 0 auto; padding: 3.5rem 1.25rem 4rem; }
          a { color: var(--text); text-underline-offset: 3px; }
          .label { font-size: .78rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }
          h1 { font-size: clamp(1.8rem, 5vw, 2.4rem); line-height: 1.15; margin: .6rem 0 1rem; }
          .intro { color: var(--muted); }
          .box { margin: 1.6rem 0 2.4rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 4px; font-size: .9rem; }
          .box code { word-break: break-all; color: var(--text); }
          ul { list-style: none; border-top: 1px solid var(--line); }
          li { padding: 1rem 0; border-bottom: 1px solid var(--line); }
          li a { font-weight: 700; text-decoration: none; }
          li a:hover { text-decoration: underline; }
          li p { color: var(--muted); font-size: .92rem; margin-top: .2rem; }
          time { display: block; font-size: .75rem; color: var(--muted); margin-bottom: .2rem; }
          .back { display: inline-block; margin-top: 2rem; font-size: .85rem; }
        </style>
      </head>
      <body>
        <main>
          <p class="label">RSS feed</p>
          <h1><xsl:value-of select="rss/channel/title"/></h1>
          <p class="intro">This page is a feed. Add its address to a feed reader such as Feedly, Inoreader, or NetNewsWire, and new notes will show up there automatically.</p>
          <p class="box">Feed address: <code>https://kaunteyacharya.com/feed.xml</code></p>
          <ul>
            <xsl:for-each select="rss/channel/item">
              <li>
                <time><xsl:value-of select="substring(pubDate, 6, 11)"/></time>
                <a href="{link}"><xsl:value-of select="title"/></a>
                <p><xsl:value-of select="description"/></p>
              </li>
            </xsl:for-each>
          </ul>
          <a class="back" href="/notes.html">← All notes on the site</a>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
