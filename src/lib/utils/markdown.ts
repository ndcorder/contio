import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  }),
  {
    breaks: true,
    gfm: true
  }
);

/**
 * Renders markdown content to sanitized HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';

  const html = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
