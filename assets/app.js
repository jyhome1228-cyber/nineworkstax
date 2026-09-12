'use strict';

window.NWT_APP_VERSION = '0.2.2';

const DB_KEY = 'nineworks_tax_mvp_v2';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const won = (value) => `₩${Number(value || 0).toLocaleString('ko-KR')}`;
const today = () => new Date().toISOString().slice(0, 10);
const digits = (value) => String(value || '').replace(/\D/g, '');
const num = (value) => Number(String(value || '').replace(/[^0-9-]/g, '')) || 0;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatBiz = (value) => {
  const s = digits(value);
  return s.length === 10 ? `${s.slice(0,3)}-${s.slice(3,5)}-${s.slice(5)}` : String(value || '');
};

let activeFile = null;
let activeHash = '';
let activeText = '';

function defaultDB() {
  return {
    settings: { companyName: 'NINEWORKS', businessNumber: '', ceoName: '', address: '', email: '', phone: '' },
    transactions: [
      { id:'TX-DEMO-001', date:'2026-09-02', type:'sale', clientName:'인천대학교 산학협력단', businessNumber:'', title:'브랜딩 전략 컨설팅', supply:3000000, vat:300000, total:3300000, invoiceStatus:'발행 완료', paymentStatus:'입금 대기', fileName:'샘플 데이터' },
      { id:'TX-DEMO-002', date:'2026-09-03', type:'sale', clientName:'건강미', businessNumber:'', title:'브랜드 운영', supply:1800000, vat:180000, total:1980000, invoiceStatus:'발행 완료', paymentStatus:'입금 완료', fileName:'샘플 데이터' },
      { id:'TX-DEMO-003', date:'2026-09-05', type:'sale', clientName:'ODE BELL', businessNumber:'', title:'브랜드 디자인', supply:3000000, vat:300000, total:3300000, invoiceStatus:'확인 필요', paymentStatus:'입금 대기', fileName:'샘플 데이터' },
      { id:'TX-DEMO-004', date:'2026-09-07', type:'sale', clientName:'PHYTO REVOLUTION', businessNumber:'', title:'브랜딩 프로젝트', supply:1500000, vat:150000, total:1650000, invoiceStatus:'발행 완료', paymentStatus:'입금 완료', fileName:'샘플 데이터' }
    ],
    uploads: []
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return defaultDB();
    parsed.settings ||= defaultDB().settings;
    parsed.uploads ||= [];
    return parsed;
  } catch (error) {
    console.warn('[NWT] localStorage reset', error);
    return defaultDB();
  }
}

let db = loadDB();

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  renderAll();
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

function setView(name) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === name));
  $$('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  if (history.replaceState) history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function statusClass(value = '') {
  if (value.includes('완료')) return 'status-success';
  if (value.includes('대기') || value.includes('필요')) return 'status-warning';
  return 'status-primary';
}

function transactionId() {
  return `TX-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;
}

function renderMetrics() {
  const sales = db.transactions.filter((t) => t.type === 'sale');
  const purchases = db.transactions.filter((t) => t.type === 'purchase');
  const revenue = sales.reduce((sum, t) => sum + num(t.supply), 0);
  const salesTotal = sales.reduce((sum, t) => sum + num(t.total), 0);
  const paid = sales.filter((t) => t.paymentStatus === '입금 완료').reduce((sum, t) => sum + num(t.total), 0);
  const receivable = sales.filter((t) => t.paymentStatus !== '입금 완료').reduce((sum, t) => sum + num(t.total), 0);
  const purchase = purchases.reduce((sum, t) => sum + num(t.supply), 0);

  $('#mRevenue').textContent = won(revenue);
  $('#mPaid').textContent = won(paid);
  $('#mReceivable').textContent = won(receivable);
  $('#mPurchase').textContent = won(purchase);
  $('#mPaidMeta').textContent = salesTotal ? `${Math.round((paid / salesTotal) * 1000) / 10}% 수금` : '거래 없음';
  $('#mReceivableMeta').textContent = `${sales.filter((t) => t.paymentStatus !== '입금 완료').length}건 확인 필요`;
  $('#mPurchaseMeta').textContent = `${purchases.length}건`;
}

function transactionRows(limit = null) {
  const list = [...db.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return (limit ? list.slice(0, limit) : list).map((t) => `
    <tr>
      <td class="cell-main">${escapeHtml(t.clientName || '확인 필요')}</td>
      <td>${escapeHtml(t.title || '-')}</td>
      <td>${escapeHtml(t.date || '-')}</td>
      <td class="amount">${won(t.total)}</td>
      <td><span class="status ${statusClass(t.invoiceStatus)}">${escapeHtml(t.invoiceStatus || '확인 필요')}</span></td>
      <td><span class="status ${statusClass(t.paymentStatus)}">${escapeHtml(t.paymentStatus || '입금 대기')}</span></td>
      <td><div class="row-actions">
        <button class="mini-btn" type="button" data-doc="statement" data-id="${escapeHtml(t.id)}">거래명세서</button>
        <button class="mini-btn" type="button" data-doc="quote" data-id="${escapeHtml(t.id)}">견적서</button>
      </div></td>
    </tr>`).join('');
}

function renderTransactions() {
  const empty = '<tr><td colspan="7" class="empty">등록된 거래가 없습니다.</td></tr>';
  $('#recentBody').innerHTML = transactionRows(5) || empty;
  $('#transactionsBody').innerHTML = transactionRows() || empty;
}

function clientSummary() {
  const map = new Map();
  db.transactions.forEach((t) => {
    const key = digits(t.businessNumber) || t.clientName || '확인 필요';
    if (!map.has(key)) {
      map.set(key, { name:t.clientName || '확인 필요', businessNumber:t.businessNumber || '', count:0, supply:0, total:0, receivable:0 });
    }
    const row = map.get(key);
    row.count += 1;
    row.supply += num(t.supply);
    row.total += num(t.total);
    if (t.type === 'sale' && t.paymentStatus !== '입금 완료') row.receivable += num(t.total);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function renderClients() {
  $('#clientsBody').innerHTML = clientSummary().map((c) => `
    <tr>
      <td class="cell-main">${escapeHtml(c.name)}</td>
      <td>${escapeHtml(formatBiz(c.businessNumber) || '-')}</td>
      <td>${c.count}건</td>
      <td class="amount">${won(c.supply)}</td>
      <td class="amount">${won(c.total)}</td>
      <td class="amount">${won(c.receivable)}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">거래처가 없습니다.</td></tr>';
}

function renderDocuments() {
  $('#documentsBody').innerHTML = [...db.transactions].reverse().map((t) => `
    <tr>
      <td class="cell-main">${escapeHtml(t.clientName)}</td>
      <td>${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.date)}</td>
      <td><div class="row-actions">
        <button class="mini-btn" type="button" data-doc="statement" data-id="${escapeHtml(t.id)}">거래명세서 열기</button>
        <button class="mini-btn" type="button" data-doc="quote" data-id="${escapeHtml(t.id)}">견적서 초안</button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty">생성할 문서가 없습니다.</td></tr>';
}

function renderStats() {
  const sales = db.transactions.filter((t) => t.type === 'sale');
  const purchases = db.transactions.filter((t) => t.type === 'purchase');
  const sSupply = sales.reduce((s, t) => s + num(t.supply), 0);
  const sVat = sales.reduce((s, t) => s + num(t.vat), 0);
  const pSupply = purchases.reduce((s, t) => s + num(t.supply), 0);
  const pVat = purchases.reduce((s, t) => s + num(t.vat), 0);
  $('#statsGrid').innerHTML = `
    <div class="metric"><div class="metric-label">매출 공급가액</div><div class="metric-value">${won(sSupply)}</div><div class="metric-meta">${sales.length}건</div></div>
    <div class="metric"><div class="metric-label">매출 VAT</div><div class="metric-value">${won(sVat)}</div><div class="metric-meta">예상 집계</div></div>
    <div class="metric"><div class="metric-label">매입 공급가액</div><div class="metric-value">${won(pSupply)}</div><div class="metric-meta">${purchases.length}건</div></div>
    <div class="metric"><div class="metric-label">VAT 차액</div><div class="metric-value">${won(sVat - pVat)}</div><div class="metric-meta">실제 신고액과 다를 수 있음</div></div>`;
}

function renderSettings() {
  Object.keys(db.settings).forEach((key) => {
    const el = $(`#set_${key}`);
    if (el) el.value = db.settings[key] || '';
  });
}

function renderAll() {
  renderMetrics();
  renderTransactions();
  renderClients();
  renderDocuments();
  renderStats();
  renderSettings();
}

async function hashFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}

function setProgress(message) {
  const el = $('#uploadProgress');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

async function readPdf(file) {
  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = '';
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    text += `\n${content.items.map((item) => item.str).join(' ')}`;
  }
  return text;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function readImage(file) {
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  if (!window.Tesseract) throw new Error('OCR 모듈을 불러오지 못했습니다.');
  const result = await window.Tesseract.recognize(file, 'kor+eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') setProgress(`이미지 문자 인식 ${Math.round((message.progress || 0) * 100)}%`);
    }
  });
  return result.data.text || '';
}

async function fileText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xml') || file.type.includes('xml') || file.type.startsWith('text/')) return file.text();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return readPdf(file);
  if (file.type.startsWith('image/') || /\.(jpg|jpeg|png)$/.test(name)) return readImage(file);
  throw new Error('지원하지 않는 파일 형식입니다.');
}

function numberNear(text, labels) {
  for (const label of labels) {
    const index = text.toLowerCase().indexOf(label.toLowerCase());
    if (index < 0) continue;
    const part = text.slice(index + label.length, index + label.length + 120);
    const match = part.match(/(?:₩\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/);
    if (match) return Number(match[1].replace(/,/g, ''));
  }
  return 0;
}

function dateFrom(text) {
  const match = text.match(/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);
  if (!match) return today();
  return `${match[1]}-${String(match[2]).padStart(2,'0')}-${String(match[3]).padStart(2,'0')}`;
}

function lineAfter(text, labels) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const label of labels) {
    const index = lines.findIndex((line) => line.includes(label));
    if (index >= 0) {
      const sameLine = lines[index].split(label).slice(1).join(label).replace(/^\s*[:：]?\s*/, '').trim();
      if (sameLine && sameLine.length < 80) return sameLine;
      if (lines[index + 1] && lines[index + 1].length < 80) return lines[index + 1];
    }
  }
  return '';
}

function parseInvoice(text) {
  const clean = String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ');
  const businessNumbers = [...new Set((clean.match(/\d{3}[- ]?\d{2}[- ]?\d{5}/g) || []).map(formatBiz))];
  let supply = numberNear(clean, ['공급가액', '공 급 가 액']);
  let vat = numberNear(clean, ['세액', '부가세', '부가가치세']);
  let total = numberNear(clean, ['합계금액', '합계', '총액']);
  if (!total && supply) total = supply + vat;
  if (!supply && total) supply = Math.round(total / 1.1);
  if (!vat && total && supply) vat = total - supply;

  const supplierName = lineAfter(clean, ['공급자 상호', '공급자']);
  const buyerName = lineAfter(clean, ['공급받는 자 상호', '공급받는자 상호', '공급받는 자', '공급받는자']);
  const title = lineAfter(clean, ['품목명', '품목']) || '세금계산서 거래';
  const supplierBiz = businessNumbers[0] || '';
  const buyerBiz = businessNumbers[1] || '';
  const ownBiz = digits(db.settings.businessNumber);

  let type = 'sale';
  let clientName = buyerName || '거래처 확인 필요';
  let businessNumber = buyerBiz;
  if (ownBiz && digits(buyerBiz) === ownBiz) {
    type = 'purchase';
    clientName = supplierName || '거래처 확인 필요';
    businessNumber = supplierBiz;
  }

  return { date:dateFrom(clean), type, clientName, businessNumber, title, supply, vat, total:total || supply + vat, supplierName, supplierBiz, buyerName, buyerBiz };
}

function setValue(selector, value) {
  const el = $(selector);
  if (el) el.value = value ?? '';
}

function openReview(data, fileName, errorMessage = '') {
  setValue('#r_fileName', fileName);
  setValue('#r_date', data.date || today());
  setValue('#r_type', data.type || 'sale');
  setValue('#r_clientName', data.clientName || '');
  setValue('#r_businessNumber', formatBiz(data.businessNumber));
  setValue('#r_title', data.title || '');
  setValue('#r_supply', data.supply || '');
  setValue('#r_vat', data.vat || '');
  setValue('#r_total', data.total || '');
  setValue('#r_supplierName', data.supplierName || '');
  setValue('#r_supplierBiz', formatBiz(data.supplierBiz));
  setValue('#r_buyerName', data.buyerName || '');
  setValue('#r_buyerBiz', formatBiz(data.buyerBiz));
  const note = $('#reviewWarning');
  note.textContent = errorMessage ? `자동 분석 일부 실패: ${errorMessage} 직접 확인 후 등록할 수 있습니다.` : '자동 추출값을 확인하고 필요한 항목을 수정해주세요.';
  note.className = `inline-note${errorMessage ? ' danger-note' : ''}`;
  $('#reviewModal').classList.add('open');
}

function closeReview() {
  $('#reviewModal').classList.remove('open');
}

async function handleFile(file) {
  if (!file) return;
  activeFile = file;
  setProgress('파일 확인 중…');
  activeHash = await hashFile(file);
  if (db.uploads.some((item) => item.hash === activeHash)) {
    setProgress('');
    toast('이미 등록된 파일입니다.');
    return;
  }

  try {
    setProgress(file.type.startsWith('image/') ? '이미지 OCR 준비 중…' : '문서 내용 분석 중…');
    activeText = await fileText(file);
    openReview(parseInvoice(activeText), file.name);
  } catch (error) {
    console.error('[NWT] parse failed', error);
    activeText = '';
    openReview({ date:today(), type:'sale', clientName:'', businessNumber:'', title:'', supply:0, vat:0, total:0 }, file.name, error?.message || String(error));
  } finally {
    setProgress('');
    const input = $('#fileInput');
    if (input) input.value = '';
  }
}

function syncTotal() {
  const supply = num($('#r_supply').value);
  const vat = num($('#r_vat').value);
  if (supply || vat) $('#r_total').value = supply + vat;
}

function registerReview() {
  const tx = {
    id: transactionId(),
    date: $('#r_date').value || today(),
    type: $('#r_type').value,
    clientName: $('#r_clientName').value.trim() || '거래처 확인 필요',
    businessNumber: formatBiz($('#r_businessNumber').value),
    title: $('#r_title').value.trim() || '세금계산서 거래',
    supply: num($('#r_supply').value),
    vat: num($('#r_vat').value),
    total: num($('#r_total').value),
    supplierName: $('#r_supplierName').value.trim(),
    supplierBiz: formatBiz($('#r_supplierBiz').value),
    buyerName: $('#r_buyerName').value.trim(),
    buyerBiz: formatBiz($('#r_buyerBiz').value),
    invoiceStatus: '발행 완료',
    paymentStatus: '입금 대기',
    fileName: activeFile?.name || '',
    createdAt: new Date().toISOString()
  };
  if (!tx.total) tx.total = tx.supply + tx.vat;
  db.transactions.push(tx);
  db.uploads.push({ hash:activeHash, fileName:tx.fileName, transactionId:tx.id, createdAt:tx.createdAt });
  saveDB();
  closeReview();
  toast('거래가 등록되었습니다.');
  setView('transactions');
}

function openOriginal() {
  if (!activeFile) return toast('현재 선택된 원본 파일이 없습니다.');
  const url = URL.createObjectURL(activeFile);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function printDoc(type, id) {
  const tx = db.transactions.find((item) => item.id === id);
  if (!tx) return toast('거래 데이터를 찾지 못했습니다.');
  const settings = db.settings;
  const title = type === 'statement' ? '거 래 명 세 서' : '견 적 서';
  const subtitle = type === 'quote' ? '세금계산서 거래정보를 기준으로 자동 작성된 견적서 초안입니다.' : '';
  const popup = window.open('', '_blank', 'width=900,height=1000');
  if (!popup) return toast('팝업 차단을 해제해주세요.');
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,'Noto Sans KR',sans-serif;color:#161b27;margin:48px}h1{text-align:center;letter-spacing:.22em;font-size:28px;margin:0 0 10px}.sub{text-align:center;color:#7a8290;font-size:12px;margin-bottom:40px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}.box{border-top:2px solid #182033;padding-top:12px}.box h3{font-size:13px;margin:0 0 12px;color:#596274}.box p{margin:5px 0;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{border:1px solid #dfe3ea;padding:12px;font-size:13px}th{background:#f7f9fc;text-align:left}.right{text-align:right}.total td{font-weight:700;font-size:15px}.foot{margin-top:40px;color:#8991a0;font-size:11px}.print{position:fixed;right:24px;top:24px;border:0;border-radius:8px;background:#395edf;color:#fff;padding:10px 16px;cursor:pointer}@media print{.print{display:none}body{margin:18mm}}</style></head><body><button class="print" onclick="window.print()">인쇄 / PDF 저장</button><h1>${title}</h1><div class="sub">${escapeHtml(subtitle)}</div><div class="meta"><div class="box"><h3>공급자</h3><p><b>${escapeHtml(settings.companyName || 'NINEWORKS')}</b></p><p>사업자번호 ${escapeHtml(formatBiz(settings.businessNumber) || '-')}</p><p>대표자 ${escapeHtml(settings.ceoName || '-')}</p><p>${escapeHtml(settings.address || '')}</p></div><div class="box"><h3>공급받는 자</h3><p><b>${escapeHtml(tx.clientName)}</b></p><p>사업자번호 ${escapeHtml(formatBiz(tx.businessNumber) || '-')}</p><p>거래일 ${escapeHtml(tx.date)}</p></div></div><table><thead><tr><th>품목</th><th>수량</th><th class="right">공급가액</th><th class="right">부가세</th><th class="right">합계</th></tr></thead><tbody><tr><td>${escapeHtml(tx.title)}</td><td>1</td><td class="right">${won(tx.supply)}</td><td class="right">${won(tx.vat)}</td><td class="right">${won(tx.total)}</td></tr><tr class="total"><td colspan="4">총 금액</td><td class="right">${won(tx.total)}</td></tr></tbody></table><div class="foot">NINEWORKS TAX에서 생성된 문서입니다. ${type === 'quote' ? '작업범위·기간·결제조건 등은 최종 발송 전 확인해주세요.' : ''}</div></body></html>`);
  popup.document.close();
}

function saveSettings() {
  ['companyName','businessNumber','ceoName','address','email','phone'].forEach((key) => {
    const el = $(`#set_${key}`);
    if (el) db.settings[key] = el.value.trim();
  });
  saveDB();
  toast('회사 정보가 저장되었습니다.');
}

function bindEvents() {
  const fileInput = $('#fileInput');

  document.addEventListener('click', (event) => {
    const viewTrigger = event.target.closest('[data-view]');
    if (viewTrigger) {
      event.preventDefault();
      setView(viewTrigger.dataset.view);
      return;
    }

    const docTrigger = event.target.closest('[data-doc]');
    if (docTrigger) {
      event.preventDefault();
      printDoc(docTrigger.dataset.doc, docTrigger.dataset.id);
    }
  });

  $('#goUpload')?.addEventListener('click', () => fileInput?.click());
  $('#goTransactions')?.addEventListener('click', () => setView('transactions'));
  $('#goAllTransactions')?.addEventListener('click', () => setView('transactions'));

  $$('[data-pick-file]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileInput?.click();
  }));

  fileInput?.addEventListener('change', () => handleFile(fileInput.files?.[0]));

  $$('.upload-zone').forEach((zone) => {
    zone.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      fileInput?.click();
    });
    ['dragenter','dragover'].forEach((name) => zone.addEventListener(name, (event) => {
      event.preventDefault();
      zone.classList.add('dragging');
    }));
    ['dragleave','drop'].forEach((name) => zone.addEventListener(name, (event) => {
      event.preventDefault();
      zone.classList.remove('dragging');
    }));
    zone.addEventListener('drop', (event) => handleFile(event.dataTransfer?.files?.[0]));
  });

  $('#reviewClose')?.addEventListener('click', closeReview);
  $('#reviewCancel')?.addEventListener('click', closeReview);
  $('#reviewRegister')?.addEventListener('click', registerReview);
  $('#reviewOriginal')?.addEventListener('click', openOriginal);
  $('#reviewModal')?.addEventListener('click', (event) => { if (event.target.id === 'reviewModal') closeReview(); });
  $('#r_supply')?.addEventListener('input', syncTotal);
  $('#r_vat')?.addEventListener('input', syncTotal);

  $('#saveSettings')?.addEventListener('click', saveSettings);
  $('#resetData')?.addEventListener('click', () => {
    if (!confirm('테스트 데이터를 초기화할까요?')) return;
    localStorage.removeItem(DB_KEY);
    db = defaultDB();
    saveDB();
    toast('테스트 데이터가 초기화되었습니다.');
  });

  $('#searchInput')?.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    $$('#transactionsBody tr').forEach((row) => {
      row.style.display = !query || row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  });

  $('.mobile-menu')?.addEventListener('click', () => {
    const sidebar = $('.sidebar');
    if (!sidebar) return;
    const open = sidebar.dataset.mobileOpen === '1';
    sidebar.dataset.mobileOpen = open ? '0' : '1';
    if (!open) {
      Object.assign(sidebar.style, { display:'flex', position:'fixed', zIndex:'80', left:'0', top:'0', width:'232px', boxShadow:'10px 0 30px rgba(24,32,51,.14)' });
    } else {
      sidebar.removeAttribute('style');
    }
  });
}

function init() {
  try {
    const required = ['#mRevenue','#recentBody','#transactionsBody','#clientsBody','#documentsBody','#statsGrid','#fileInput','#reviewModal'];
    const missing = required.filter((selector) => !$(selector));
    if (missing.length) throw new Error(`필수 UI 요소 누락: ${missing.join(', ')}`);
    renderAll();
    bindEvents();
    const initial = location.hash.replace('#','');
    setView(['dashboard','upload','transactions','clients','documents','stats','settings'].includes(initial) ? initial : 'dashboard');
    document.documentElement.dataset.nwtReady = '1';
    console.info(`[NINEWORKS TAX] Interactive MVP ${window.NWT_APP_VERSION} ready`);
  } catch (error) {
    console.error('[NINEWORKS TAX] startup error', error);
    const el = $('#toast');
    if (el) {
      el.textContent = '화면 초기화 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.';
      el.classList.add('show');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once:true });
} else {
  init();
}
