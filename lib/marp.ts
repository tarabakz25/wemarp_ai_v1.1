import { Marp } from "@marp-team/marp-core"
import type { RenderOptions, RenderResult } from "@/types/marp"

/**
 * 透かしのCSSを生成（text は必須ではない）
 */
function watermarkCSS(text?: string) {
  if (!text) return '';
  // 右下に半透明で固定表示。印刷にも乗るように position: fixed
  return `
  .wemarp-watermark {
    position: fixed;
    right: 12mm;
    bottom: 10mm;
    font-size: 12px;
    opacity: 0.35;
    pointer-events: none;
    z-index: 2147483647;
  }
  @media screen {
    .wemarp-watermark { opacity: .35; }
  }
  @media print {
    .wemarp-watermark { opacity: .25; }
  }
  `;
}

/**
 * 印刷/PDF 向けの最小CSS
 * - 背景を印刷
 * - スライド毎に改ページ
 * - 余白最小化（適宜調整）
 */
function printCSS() {
  return `
  @page { size: A4; margin: 10mm; }
  html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  section { break-after: page; }
  `;
}

function baseResetCSS() {
  // iframe直下に入るので最低限のリセットだけ
  return `
  html, body { margin: 0; padding: 0; height: 100%; }
  body { background: #fff; }
  #root { min-height: 100%; }
  `;
}

/**
 * Marp インスタンスを作成し、必要ならテーマを登録
 */
function createMarp(opts: RenderOptions) {
  const marp = new Marp({
    html: true,          // HTML許可（必要に応じてfalseでも）
    container: false,    // 外側ラッパ不要（自前でdocを組む）
    inlineSVG: true,     // アイコン等のSVG埋め込み
  });

  // 任意テーマのCSSを追加
  if (opts.themeCSS) {
    try {
      // 名前を付けたい場合は CSS 側に /* @theme <name> */ を含める
      marp.themeSet.add(opts.themeCSS);
    } catch {
      // 同名テーマの重複登録などは無視して続行
    }
  }

  return marp;
}

/**
 * Markdown（Marp front-matter 含む）→ 完全HTML
 * - 返り値は <html>〜</html> を含むドキュメント
 */
export function renderMarkdownToHTMLDocument(
  markdown: string,
  options: RenderOptions = {}
): RenderResult {
  const marp = createMarp(options);

  // themeName が与えられている場合、front-matter が無ければ適用するための前処理
  // 既に --- ... theme: xxx ... --- がある場合はユーザ指定を優先
  const md = injectThemeIfNotSpecified(markdown, options.themeName);

  const { html, css } = marp.render(md);

  const styles: string[] = [
    baseResetCSS(),
    css, // marp-core が生成したCSS
  ];

  if (options.withPrintCSS) styles.push(printCSS());
  if (options.extraCSS) styles.push(options.extraCSS);
  styles.push(watermarkCSS(options.watermarkText));

  const head = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<style>${styles.join('\n')}</style>`,
  ].join('\n');

  const watermarkDiv = options.watermarkText
    ? `<div class="wemarp-watermark">${escapeHTML(options.watermarkText)}</div>`
    : '';

  const document = [
    '<!doctype html>',
    '<html>',
    '<head>',
    head,
    '</head>',
    '<body>',
    '<div id="root">',
    html,
    '</div>',
    watermarkDiv,
    '</body>',
    '</html>',
  ].join('\n');

  return {
    htmlDocument: document,
    slideCount: countSlides(html),
  };
}

/**
 * 既に front-matter に theme が無ければ追記する
 */
function injectThemeIfNotSpecified(src: string, themeName?: string) {
  if (!themeName) return src;

  // front-matter があるか？
  const fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fm) {
    // 無ければ新規に付与
    return `---\ntheme: ${themeName}\n---\n${src}`;
  }

  // ある場合、theme 行が無ければ追記
  const block = fm[0];
  if (!/^\s*theme\s*:/m.test(block)) {
    const replaced = block.replace(/^---\n/, `---\ntheme: ${themeName}\n`);
    return src.replace(block, replaced);
  }
  return src;
}

/**
 * スライド数を概算（Marpは <section> をスライド単位で出す）
 */
function countSlides(renderedHtml: string) {
  // 厳密にやるなら DOMParser を使うが、SSR側でも使える簡易カウントで十分
  return (renderedHtml.match(/<section\b/gi) || []).length;
}

function escapeHTML(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * 便利関数：プレビュー用（iframe srcDoc 向け）を即生成
 */
export function mdToPreviewHtml(
  markdown: string,
  opts: RenderOptions = {}
): string {
  return renderMarkdownToHTMLDocument(markdown, opts).htmlDocument;
}

/**
 * 便利関数：PDF化を見越したHTML（印刷CSS+透かし）
 * - /api/convert (pdf) で Playwright へ渡すのに使う
 */
export function mdToPrintableHtml(
  markdown: string,
  watermarkForFree?: string,
  themeCSS?: string,
  themeName?: string
): string {
  const { htmlDocument } = renderMarkdownToHTMLDocument(markdown, {
    withPrintCSS: true,
    watermarkText: watermarkForFree,
    themeCSS,
    themeName,
  });
  return htmlDocument;
}