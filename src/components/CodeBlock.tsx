import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: 'prisma' | 'typescript';
}

type Token = { text: string; cls: string };

// --- Prisma tokenizer ------------------------------------------------------

const PRISMA_KEYWORDS = new Set([
  'generator',
  'datasource',
  'model',
  'enum',
  'provider',
  'url',
  'env',
  'extensions',
  'previewFeatures',
]);

const PRISMA_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Decimal',
  'Json',
  'Bytes',
  'BigInt',
  'Unsupported',
]);

const PRISMA_ATTRS = new Set([
  '@id',
  '@default',
  '@unique',
  '@relation',
  '@index',
  '@map',
  '@db',
  '@updatedAt',
]);

function tokenizePrisma(line: string): Token[] {
  const trimmed = line.trimStart();
  const leading = line.slice(0, line.length - trimmed.length);

  if (trimmed.startsWith('//')) {
    return [{ text: line, cls: 'text-slate-500 italic' }];
  }

  const tokens: Token[] = [];
  if (leading) tokens.push({ text: leading, cls: '' });

  const parts = trimmed.split(/(\s+|[(){}[\],])/);
  let depth = 0;

  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, cls: '' });
      continue;
    }
    if (part === '(') {
      depth++;
      tokens.push({ text: part, cls: 'text-slate-500' });
      continue;
    }
    if (part === ')') {
      depth = Math.max(0, depth - 1);
      tokens.push({ text: part, cls: 'text-slate-500' });
      continue;
    }
    if (part === '[' || part === ']' || part === '{' || part === '}' || part === ',') {
      tokens.push({ text: part, cls: 'text-slate-600' });
      continue;
    }
    if (PRISMA_ATTRS.has(part) || part.startsWith('@')) {
      tokens.push({ text: part, cls: 'text-amber-400' });
      continue;
    }
    if (depth > 0) {
      if (/^[a-z_][a-zA-Z0-9_]*$/.test(part)) {
        tokens.push({ text: part, cls: 'text-[#FF5A1F]' });
      } else if (/^["'].*["']$/.test(part)) {
        tokens.push({ text: part, cls: 'text-[#00E5FF]' });
      } else if (/^\d/.test(part)) {
        tokens.push({ text: part, cls: 'text-orange-300' });
      } else {
        tokens.push({ text: part, cls: 'text-slate-300' });
      }
      continue;
    }
    if (PRISMA_KEYWORDS.has(part)) {
      tokens.push({ text: part, cls: 'text-fuchsia-400 font-semibold' });
      continue;
    }
    if (PRISMA_TYPES.has(part)) {
      tokens.push({ text: part, cls: 'text-[#00E5FF]' });
      continue;
    }
    if (/^[a-z][a-zA-Z0-9_]*$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#E2E8F0]' });
      continue;
    }
    if (/^[A-Z][a-zA-Z0-9_]*$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#FF5A1F]' });
      continue;
    }
    if (/^["'].*["']$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#00E5FF]' });
      continue;
    }
    if (/^\d/.test(part)) {
      tokens.push({ text: part, cls: 'text-orange-300' });
      continue;
    }
    tokens.push({ text: part, cls: 'text-slate-300' });
  }
  return tokens;
}

// --- TypeScript tokenizer --------------------------------------------------

const TS_KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'default',
  'const',
  'let',
  'var',
  'function',
  'async',
  'await',
  'return',
  'if',
  'else',
  'for',
  'of',
  'in',
  'new',
  'interface',
  'type',
  'enum',
  'class',
  'extends',
  'implements',
  'public',
  'private',
  'readonly',
  'void',
  'as',
  'typeof',
  'Promise',
  'true',
  'false',
  'null',
  'undefined',
]);

const TS_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'never',
  'object',
  'Request',
  'Response',
  'Router',
  'Record',
  'Array',
  'Date',
]);

function tokenizeTs(line: string): Token[] {
  const trimmed = line.trimStart();
  const leading = line.slice(0, line.length - trimmed.length);

  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return [{ text: line, cls: 'text-slate-500 italic' }];
  }

  const tokens: Token[] = [];
  if (leading) tokens.push({ text: leading, cls: '' });

  const parts = trimmed.split(/(\s+|[(){}[\],;:.=<>])/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, cls: '' });
      continue;
    }
    if ('(){}[],;:.=<>'.includes(part)) {
      tokens.push({ text: part, cls: 'text-slate-600' });
      continue;
    }
    if (TS_KEYWORDS.has(part)) {
      tokens.push({ text: part, cls: 'text-fuchsia-400' });
      continue;
    }
    if (TS_TYPES.has(part)) {
      tokens.push({ text: part, cls: 'text-[#00E5FF]' });
      continue;
    }
    if (/^["'`].*["'`]$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#FF5A1F]' });
      continue;
    }
    if (/^\d/.test(part)) {
      tokens.push({ text: part, cls: 'text-orange-300' });
      continue;
    }
    if (/^[A-Z][a-zA-Z0-9_]*$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#FF5A1F]' });
      continue;
    }
    if (/^[a-z_][a-zA-Z0-9_]*$/.test(part)) {
      tokens.push({ text: part, cls: 'text-[#E2E8F0]' });
      continue;
    }
    tokens.push({ text: part, cls: 'text-slate-300' });
  }
  return tokens;
}

function tokenizeLine(line: string, language: 'prisma' | 'typescript'): Token[] {
  return language === 'prisma' ? tokenizePrisma(line) : tokenizeTs(line);
}

export function CodeBlock({ code, filename = 'schema.prisma', language = 'prisma' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.split('\n'), [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#1F293D] bg-[#0A0D14]/80 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-[#1F293D] bg-[#121824]/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-[#FF5A1F]/80" />
          <span className="ml-3 font-mono text-xs text-[#64748B]">{filename}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#64748B] transition hover:bg-[#1F293D] hover:text-[#E2E8F0]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#FF5A1F]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="max-h-[640px] overflow-auto">
        <pre className="min-w-full font-mono text-[13px] leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-[#121824]/60">
                <span className="sticky left-0 w-12 flex-none select-none border-r border-[#1F293D]/60 bg-[#0A0D14]/80 px-2 text-right text-slate-700">
                  {i + 1}
                </span>
                <span className="whitespace-pre px-4">
                  {tokenizeLine(line, language).map((t, j) => (
                    <span key={j} className={t.cls}>
                      {t.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
