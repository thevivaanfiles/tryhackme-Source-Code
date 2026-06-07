"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// Renders user/admin-authored markdown, sanitized to prevent XSS.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-ctf text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
