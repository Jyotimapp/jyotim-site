// Renders legal/PRIVACY_POLICY.md + TERMS_OF_SERVICE.md into the jyotim.com legal template.
// Faithful line-based markdown conversion — headings, bold/italic, lists, tables, hr,
// blockquotes. The ONLY content removed is the internal "DRAFT FOR OWNER REVIEW" banner
// blockquote (meta-commentary, not policy text). Everything else ships verbatim.
import fs from 'fs';
import { fileURLToPath } from 'url';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linkHref = (t) =>
  /PRIVACY_POLICY/.test(t) ? '/privacy/' : /TERMS_OF_SERVICE/.test(t) ? '/terms/' : t;
const inline = (s) =>
  esc(s)
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, txt, href) => `<a href="${linkHref(href)}">${txt}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Any @jyotim.com address, not just support@ — grievance@ was added 2026-09-04 and a
    // hard-coded support@ would have left the Grievance Officer's address as dead plain text.
    .replace(/([a-z][a-z0-9._-]*@jyotim\.com)/g, '<a href="mailto:$1">$1</a>');

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0, inList = false, inQuote = false, quoteBuf = [];
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  const flushQuote = () => {
    if (!inQuote) return;
    const text = quoteBuf.join(' ');
    if (!/DRAFT FOR OWNER REVIEW|NOT YET LEGAL ADVICE|NOT LEGAL ADVICE|LAWYER TO CONFIRM|OWNER DECISION|\[\[/i.test(text)) {
      out.push('<blockquote>' + inline(text) + '</blockquote>');
    }
    inQuote = false; quoteBuf = [];
  };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|.*\|\s*$/.test(l)) {
      closeList(); flushQuote();
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|[\s\-|:]+\|\s*$/.test(r));
      out.push('<div class="tbl"><table>');
      body.forEach((r, idx) => {
        const tag = idx === 0 ? 'th' : 'td';
        out.push('<tr>' + cells(r).map((c) => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>');
      });
      out.push('</table></div>');
      continue;
    }
    if (/^>\s?/.test(l)) { closeList(); inQuote = true; quoteBuf.push(l.replace(/^>\s?/, '')); i++; continue; }
    flushQuote();
    if (/^#{1,3}\s/.test(l)) {
      closeList();
      const level = l.match(/^(#{1,3})\s/)[1].length;
      out.push(`<h${level}>` + inline(l.replace(/^#{1,3}\s/, '')) + `</h${level}>`);
    } else if (/^---\s*$/.test(l)) { closeList(); out.push('<hr>'); }
    else if (/^\s*-\s+/.test(l)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      let item = l.replace(/^\s*-\s+/, '');
      while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*-\s+/.test(lines[i + 1])) { i++; item += ' ' + lines[i].trim(); }
      out.push('<li>' + inline(item) + '</li>');
    } else if (l.trim() === '') { closeList(); }
    else {
      closeList();
      let para = l;
      while (i + 1 < lines.length && lines[i + 1].trim() !== '' && !/^(#|>|-|\||---)/.test(lines[i + 1].trim())) { i++; para += ' ' + lines[i]; }
      // The shell prints its own "Aakhri update" date — the md's Last-updated line would double it.
      if (!/^\*\*Last updated:/.test(para.trim())) out.push('<p>' + inline(para) + '</p>');
    }
    i++;
  }
  closeList(); flushQuote();
  return out.join('\n');
}

const shell = (title, bodyHtml, dateStr) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="only light">
<title>${title} — Jyotim</title>
<meta name="robots" content="noindex, follow">
<link rel="icon" type="image/png" href="/img/favicon.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap">
<style>
  /* Opt out of forced dark mode — Chrome auto-dark and the Google app's in-app browser darken any
     page that does not declare its schemes, which inverts the cream ground. See dist/index.html. */
  :root { color-scheme: only light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #F5ECDD; color: #2B2420; }
  a { color: #B75E16; text-decoration: none; } a:hover { color: #E27B1B; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #E7D8C0; }
  header .brand { display: flex; align-items: center; gap: 8px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 21px; font-weight: 600; color: #2B2420; }
  main { max-width: 680px; margin: 0 auto; padding: 44px 24px 72px 24px; }
  .ov { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 2.5px; color: #B75E16; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 42px; font-weight: 600; line-height: 1.1; margin: 10px 0 6px 0; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 600; margin: 34px 0 10px 0; }
  h3 { font-size: 16px; font-weight: 700; margin: 26px 0 8px 0; }
  p, li { font-size: 15.5px; line-height: 1.75; }
  ul { padding-left: 22px; }
  blockquote { border-left: 3px solid #E4C77E; margin: 16px 0; padding: 4px 0 4px 16px; color: #6B635C; font-size: 14.5px; line-height: 1.7; }
  hr { border: 0; height: 1px; background: linear-gradient(90deg, #CBA256, rgba(203,162,86,0)); margin: 28px 0; }
  .tbl { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; margin: 14px 0; }
  th, td { border: 1px solid #E7D8C0; padding: 9px 12px; text-align: left; vertical-align: top; line-height: 1.55; }
  th { background: #FFFFFF; font-weight: 700; }
  code { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  .date { font-size: 13px; color: #6B635C; margin-bottom: 8px; }
  footer { border-top: 1px solid #E7D8C0; padding: 18px 24px; display: flex; justify-content: space-between; font-size: 12px; color: #6B635C; }
</style>
</head>
<body>
<header>
  <a class="brand" href="/">
    <svg width="15" height="20" viewBox="0 0 24 32" fill="none" aria-hidden="true"><path d="M12 2C10 8 5 12 5 19a7 7 0 0 0 14 0c0-4-2.2-6.5-4-9.5-.9 2.2-2.6 3.4-3 5.5C10.2 12.3 11.6 6.5 12 2Z" fill="#E27B1B"/></svg>
    jyotim
  </a>
  <a href="/" style="font-size: 13px; color: #6B635C;">&larr; jyotim.com</a>
</header>
<main>
<div class="ov">JYOTIM &middot; LEGAL</div>
<div class="date">Last updated: ${dateStr}</div>
${bodyHtml}
</main>
<footer><span>&copy; 2026 Jyotim</span><a href="mailto:support@jyotim.com">support@jyotim.com</a></footer>
</body>
</html>`;

// PATHS — this script lives in jyotim-website/_src/.
// The legal markdown is the SINGLE SOURCE and stays in the APP repo: it is a company document the
// app also references (src/constants/legal.js), not a website file. Output goes to the repo ROOT,
// because THIS repo is the published site. Both assume jyotim-website/ and 06_PujaDaysApp/ are
// SIBLINGS — if that ever changes, LEGAL below is the only line to fix.
const LEGAL = '../../06_PujaDaysApp/legal/';
const jobs = [
  [LEGAL + 'PRIVACY_POLICY.md', '../privacy/index.html', 'Privacy Policy'],
  [LEGAL + 'TERMS_OF_SERVICE.md', '../terms/index.html', 'Terms of Service'],
  // Play's account-deletion policy: an app with accounts must publish a web URL where a user who has
  // uninstalled can still request deletion. This URL goes into the Data Safety form.
  [LEGAL + 'DELETE_ACCOUNT.md', '../delete-account/index.html', 'Delete your account'],
];
for (const [src, dst, title] of jobs) {
  const md = fs.readFileSync(fileURLToPath(new URL(src, import.meta.url)), 'utf8');
  const dateStr = (md.match(/\*\*Last updated:\s*(.+?)\*\*/) || [, 'September 2026'])[1];
  fs.mkdirSync(dst.slice(0, dst.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(dst, shell(title, mdToHtml(md), dateStr));
  console.log('wrote', dst, fs.statSync(dst).size, 'bytes');
}
