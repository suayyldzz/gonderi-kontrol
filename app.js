import { analyze, buildUtmUrl } from './src/analyze.js';

const $ = (sel) => document.querySelector(sel);
const textEl = $('#text');
const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function renderAnalysis() {
  const r = analyze(textEl.value);

  $('#stats').innerHTML = [
    ['karakter', r.chars],
    ['kelime', r.words],
    ['hashtag', r.hashtags.length],
    ['mention', r.mentions.length],
    ['link', r.urls.length],
  ].map(([k, v]) => `<span><b>${v}</b> ${k}</span>`).join('');

  $('#tags').innerHTML = [...new Set(r.hashtags)]
    .map((h) => `<span class="chip${r.duplicateHashtags.includes(h) ? ' dup' : ''}">#${esc(h)}</span>`)
    .join('') + (r.duplicateHashtags.length ? '<span class="note">Kırmızı etiketler tekrar ediyor</span>' : '');

  $('#platforms').innerHTML = Object.values(r.platforms).map((p) => {
    const pct = Math.min(100, (p.length / p.limit) * 100);
    const state = !p.ok ? 'over' : pct > 90 ? 'near' : 'fine';
    return `
      <article class="card ${state}">
        <header><h3>${p.platform}</h3><span class="count">${p.length} / ${p.limit}</span></header>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <p class="status">${p.ok ? `${p.remaining} karakter kaldı` : 'Paylaşıma uygun değil'}</p>
        ${p.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
      </article>`;
  }).join('');

  try { localStorage.setItem('gonderi-kontrol:text', textEl.value); } catch {}
}

function renderUtm() {
  const data = Object.fromEntries(new FormData($('#utm-form')));
  const out = $('#utm-result');
  const btn = $('#copy');
  if (!data.base) {
    out.textContent = 'Hedef URL girince link burada oluşur.';
    out.className = '';
    btn.disabled = true;
    return;
  }
  try {
    out.textContent = buildUtmUrl(data.base, data);
    out.className = 'ready';
    btn.disabled = false;
  } catch (e) {
    out.textContent = e.message;
    out.className = 'error';
    btn.disabled = true;
  }
}

$('#copy').addEventListener('click', async () => {
  const btn = $('#copy');
  try {
    await navigator.clipboard.writeText($('#utm-result').textContent);
    btn.textContent = 'Kopyalandı';
  } catch {
    btn.textContent = 'Kopyalanamadı';
  }
  setTimeout(() => (btn.textContent = 'Kopyala'), 1500);
});

try { textEl.value = localStorage.getItem('gonderi-kontrol:text') ?? ''; } catch {}
textEl.addEventListener('input', renderAnalysis);
$('#utm-form').addEventListener('input', renderUtm);
renderAnalysis();
