import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe defaults
marked.setOptions({
  breaks: true,
  gfm: true
});

/**
 * Renders markdown content to sanitized HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';

  const html = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
