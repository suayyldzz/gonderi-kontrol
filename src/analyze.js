// Gönderi metnini platform kurallarına göre analiz eden saf fonksiyonlar.
// DOM'a bağımlı değil; hem tarayıcıda hem Node testlerinde çalışır.

export const PLATFORMS = {
  x: { name: 'X (Twitter)', limit: 280, urlLength: 23 },
  threads: { name: 'Threads', limit: 500 },
  instagram: { name: 'Instagram', limit: 2200, maxHashtags: 30, previewChars: 125 },
  linkedin: { name: 'LinkedIn', limit: 3000, previewChars: 210 },
};

const URL_RE = /https?:\/\/[^\s]+/g;
const HASHTAG_RE = /(^|\s)#([\p{L}\p{N}_]+)/gu;
const MENTION_RE = /(^|\s)@([\p{L}\p{N}_.]+)/gu;

// Emoji ve Türkçe karakterleri tek karakter saymak için grapheme bazlı sayım.
export function countChars(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('tr', { granularity: 'grapheme' });
    let n = 0;
    for (const _ of seg.segment(text)) n++;
    return n;
  }
  return [...text].length;
}

export function extractHashtags(text) {
  return [...text.matchAll(HASHTAG_RE)].map((m) => m[2].toLocaleLowerCase('tr'));
}

export function extractMentions(text) {
  return [...text.matchAll(MENTION_RE)].map((m) => m[2]);
}

export function extractUrls(text) {
  return text.match(URL_RE) ?? [];
}

// X, her linki uzunluğundan bağımsız olarak sabit uzunlukta sayar (t.co kısaltması).
export function platformLength(text, platformKey) {
  const p = PLATFORMS[platformKey];
  if (!p) throw new Error(`Bilinmeyen platform: ${platformKey}`);
  if (!p.urlLength) return countChars(text);
  const urls = extractUrls(text);
  const withoutUrls = urls.reduce((t, u) => t.replace(u, ''), text);
  return countChars(withoutUrls) + urls.length * p.urlLength;
}

export function analyzePlatform(text, platformKey) {
  const p = PLATFORMS[platformKey];
  const length = platformLength(text, platformKey);
  const hashtags = extractHashtags(text);
  const warnings = [];

  if (length > p.limit) warnings.push(`${length - p.limit} karakter fazla`);
  if (p.maxHashtags && hashtags.length > p.maxHashtags) {
    warnings.push(`En fazla ${p.maxHashtags} hashtag kullanılabilir`);
  }
  if (p.previewChars && countChars(text) > p.previewChars) {
    warnings.push(`İlk ~${p.previewChars} karakterden sonrası "devamı" ile gizlenir`);
  }

  return {
    platform: p.name,
    length,
    limit: p.limit,
    remaining: p.limit - length,
    ok: length <= p.limit && !(p.maxHashtags && hashtags.length > p.maxHashtags),
    warnings,
  };
}

export function analyze(text) {
  const hashtags = extractHashtags(text);
  const counts = new Map();
  for (const h of hashtags) counts.set(h, (counts.get(h) ?? 0) + 1);

  return {
    chars: countChars(text),
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    hashtags,
    duplicateHashtags: [...counts].filter(([, n]) => n > 1).map(([h]) => h),
    mentions: extractMentions(text),
    urls: extractUrls(text),
    platforms: Object.fromEntries(
      Object.keys(PLATFORMS).map((k) => [k, analyzePlatform(text, k)]),
    ),
  };
}

// UTM değerleri analitik raporlarında düzgün görünsün diye ASCII slug'a çevrilir.
const TR_ASCII = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
export function slugify(value) {
  return value
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => TR_ASCII[c])
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '');
}

// Kampanya trafiğini analitikte ayırt etmek için UTM parametreli link üretir.
export function buildUtmUrl(base, { source, medium, campaign, content, term } = {}) {
  let url;
  try {
    url = new URL(base);
  } catch {
    throw new Error('Geçerli bir URL girin (https:// ile)');
  }
  const params = { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_content: content, utm_term: term };
  for (const [key, value] of Object.entries(params)) {
    const v = value ? slugify(value) : '';
    if (v) url.searchParams.set(key, v);
  }
  return url.toString();
}
