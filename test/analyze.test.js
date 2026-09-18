import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countChars,
  extractHashtags,
  extractMentions,
  platformLength,
  analyzePlatform,
  analyze,
  buildUtmUrl,
} from '../src/analyze.js';

test('emoji ve Türkçe karakterleri tek karakter sayar', () => {
  assert.equal(countChars('çğıöşü'), 6);
  assert.equal(countChars('👍🏽'), 1);
  assert.equal(countChars('👨‍👩‍👧'), 1);
});

test('hashtagleri Türkçe karakterlerle ve küçük harfe çevirerek bulur', () => {
  assert.deepEqual(extractHashtags('Merhaba #İstanbul #kahve_keyfi #2026'), ['istanbul', 'kahve_keyfi', '2026']);
});

test('kelime içindeki # işaretini hashtag saymaz', () => {
  assert.deepEqual(extractHashtags('C# ve renk#fff'), []);
});

test('mentionları bulur, e-postayı saymaz', () => {
  assert.deepEqual(extractMentions('@beykent ile mail@site.com'), ['beykent']);
});

test('X linkleri 23 karakter sayar', () => {
  const text = 'Bak: https://example.com/cok/uzun/bir/adres/burada';
  assert.equal(platformLength(text, 'x'), 'Bak: '.length + 23);
  assert.equal(platformLength(text, 'threads'), countChars(text));
});

test('limit aşımını raporlar', () => {
  const r = analyzePlatform('a'.repeat(300), 'x');
  assert.equal(r.ok, false);
  assert.equal(r.remaining, -20);
  assert.match(r.warnings[0], /20 karakter fazla/);
});

test('Instagram 30 hashtag sınırını kontrol eder', () => {
  const text = Array.from({ length: 31 }, (_, i) => `#etiket${i}`).join(' ');
  assert.equal(analyzePlatform(text, 'instagram').ok, false);
});

test('tekrarlanan hashtagleri yakalar', () => {
  assert.deepEqual(analyze('#Kahve güzel #kahve').duplicateHashtags, ['kahve']);
});

test('boş metin', () => {
  const r = analyze('');
  assert.equal(r.chars, 0);
  assert.equal(r.words, 0);
});

test('UTM linki üretir, boş alanları atlar, boşlukları normalize eder', () => {
  const url = buildUtmUrl('https://site.com/urun?id=5', {
    source: 'Instagram',
    medium: 'social',
    campaign: 'Yaz Kampanyası',
    content: '  ',
  });
  const u = new URL(url);
  assert.equal(u.searchParams.get('id'), '5');
  assert.equal(u.searchParams.get('utm_source'), 'instagram');
  assert.equal(u.searchParams.get('utm_campaign'), 'yaz_kampanyası');
  assert.equal(u.searchParams.has('utm_content'), false);
});

test('geçersiz URL için anlaşılır hata verir', () => {
  assert.throws(() => buildUtmUrl('site.com', {}), /Geçerli bir URL/);
});
