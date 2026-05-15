import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Check,
  Clipboard,
  Copy,
  Eraser,
  FileText,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

const TWEET_LIMIT = 280;
const STORAGE_KEY = "thread-crafter-draft";
const DEFAULT_TEXT =
  "Paste a blog post, newsletter draft, launch note, or raw thought here. Thread Crafter will break it into clean tweet-sized parts while preserving the flow of your writing.";

type CopyTarget = "full" | number | null;

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function splitOversizedToken(token: string, limit: number) {
  const pieces: string[] = [];
  for (let index = 0; index < token.length; index += limit) {
    pieces.push(token.slice(index, index + limit));
  }
  return pieces;
}

function splitSegment(segment: string, limit: number) {
  const words = segment.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (word.length > limit) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitOversizedToken(word, limit));
      return;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= limit) {
      current = candidate;
    } else {
      chunks.push(current);
      current = word;
    }
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitIntoBaseChunks(text: string, limit: number) {
  const clean = normalizeText(text);
  if (!clean) return [];

  return splitSegment(clean.replace(/\s+/g, " "), limit);
}

function craftThread(text: string) {
  return splitIntoBaseChunks(text, TWEET_LIMIT);
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  title?: string;
}) {
  const variants = {
    primary: "bg-neutral-950 text-white hover:bg-neutral-800",
    secondary: "border border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-100",
    ghost: "text-neutral-700 hover:bg-neutral-100",
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export function App() {
  const [draft, setDraft] = useState(() => window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_TEXT);
  const [copied, setCopied] = useState<CopyTarget>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, draft);
  }, [draft]);

  const tweets = useMemo(() => craftThread(draft), [draft]);
  const normalizedLength = normalizeText(draft).length;
  const longestTweet = tweets.reduce((max, tweet) => Math.max(max, tweet.length), 0);
  const fullThread = tweets.join("\n\n");

  async function copyText(value: string, target: CopyTarget) {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function clearDraft() {
    setDraft("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
              <Sparkles size={14} />
              Private browser-only thread builder
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Thread Crafter</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setDraft(DEFAULT_TEXT)} variant="secondary" title="Load sample">
              <RefreshCcw size={16} />
              Sample
            </Button>
            <Button onClick={clearDraft} variant="secondary" title="Clear editor">
              <Eraser size={16} />
              Clear
            </Button>
            <Button disabled={!tweets.length} onClick={() => copyText(fullThread, "full")}>
              {copied === "full" ? <Check size={16} /> : <Clipboard size={16} />}
              {copied === "full" ? "Copied" : "Copy thread"}
            </Button>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-170px)] gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="flex min-h-[560px] flex-col rounded-xl border border-neutral-200 bg-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText size={16} />
                Editor
              </div>
            </div>

            <textarea
              aria-label="Long-form content editor"
              className="scrollbar-thin min-h-[440px] flex-1 resize-none bg-transparent p-5 text-base leading-7 text-neutral-900 outline-none placeholder:text-neutral-400"
              onChange={handleDraftChange}
              placeholder="Write or paste long-form content..."
              value={draft}
            />

            <div className="grid gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:grid-cols-3">
              <div>
                <span className="font-medium text-neutral-950">{normalizedLength}</span> characters
              </div>
              <div>
                <span className="font-medium text-neutral-950">{tweets.length}</span> tweets
              </div>
              <div>
                <span className="font-medium text-neutral-950">{longestTweet}</span> / {TWEET_LIMIT} longest
              </div>
            </div>
          </div>

          <aside className="flex min-h-[560px] flex-col rounded-xl border border-neutral-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Thread Preview</h2>
                <p className="text-xs text-neutral-500">Ready to paste manually into Twitter/X</p>
              </div>
              <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {TWEET_LIMIT} max
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
              {tweets.length ? (
                tweets.map((tweet, index) => (
                  <article
                    className="rounded-lg border border-neutral-200 bg-[#fbfbfa] p-4 transition hover:border-neutral-300"
                    key={`${tweet}-${index}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                        Tweet {index + 1}
                      </span>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
                        onClick={() => copyText(tweet, index)}
                        title={`Copy tweet ${index + 1}`}
                        type="button"
                      >
                        {copied === index ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-neutral-900">
                      {tweet}
                    </p>
                    <div className="mt-3 flex justify-end text-xs text-neutral-500">
                      {tweet.length} / {TWEET_LIMIT}
                    </div>
                  </article>
                ))
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed border-neutral-300 px-6 text-center text-sm text-neutral-500">
                  Your thread preview will appear as soon as you start writing.
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
