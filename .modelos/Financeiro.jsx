import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import TopBarIcons from '../components/TopBarIcons';
import { toast } from '../components/Toast';
import { useFinanceiro } from '../hooks/useFinanceiro';
import { supabase } from '../lib/supabase';
import { loggedUser } from '../components/AccessGuard';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Pagination } from '../components/ui/Pagination';
import {
  Wallet, Plus, X, Loader2, CalendarClock, AlertTriangle,
  Trash2, LineChart, Coins, Receipt, ChevronRight, ChevronLeft, ChevronDown, Undo2,
  CheckCircle2, Layers, ListChecks, Database, ArrowDownRight, ArrowUpRight,
  Handshake, Banknote, Clock, BarChart3, DollarSign, Euro, RefreshCw,
  PieChart, TrendingUp, Folder, Tag, Search, Check
} from 'lucide-react';

/* ============================================================
   Helpers de data e dinheiro
   ============================================================ */
const HOJE = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; })();
const toDate = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`) : null);
const fmtMoney = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const fmtDataFull = (iso) => { const d = toDate(iso); return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'; };
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => { const [y, m] = key.split('-'); const d = new Date(Number(y), Number(m) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const isEntrada = (t) => t.tipo === 'comissao' || t.tipo === 'receita';
const parcelaVencida = (p) => p.status === 'pendente' && toDate(p.vencimento) < HOJE;

const TIPO_META = {
  comissao: { label: 'Comissão', icon: <Handshake size={15} />, entrada: true, color: '#B08D45' },
  receita: { label: 'Receita', icon: <ArrowUpRight size={15} />, entrada: true, color: '#107c42' },
  despesa: { label: 'Despesa', icon: <ArrowDownRight size={15} />, entrada: false, color: '#ef4444' },
};

const CATEGORIAS_DESPESA = [
  'Servidores & Cloud',
  'Software & Assinaturas',
  'Domínio & SSL',
  'Marketing & Anúncios',
  'Salários & Equipe',
  'Impostos & Taxas',
  'Equipamentos & Hardware',
  'Escritório & Licenças',
  'Outros'
];

const CATEGORIAS_RECEITA = [
  'Desenvolvimento & Software',
  'Consultoria & Assessoria',
  'Manutenção & Suporte',
  'Design & UI/UX',
  'Licenciamento & Royalties',
  'Outros'
];

const GASTO_CORES = ['#ef4444', '#4C5FD5', '#DB2777', '#EA580C', '#7C3AED', '#0D9488', '#0891B2', '#D97706', '#8B5CF6', '#059669', '#E11D48', '#2563EB'];

const statusTitulo = (t) => {
  const ps = t.parcelas;
  if (!ps || !ps.length) return { key: 'vazio', label: 'Sem parcelas', color: '#7a7a7a', bg: 'rgba(122,122,122,0.15)' };
  const todasReceb = ps.every(p => p.status === 'recebido');
  const algumaReceb = ps.some(p => p.status === 'recebido');
  const algumaVencida = ps.some(p => parcelaVencida(p));
  if (todasReceb) return { key: 'liquidado', label: isEntrada(t) ? 'Recebido' : 'Pago', color: '#107c42', bg: 'rgba(16,124,66,0.15)' };
  if (algumaVencida) return { key: 'atrasado', label: 'Atrasado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (algumaReceb) return { key: 'parcial', label: 'Parcial', color: '#B08D45', bg: 'rgba(176,141,69,0.15)' };
  return { key: 'aberto', label: 'Em aberto', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
};

const statusParcela = (p) => {
  if (p.status === 'recebido') return { label: 'Baixada', color: '#107c42', bg: 'rgba(16,124,66,0.15)' };
  if (parcelaVencida(p)) return { label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  const dias = Math.round((toDate(p.vencimento) - HOJE) / 86400000);
  if (dias <= 7) return { label: `Vence em ${dias <= 0 ? 'hoje' : `${dias}d`}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return { label: 'A vencer', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
};

function useIsMobile(bp = 720) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= bp : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= bp);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return mobile;
}

/* ============================================================
   Cotações do dia (Dólar / Euro) — AwesomeAPI
   ============================================================ */
function CotacaoChip({ icon, nome, cotacao, mobile }) {
  const varNum = cotacao && cotacao.pctChange != null ? Number(cotacao.pctChange) : null;
  const up = varNum != null && varNum >= 0;
  const hora = cotacao?.create_date ? cotacao.create_date.slice(11, 16) : null;
  return (
    <div className="bg-surface-pearl border border-hairline rounded-xl px-3 py-1 flex items-center gap-2.5 shadow-sm" style={{ minWidth: mobile ? 0 : '148px', flex: mobile ? '1 1 0' : 'none' }} title={hora ? `Atualizado às ${hora}` : 'Cotação do dia'}>
      <div className="w-7 h-7 rounded-lg shrink-0 bg-[#107c42]/15 text-[#107c42] flex items-center justify-center text-xs">{icon}</div>
      <div>
        <div className="text-[9.5px] font-bold tracking-wider uppercase text-ink-muted-48 leading-tight">{nome} · hoje</div>
        <div className="flex items-baseline gap-1.5 leading-tight">
          <span className="text-[13.5px] font-bold text-ink tracking-tight">{cotacao ? fmtMoney(Number(cotacao.bid)) : '—'}</span>
          {varNum != null && (
            <span className={`text-[10px] font-bold ${up ? 'text-[#107c42]' : 'text-red-500'}`}>
              {up ? '▲' : '▼'}{Math.abs(varNum).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CotacoesHoje({ mobile }) {
  const [cot, setCot] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('falha'))))
      .then(d => { if (ativo) setCot(d); })
      .catch(() => { if (ativo) setCot(null); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="flex gap-2 flex-wrap" style={{ width: mobile ? '100%' : 'auto' }}>
      <CotacaoChip mobile={mobile} icon={carregando ? <RefreshCw size={15} className="animate-spin" /> : <DollarSign size={16} />} nome="Dólar" cotacao={cot?.USDBRL} />
      <CotacaoChip mobile={mobile} icon={carregando ? <RefreshCw size={15} className="animate-spin" /> : <Euro size={16} />} nome="Euro" cotacao={cot?.EURBRL} />
    </div>
  );
}

/* ============================================================
   KPI Card
   ============================================================ */
function Kpi({ icon, tint, value, label, sub, accent }) {
  return (
    <div className="relative overflow-hidden bg-surface-pearl border border-hairline rounded-2xl p-4 min-h-[112px] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent || `linear-gradient(90deg, ${tint}, transparent)` }} />
      <div className="flex justify-between items-start gap-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tint}15`, color: tint }}>{icon}</div>
        {sub && <span className="text-[10.5px] font-medium text-ink-muted-48 text-right max-w-[120px] leading-tight truncate">{sub}</span>}
      </div>
      <div>
        <div className="text-[18px] font-bold tracking-tight text-ink truncate leading-tight mt-1.5" title={value}>{value}</div>
        <div className="text-[10.5px] font-bold tracking-wider uppercase text-ink-muted-80 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

const fmtEixo = (v) => {
  const a = Math.abs(v);
  if (a >= 1000000) return `${(v / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  if (a >= 1000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
};

const niceCeil = (v) => {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * mag;
};

/* ============================================================
   FLUXO DE CAIXA · Modo Gráfico
   ============================================================ */
function FluxoChart({ parcelas, refMonth }) {
  const [hover, setHover] = useState(null);
  const dados = useMemo(() => {
    const ano = refMonth.getFullYear();
    const mes = refMonth.getMonth();
    const inicioMes = new Date(ano, mes, 1);
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    let saldoInicial = 0;
    parcelas.forEach(p => {
      if (toDate(p.vencimento) < inicioMes) saldoInicial += isEntrada(p.titulo) ? p.valor : -p.valor;
    });

    const entradas = Array(diasNoMes + 1).fill(0);
    const saidas = Array(diasNoMes + 1).fill(0);
    parcelas.forEach(p => {
      const d = toDate(p.vencimento);
      if (d && d.getFullYear() === ano && d.getMonth() === mes) {
        if (isEntrada(p.titulo)) entradas[d.getDate()] += p.valor;
        else saidas[d.getDate()] += p.valor;
      }
    });

    let run = saldoInicial;
    const saldo = [];
    for (let dia = 1; dia <= diasNoMes; dia++) { run += entradas[dia] - saidas[dia]; saldo.push(run); }
    return { ano, mes, diasNoMes, saldoInicial, entradas, saidas, saldo };
  }, [parcelas, refMonth]);

  const { ano, diasNoMes, entradas, saidas, saldo, saldoInicial, mes } = dados;

  const ehMesAtual = refMonth.getFullYear() === HOJE.getFullYear() && refMonth.getMonth() === HOJE.getMonth();
  const mesNoPassado = refMonth < new Date(HOJE.getFullYear(), HOJE.getMonth(), 1);
  const idxHoje = ehMesAtual ? Math.min(HOJE.getDate(), diasNoMes) : (mesNoPassado ? diasNoMes : 0);

  const maxMov = Math.max(0, ...entradas, ...saidas);
  const maxSaldo = Math.max(0, saldoInicial, ...saldo);
  const yMax = niceCeil(Math.max(maxMov, maxSaldo, 10));

  const W = 1200, H = 380, padL = 54, padR = 24, padT = 26, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const band = innerW / diasNoMes;
  const baseline = padT + innerH;
  const yFor = (v) => padT + innerH - (v / yMax) * innerH;
  const xCenter = (dia) => padL + band * (dia - 1) + band / 2;
  const barW = Math.max(2, Math.min(7, band * 0.28));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax));

  const pontos = saldo.map((v, i) => ({ x: xCenter(i + 1), y: yFor(v) }));
  const solidPts = idxHoje > 0 ? pontos.slice(0, idxHoje) : [];
  const dashPts = idxHoje > 0 ? pontos.slice(Math.max(0, idxHoje - 1)) : pontos;
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = solidPts.length ? `${toPath(solidPts)} L ${solidPts[solidPts.length - 1].x.toFixed(1)} ${baseline} L ${solidPts[0].x.toFixed(1)} ${baseline} Z` : '';

  const labelDias = [];
  for (let d = 1; d <= diasNoMes; d += 3) labelDias.push(d);
  if (labelDias[labelDias.length - 1] !== diasNoMes) labelDias.push(diasNoMes);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" className="block min-w-[680px]" onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="fluxoArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#107c42" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#107c42" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yFor(t)} x2={W - padR} y2={yFor(t)} stroke="var(--color-hairline)" strokeWidth="1" />
          <text x={padL - 10} y={yFor(t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--color-ink-muted-48)">{fmtEixo(t)}</text>
        </g>
      ))}

      {areaPath && <path d={areaPath} fill="url(#fluxoArea)" />}
      {solidPts.length > 1 && <path d={toPath(solidPts)} fill="none" stroke="#107c42" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {dashPts.length > 1 && <path d={toPath(dashPts)} fill="none" stroke="#107c42" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" opacity="0.65" />}

      {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
        const cx = xCenter(dia);
        return (
          <g key={dia}>
            {entradas[dia] > 0 && <rect x={cx - barW - 1} y={yFor(entradas[dia])} width={barW} height={Math.max(2, baseline - yFor(entradas[dia]))} rx="2" fill="#107c42" />}
            {saidas[dia] > 0 && <rect x={cx + 1} y={yFor(saidas[dia])} width={barW} height={Math.max(2, baseline - yFor(saidas[dia]))} rx="2" fill="#ef4444" />}
          </g>
        );
      })}

      {ehMesAtual && (
        <g>
          <line x1={xCenter(HOJE.getDate())} y1={padT - 8} x2={xCenter(HOJE.getDate())} y2={baseline} stroke="var(--color-ink-muted-48)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <text x={xCenter(HOJE.getDate())} y={padT - 12} textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="1.5" fill="var(--color-ink-muted-48)">HOJE</text>
        </g>
      )}

      <line x1={padL} y1={baseline} x2={W - padR} y2={baseline} stroke="var(--color-hairline)" strokeWidth="1.5" />

      {labelDias.map(d => (
        <text key={d} x={xCenter(d)} y={baseline + 20} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink-muted-48)">
          {String(d).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}
        </text>
      ))}

      {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => (
        <rect
          key={`hit-${dia}`}
          x={padL + band * (dia - 1)}
          y={padT}
          width={band}
          height={innerH}
          fill="transparent"
          pointerEvents="all"
          onMouseEnter={() => setHover(dia)}
        />
      ))}

      {hover != null && (() => {
        const hx = xCenter(hover);
        const hy = yFor(saldo[hover - 1]);
        const ent = entradas[hover], sai = saidas[hover], sal = saldo[hover - 1];
        const boxW = 176, boxH = 92;
        let bx = hx + 14;
        if (bx + boxW > W - padR) bx = hx - 14 - boxW;
        if (bx < padL) bx = padL;
        const anchorY = Math.max(padT, Math.min(hy, baseline));
        let by = anchorY - boxH - 12;
        if (by < padT + 2) by = anchorY + 16;
        by = Math.min(by, baseline - boxH - 2);
        by = Math.max(by, padT + 2);
        const linha = (y, cor, rotulo, valor) => (
          <g key={rotulo}>
            <circle cx="14" cy={y - 4} r="4" fill={cor} />
            <text x="26" y={y} fontSize="11.5" fontWeight="600" fill="var(--color-ink-muted-80)">{rotulo}</text>
            <text x={boxW - 12} y={y} textAnchor="end" fontSize="12" fontWeight="800" fill="var(--color-ink)">{valor}</text>
          </g>
        );
        return (
          <g>
            <line x1={hx} y1={padT} x2={hx} y2={baseline} stroke="var(--color-ink-muted-48)" strokeWidth="1" opacity="0.35" />
            <circle cx={hx} cy={anchorY} r="4.5" fill="#107c42" stroke="var(--color-canvas)" strokeWidth="2" />
            <g transform={`translate(${bx.toFixed(1)},${by.toFixed(1)})`}>
              <rect width={boxW} height={boxH} rx="11" fill="var(--color-surface-pearl)" stroke="var(--color-hairline)" strokeWidth="1" />
              <text x="14" y="21" fontSize="10.5" fontWeight="800" letterSpacing="0.4" fill="var(--color-ink-muted-48)">
                {String(hover).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}/{ano}
              </text>
              {linha(42, '#107c42', 'Entradas', ent > 0 ? fmtMoney(ent) : '—')}
              {linha(60, '#ef4444', 'Saídas', sai > 0 ? `-${fmtMoney(sai)}` : '—')}
              {linha(80, '#3b82f6', 'Saldo', fmtMoney(sal))}
            </g>
          </g>
        );
      })()}
    </svg>
  );
}

/* ============================================================
   FLUXO DE CAIXA · Modo Mensal
   ============================================================ */
function FluxoMensal({ parcelas }) {
  const fluxo = useMemo(() => {
    if (!parcelas.length) return { meses: [], saldoFinal: 0 };
    const datas = parcelas.map(p => toDate(p.vencimento)?.getTime() || HOJE.getTime());
    const ini = new Date(Math.min(...datas, HOJE.getTime())); ini.setDate(1);
    const fim = new Date(Math.max(...datas, addDays(HOJE, 60).getTime())); fim.setDate(1);
    const meses = [];
    const cursor = new Date(ini);
    let guard = 0;
    while (cursor <= fim && guard < 36) {
      const key = monthKey(cursor);
      const doMes = parcelas.filter(p => monthKey(toDate(p.vencimento)) === key);
      const entradaPrev = doMes.filter(p => isEntrada(p.titulo)).reduce((a, p) => a + p.valor, 0);
      const saidaPrev = doMes.filter(p => !isEntrada(p.titulo)).reduce((a, p) => a + p.valor, 0);
      meses.push({ key, entradaPrev, saidaPrev, liquido: entradaPrev - saidaPrev });
      cursor.setMonth(cursor.getMonth() + 1);
      guard++;
    }
    let acum = 0;
    meses.forEach(m => { acum += m.liquido; m.acumulado = acum; });
    return { meses, saldoFinal: acum };
  }, [parcelas]);

  if (!fluxo.meses.length) {
    return <div className="p-12 text-center text-ink-muted-48">Sem parcelas para projetar o fluxo de caixa.</div>;
  }
  const maxBar = Math.max(...fluxo.meses.map(m => Math.max(m.entradaPrev, m.saidaPrev)), 1);

  return (
    <div className="space-y-4 mt-2">
      {fluxo.meses.map(m => {
        const ehMesAtual = m.key === monthKey(HOJE);
        return (
          <div key={m.key} className="grid grid-cols-[72px_1fr_140px] gap-3 items-center">
            <div className={`text-[12px] font-bold uppercase tracking-wider ${ehMesAtual ? 'text-[#107c42]' : 'text-ink-muted-80'}`}>
              {monthLabel(m.key)}{ehMesAtual ? ' •' : ''}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3.5 rounded-full bg-canvas-parchment overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#107c42] to-emerald-400" style={{ width: `${(m.entradaPrev / maxBar) * 100}%` }} />
                </div>
                <span className="text-[11.5px] font-bold text-[#107c42] min-w-[80px] text-right">{m.entradaPrev ? fmtMoney(m.entradaPrev) : '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3.5 rounded-full bg-canvas-parchment overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(m.saidaPrev / maxBar) * 100}%` }} />
                </div>
                <span className="text-[11.5px] font-bold text-red-500 min-w-[80px] text-right">{m.saidaPrev ? `-${fmtMoney(m.saidaPrev)}` : '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-muted-48">Acumulado</div>
              <div className={`text-[14px] font-bold ${m.acumulado >= 0 ? 'text-ink' : 'text-red-500'}`}>{fmtMoney(m.acumulado)}</div>
            </div>
          </div>
        );
      })}
      <div className="mt-6 pt-4 border-t border-hairline flex justify-end items-center">
        <div className="text-[13px] text-ink-muted-80 font-medium">
          Saldo previsto ao final do horizonte:{' '}
          <strong className={`text-[15px] ${fluxo.saldoFinal >= 0 ? 'text-[#107c42]' : 'text-red-500'}`}>{fmtMoney(fluxo.saldoFinal)}</strong>
        </div>
      </div>
    </div>
  );
}

function FluxoView({ parcelas, mobile }) {
  const [modo, setModo] = useState('grafico');
  const [refMonth, setRefMonth] = useState(() => new Date(HOJE.getFullYear(), HOJE.getMonth(), 1));
  const mesLabel = refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const shift = (n) => setRefMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="bg-surface-pearl border border-hairline rounded-2xl p-4 lg:p-6 shadow-sm">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
        <div>
          <h3 className="text-[13px] font-bold tracking-wider uppercase text-ink">
            {modo === 'grafico' ? 'Movimentação diária × saldo acumulado' : 'Projeção mensal de fluxo de caixa'}
          </h3>
          <p className="text-[11px] font-bold tracking-wide uppercase text-ink-muted-48 mt-1">
            {modo === 'grafico' ? `${mesLabel} · realizado + previsto` : 'Entradas × saídas por mês de vencimento'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {modo === 'grafico' && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => shift(-1)} className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment transition-colors" title="Mês anterior"><ChevronLeft size={16} /></button>
              <span className="text-[12.5px] font-bold text-ink-muted-80 min-w-[110px] text-center capitalize">{mesLabel}</span>
              <button type="button" onClick={() => shift(1)} className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment transition-colors" title="Próximo mês"><ChevronRight size={16} /></button>
            </div>
          )}
          <div className="flex bg-canvas-parchment p-1 rounded-xl border border-hairline text-[12px] font-bold">
            <button type="button" onClick={() => setModo('grafico')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${modo === 'grafico' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}><LineChart size={14} /> Gráfico</button>
            <button type="button" onClick={() => setModo('mensal')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${modo === 'mensal' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}><BarChart3 size={14} /> Mensal</button>
          </div>
        </div>
      </div>

      {modo === 'grafico' && (
        <div className="flex gap-4 justify-end flex-wrap mb-2 text-[11px] font-bold text-ink-muted-48 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#107c42]" /> Entradas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Saídas</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-[#107c42]" /> Saldo</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#107c42]" /> Projeção</span>
        </div>
      )}

      {modo === 'grafico'
        ? <div className="overflow-x-auto pb-1"><FluxoChart parcelas={parcelas} refMonth={refMonth} /></div>
        : <FluxoMensal parcelas={parcelas} />}
    </div>
  );
}

/* ============================================================
   Linha de Parcela
   ============================================================ */
function ParcelaRow({ parcela, titulo, onLiquidar, onEstornar, showTitulo }) {
  const st = statusParcela(parcela);
  const entrada = isEntrada(titulo);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-hairline bg-surface-pearl hover:border-primary/30 transition-all shadow-sm">
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[12px] font-bold" style={{ backgroundColor: `${st.color}15`, color: st.color }}>
        {parcela.numero}/{parcela.totalParcelas}
      </div>
      <div className="flex-1 min-w-0">
        {showTitulo && (
          <div className="text-[13px] font-bold text-ink truncate">{titulo.descricao}</div>
        )}
        <div className="flex items-center gap-2 text-[12px] text-ink-muted-48">
          <CalendarClock size={12} /> Vence {fmtDataFull(parcela.vencimento)}
          {parcela.status === 'recebido' && parcela.liquidadoEm && (
            <span className="text-[#107c42] font-bold">· baixada em {fmtDataFull(parcela.liquidadoEm)}</span>
          )}
        </div>
      </div>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
      <div className="text-right min-w-[100px]">
        <div className={`text-[14px] font-bold ${entrada ? 'text-ink' : 'text-red-500'}`}>{entrada ? '' : '-'}{fmtMoney(parcela.valor)}</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {parcela.status === 'recebido' ? (
          <button type="button" onClick={() => onEstornar(parcela)} title="Estornar baixa" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-hairline text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment text-[12px] font-bold transition-all">
            <Undo2 size={13} /> Estornar
          </button>
        ) : (
          <button type="button" onClick={() => onLiquidar(parcela, titulo)} title={entrada ? 'Registrar recebimento' : 'Registrar pagamento'} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${entrada ? 'bg-[#107c42]/15 text-[#107c42] hover:bg-[#107c42]/25' : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'}`}>
            <CheckCircle2 size={13} /> {entrada ? 'Receber' : 'Pagar'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TÍTULOS VIEW
   ============================================================ */
function TitulosView({ titulos, onLiquidar, onEstornar, onReparcelar, onExcluir }) {
  const [aberto, setAberto] = useState(null);

  if (!titulos.length) {
    return <div className="bg-surface-pearl border border-hairline rounded-2xl p-12 text-center text-ink-muted-48">Nenhum título financeiro cadastrado. Adicione um lançamento manual.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {titulos.map(t => {
        const st = statusTitulo(t);
        const meta = TIPO_META[t.tipo] || TIPO_META.receita;
        const entrada = isEntrada(t);
        const expandido = aberto === t.id;
        const recebido = (t.parcelas || []).filter(p => p.status === 'recebido').reduce((a, p) => a + (p.valorLiquidado ?? p.valor), 0);
        const temBaixa = (t.parcelas || []).some(p => p.status === 'recebido');

        return (
          <div key={t.id} className="bg-surface-pearl border border-hairline rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div onClick={() => setAberto(expandido ? null : t.id)} className="flex items-center gap-3.5 p-4 lg:px-6 cursor-pointer hover:bg-canvas-parchment/50 transition-colors">
              <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-bold text-ink">{t.descricao}</span>
                  {t.projetoNome && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#107c42]/15 text-[#107c42] border border-[#107c42]/20 flex items-center gap-1">
                      <Folder size={11} /> {t.projetoNome}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-ink-muted-48 mt-0.5">
                  {meta.label}{t.categoria ? ` · ${t.categoria}` : ''} · {(t.parcelas || []).length}x
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
              <div className="text-right min-w-[120px]">
                <div className={`text-[17px] font-bold ${entrada ? 'text-ink' : 'text-red-500'}`}>{entrada ? '' : '-'}{fmtMoney(t.valorTotal)}</div>
                {temBaixa && <div className="text-[11px] font-bold text-[#107c42]">{fmtMoney(recebido)} {entrada ? 'recebido' : 'pago'}</div>}
              </div>
              {expandido ? <ChevronDown size={18} className="text-ink-muted-48" /> : <ChevronRight size={18} className="text-ink-muted-48" />}
            </div>

            {expandido && (
              <div className="border-t border-hairline p-4 lg:px-6 bg-canvas-parchment/60">
                <div className="flex flex-col gap-2 mb-3">
                  {(t.parcelas || []).map(p => (
                    <ParcelaRow key={p.id} parcela={p} titulo={t} onLiquidar={onLiquidar} onEstornar={onEstornar} />
                  ))}
                </div>
                <div className="flex gap-2 justify-end flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={() => onReparcelar(t)}
                    disabled={temBaixa}
                    title={temBaixa ? 'Estorne as baixas para reparcelar' : 'Reparcelar'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface-pearl text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Layers size={14} /> Reparcelar
                  </button>
                  <button
                    type="button"
                    onClick={() => onExcluir(t)}
                    title="Excluir lançamento"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[13px] font-semibold transition-all"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   AGENDA DE PARCELAS VIEW
   ============================================================ */
const AGENDA_POR_PAGINA = 12;

function AgendaView({ parcelas, onLiquidar, onEstornar }) {
  const ordenadas = useMemo(() => [...parcelas].sort((a, b) => toDate(a.vencimento) - toDate(b.vencimento)), [parcelas]);
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / AGENDA_POR_PAGINA));

  useEffect(() => { setPagina(p => Math.min(p, totalPaginas)); }, [totalPaginas]);

  if (!ordenadas.length) {
    return <div className="bg-surface-pearl border border-hairline rounded-2xl p-12 text-center text-ink-muted-48">Nenhuma parcela agendada.</div>;
  }

  const inicio = (pagina - 1) * AGENDA_POR_PAGINA;
  const visiveis = ordenadas.slice(inicio, inicio + AGENDA_POR_PAGINA);

  return (
    <>
      <div className="bg-surface-pearl border border-hairline rounded-2xl p-4 lg:p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          {visiveis.map(p => (
            <ParcelaRow key={p.id} parcela={p} titulo={p.titulo} onLiquidar={onLiquidar} onEstornar={onEstornar} showTitulo />
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-hairline text-center text-[12px] font-medium text-ink-muted-48">
          Mostrando {inicio + 1}–{Math.min(inicio + AGENDA_POR_PAGINA, ordenadas.length)} de {ordenadas.length} parcelas
        </div>
      </div>
      <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
    </>
  );
}

/* ============================================================
   GASTOS POR CATEGORIA VIEW (com filtro de Mês, Ano e Todos)
   ============================================================ */
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function GastosCategoriaView({ titulos, mobile }) {
  const [periodo, setPeriodo] = useState('mes'); // 'mes' | 'ano' | 'todos'
  const [mesRef, setMesRef] = useState(HOJE.getMonth());
  const [anoRef, setAnoRef] = useState(HOJE.getFullYear());

  const shiftMonth = (delta) => {
    const d = new Date(anoRef, mesRef + delta, 1);
    setMesRef(d.getMonth());
    setAnoRef(d.getFullYear());
  };

  const shiftYear = (delta) => {
    setAnoRef(a => a + delta);
  };

  const dados = useMemo(() => {
    const despesas = titulos.filter(t => !isEntrada(t));
    const mapa = new Map();
    let totalPeriodo = 0;
    let countPeriodo = 0;

    despesas.forEach(t => {
      const cat = (t.categoria && String(t.categoria).trim()) || 'Sem categoria';
      let valorNoPeriodo = 0;
      let countNoPeriodo = 0;

      if (periodo === 'mes') {
        const parcs = t.parcelas || [];
        if (parcs.length > 0) {
          parcs.forEach(p => {
            const d = toDate(p.vencimento);
            if (d && d.getFullYear() === anoRef && d.getMonth() === mesRef) {
              valorNoPeriodo += p.valor;
              countNoPeriodo += 1;
            }
          });
        } else {
          const d = toDate(t.createdAt);
          if (d && d.getFullYear() === anoRef && d.getMonth() === mesRef) {
            valorNoPeriodo = Number(t.valorTotal) || 0;
            countNoPeriodo = 1;
          }
        }
      } else if (periodo === 'ano') {
        const parcs = t.parcelas || [];
        if (parcs.length > 0) {
          parcs.forEach(p => {
            const d = toDate(p.vencimento);
            if (d && d.getFullYear() === anoRef) {
              valorNoPeriodo += p.valor;
              countNoPeriodo += 1;
            }
          });
        } else {
          const d = toDate(t.createdAt);
          if (d && d.getFullYear() === anoRef) {
            valorNoPeriodo = Number(t.valorTotal) || 0;
            countNoPeriodo = 1;
          }
        }
      } else {
        // todos
        valorNoPeriodo = Number(t.valorTotal) || 0;
        countNoPeriodo = (t.parcelas || []).length || 1;
      }

      if (valorNoPeriodo > 0) {
        const cur = mapa.get(cat) || { categoria: cat, total: 0, count: 0 };
        cur.total += valorNoPeriodo;
        cur.count += countNoPeriodo;
        mapa.set(cat, cur);
        totalPeriodo += valorNoPeriodo;
        countPeriodo += countNoPeriodo;
      }
    });

    const lista = [...mapa.values()].sort((a, b) => b.total - a.total);
    lista.forEach((c, i) => {
      c.pct = totalPeriodo > 0 ? (c.total / totalPeriodo) * 100 : 0;
      c.cor = GASTO_CORES[i % GASTO_CORES.length];
    });

    return { lista, total: totalPeriodo, totalCount: countPeriodo };
  }, [titulos, periodo, mesRef, anoRef]);

  const { lista, total, totalCount } = dados;

  const maiorTotal = lista.length > 0 ? lista[0].total || 1 : 1;
  const top = lista.slice(0, 6);
  const maior = lista.length > 0 ? lista[0] : null;
  const pctLabel = (p) => `${p.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  const periodoLabel = periodo === 'mes'
    ? `${MESES[mesRef]} de ${anoRef}`
    : periodo === 'ano'
    ? `Ano de ${anoRef}`
    : 'Todo o período acumulado';

  return (
    <div className="bg-surface-pearl border border-hairline rounded-2xl overflow-hidden shadow-sm">
      {/* Banner de Topo com Filtros */}
      <div className="p-5 lg:p-7 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white">
        <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl shrink-0 bg-white/15 flex items-center justify-center">
              <PieChart size={22} />
            </div>
            <div>
              <div className="text-[16px] font-bold uppercase tracking-wider">Gastos por categoria</div>
              <div className="text-[11px] font-medium uppercase tracking-wider opacity-90 mt-0.5">{periodoLabel}</div>
            </div>
          </div>
          <div className="text-left lg:text-right">
            <div className="text-[26px] lg:text-[30px] font-bold tracking-tight leading-none">{fmtMoney(total)}</div>
            <div className="text-[11.5px] font-medium opacity-85 mt-1">{totalCount} {totalCount === 1 ? 'item no período' : 'itens no período'}</div>
          </div>
        </div>

        {/* Barra de Seleção de Filtros */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/20 flex-wrap">
          <div className="flex bg-black/25 p-1 rounded-xl backdrop-blur-md border border-white/10 text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === 'mes' ? 'bg-white text-red-700 shadow font-bold' : 'text-white/80 hover:text-white'}`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('ano')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === 'ano' ? 'bg-white text-red-700 shadow font-bold' : 'text-white/80 hover:text-white'}`}
            >
              Ano
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === 'todos' ? 'bg-white text-red-700 shadow font-bold' : 'text-white/80 hover:text-white'}`}
            >
              Todos
            </button>
          </div>

          {periodo === 'mes' && (
            <div className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded-xl border border-white/10 text-[13px] font-bold">
              <button type="button" onClick={() => shiftMonth(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors" title="Mês anterior">
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[125px] text-center capitalize">{MESES[mesRef]} {anoRef}</span>
              <button type="button" onClick={() => shiftMonth(1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors" title="Próximo mês">
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {periodo === 'ano' && (
            <div className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded-xl border border-white/10 text-[13px] font-bold">
              <button type="button" onClick={() => shiftYear(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors" title="Ano anterior">
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[70px] text-center">{anoRef}</span>
              <button type="button" onClick={() => shiftYear(1)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors" title="Próximo ano">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!lista.length ? (
        <div className="p-12 text-center text-ink-muted-48">
          Nenhuma despesa registrada para {periodoLabel.toLowerCase()}.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-0">
          <div className="p-5 lg:p-7 border-b lg:border-b-0 lg:border-r border-hairline">
            <div className="flex flex-col gap-5">
              {top.map((c, i) => (
                <div key={c.categoria} className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[12.5px] font-bold" style={{ backgroundColor: `${c.cor}15`, color: c.cor }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[13.5px] font-semibold text-ink truncate">{c.categoria}</span>
                      <span className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-bold rounded-full px-2 py-0.5" style={{ color: c.cor, backgroundColor: `${c.cor}15` }}>{pctLabel(c.pct)}</span>
                        <span className="text-[14px] font-bold text-ink min-w-[90px] text-right">{fmtMoney(c.total)}</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-canvas-parchment overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, (c.total / maiorTotal) * 100)}%`, backgroundColor: c.cor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 lg:p-7">
            <div className="text-[11px] font-bold tracking-wider uppercase text-ink-muted-48 mb-3">Composição dos gastos</div>

            <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5 mb-4">
              {lista.map(c => (
                <div key={c.categoria} title={`${c.categoria} · ${pctLabel(c.pct)}`} style={{ width: `${c.pct}%`, minWidth: c.pct > 0 ? '3px' : 0, backgroundColor: c.cor }} />
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              {lista.map(c => (
                <div key={c.categoria} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="flex-1 min-w-0 text-[12.5px] text-ink-muted-80 truncate">{c.categoria}</span>
                  <span className="text-[12px] font-bold min-w-[48px] text-right" style={{ color: c.cor }}>{pctLabel(c.pct)}</span>
                  <span className="text-[12px] font-semibold text-ink-muted-48 min-w-[90px] text-right">{fmtMoney(c.total)}</span>
                </div>
              ))}
            </div>

            {maior && (
              <div className="mt-6 p-4 rounded-xl text-center bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                  <TrendingUp size={14} /> Maior gasto
                </div>
                <div className="text-[17px] font-bold text-ink uppercase mt-1">{maior.categoria}</div>
                <div className="text-[13px] font-medium text-ink-muted-80 mt-0.5">
                  {fmtMoney(maior.total)} · {maior.count} {maior.count === 1 ? 'item' : 'itens'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MODAIS
   ============================================================ */
const inputClass = "w-full mt-1.5 px-3 py-2 rounded-xl border border-hairline bg-surface-pearl text-ink text-[13.5px] outline-none focus:border-[#107c42] transition-all shadow-sm";
const lblClass = "text-[12px] font-bold text-ink-muted-80";

const PALETA_CORES_RAPIDA = [
  '#107c42', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
  '#64748b', '#84cc16'
];

function NovaCategoriaQuickModal({ initialNome = '', defaultTipo = 'despesa', onClose, onSaved }) {
  const [nome, setNome] = useState(initialNome);
  const [tipo, setTipo] = useState(defaultTipo);
  const [cor, setCor] = useState(defaultTipo === 'despesa' ? '#ef4444' : '#107c42');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!nome.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }
    setSaving(true);
    const newCat = {
      nome: nome.trim(),
      tipo,
      cor,
      user_id: loggedUser?.id || null,
    };
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .insert([newCat])
      .select();

    setSaving(false);
    if (error) {
      toast.error('Erro ao criar categoria: ' + error.message);
      return;
    }

    const created = data && data[0] ? data[0] : newCat;
    toast.success(`Categoria "${created.nome}" criada com sucesso!`);
    onSaved(created);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="w-full max-w-md bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#107c42]/15 text-[#107c42] flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-ink">Nova Categoria</h3>
              <p className="text-[12px] text-ink-muted-48">Cadastre uma nova categoria rápida</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-ink-muted-48 hover:text-ink hover:bg-canvas-parchment"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-bold text-ink-muted-80 block mb-1">Nome da Categoria *</label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex.: Hospedagem, Licenças..."
              className="w-full px-3 py-2 rounded-xl border border-hairline bg-canvas-parchment text-ink text-[13.5px] outline-none focus:border-[#107c42]"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-ink-muted-80 block mb-1">Tipo de Lançamento *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setTipo('despesa'); setCor('#ef4444'); }}
                className={`py-2 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  tipo === 'despesa' ? 'border-red-500 bg-red-500/15 text-red-500' : 'border-hairline bg-transparent text-ink-muted-80'
                }`}
              >
                <ArrowDownRight size={15} /> Despesa
              </button>
              <button
                type="button"
                onClick={() => { setTipo('receita'); setCor('#107c42'); }}
                className={`py-2 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  tipo === 'receita' ? 'border-[#107c42] bg-[#107c42]/15 text-[#107c42]' : 'border-hairline bg-transparent text-ink-muted-80'
                }`}
              >
                <ArrowUpRight size={15} /> Receita
              </button>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-ink-muted-80 block mb-1.5">Cor da Etiqueta</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETA_CORES_RAPIDA.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {cor === c && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-hairline">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink text-[13px] font-semibold">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#107c42] hover:bg-[#107c42]/90 text-white text-[13px] font-bold flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Salvar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NovoLancamentoModal({ onClose, onSave, projetos = [], categoriasDb = [], onCategoryAdded }) {
  const [form, setForm] = useState({
    tipo: 'despesa',
    descricao: '',
    categoria: '',
    projeto_id: '',
    valorTotal: '',
    numeroParcelas: 1,
    primeiraData: new Date().toISOString().slice(0, 10),
    observacao: ''
  });
  const [saving, setSaving] = useState(false);
  const [modalNovaCatOpen, setModalNovaCatOpen] = useState(false);
  const [initialCatNome, setInitialCatNome] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const despesasDb = useMemo(() => {
    const list = (categoriasDb || []).filter(c => c.tipo === 'despesa').map(c => c.nome);
    return list.length > 0 ? list : CATEGORIAS_DESPESA;
  }, [categoriasDb]);

  const receitasDb = useMemo(() => {
    const list = (categoriasDb || []).filter(c => c.tipo === 'receita').map(c => c.nome);
    return list.length > 0 ? list : CATEGORIAS_RECEITA;
  }, [categoriasDb]);

  const cats = form.tipo === 'despesa' ? despesasDb : receitasDb;
  const valorParcela = (Number(form.valorTotal) || 0) / Math.max(1, Number(form.numeroParcelas) || 1);

  const handleOpenNovaCat = (busca = '') => {
    setInitialCatNome(busca);
    setModalNovaCatOpen(true);
  };

  const handleCatCreated = (newCat) => {
    if (onCategoryAdded) {
      onCategoryAdded(newCat);
    }
    setForm(f => ({ ...f, categoria: newCat.nome }));
    setModalNovaCatOpen(false);
  };

  const submit = async () => {
    if (!form.descricao.trim()) { toast.error('Informe a descrição do lançamento.'); return; }
    if (!(Number(form.valorTotal) > 0)) { toast.error('Informe um valor maior que zero.'); return; }
    setSaving(true);
    const res = await onSave(form);
    setSaving(false);
    if (res?.error) { toast.error('Erro ao salvar: ' + res.error.message); return; }
    toast.success('Lançamento criado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#107c42]/15 text-[#107c42] flex items-center justify-center">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-ink">Novo Lançamento</h3>
              <p className="text-[12.5px] text-ink-muted-48">Conta de consumo, projeto ou receita avulsa</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-ink-muted-48 hover:text-ink hover:bg-canvas-parchment transition-all"><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {['despesa', 'receita'].map(tp => (
              <button
                key={tp}
                type="button"
                onClick={() => set('tipo', tp)}
                className={`flex-1 py-2.5 rounded-xl border text-[13.5px] font-bold flex items-center justify-center gap-2 transition-all ${
                  form.tipo === tp
                    ? tp === 'despesa' ? 'border-red-500 bg-red-500/15 text-red-500' : 'border-[#107c42] bg-[#107c42]/15 text-[#107c42]'
                    : 'border-hairline bg-transparent text-ink-muted-80 hover:text-ink'
                }`}
              >
                {TIPO_META[tp].icon} {TIPO_META[tp].label}
              </button>
            ))}
          </div>

          <div>
            <label className={lblClass}>Descrição *</label>
            <input value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex.: Servidor AWS — mês atual" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={lblClass}>Categoria</label>
                <button
                  type="button"
                  onClick={() => handleOpenNovaCat('')}
                  className="text-[11.5px] font-bold text-[#107c42] hover:underline flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} /> Nova
                </button>
              </div>
              <CustomSelect
                value={form.categoria}
                onChange={v => set('categoria', v)}
                placeholder="Selecione..."
                searchable={true}
                searchPlaceholder="Buscar categoria..."
                onAddNew={handleOpenNovaCat}
                addNewLabel="Nova Categoria"
                options={cats.map(c => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className={lblClass}>Projeto Vinculado (opcional)</label>
              <CustomSelect
                value={form.projeto_id}
                onChange={v => set('projeto_id', v)}
                placeholder="Sem vínculo"
                options={[{ value: '', label: 'Sem vínculo' }, ...projetos.map(p => ({ value: p.id, label: p.nome }))]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={lblClass}>Valor total (R$) *</label>
              <input type="number" min="0" step="0.01" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
            <div>
              <label className={lblClass}>Parcelas</label>
              <input type="number" min="1" max="60" value={form.numeroParcelas} onChange={e => set('numeroParcelas', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={lblClass}>1º vencimento</label>
              <input type="date" value={form.primeiraData} onChange={e => set('primeiraData', e.target.value)} className={inputClass} />
            </div>
          </div>

          {Number(form.numeroParcelas) > 1 && Number(form.valorTotal) > 0 && (
            <div className="text-[12.5px] text-ink-muted-80 p-3 rounded-xl bg-canvas-parchment border border-hairline">
              {form.numeroParcelas}x de aprox. <strong>{fmtMoney(valorParcela)}</strong> — mensais a partir de {fmtDataFull(form.primeiraData)}
            </div>
          )}

          <div>
            <label className={lblClass}>Observação</label>
            <textarea value={form.observacao} onChange={e => set('observacao', e.target.value)} rows={2} placeholder="Detalhes, fornecedor, referência..." className={inputClass} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment text-[13px] font-semibold transition-all">Cancelar</button>
          <button type="button" onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-[#107c42] hover:bg-[#107c42]/90 text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar lançamento
          </button>
        </div>
      </div>

      {modalNovaCatOpen && (
        <NovaCategoriaQuickModal
          initialNome={initialCatNome}
          defaultTipo={form.tipo}
          onClose={() => setModalNovaCatOpen(false)}
          onSaved={handleCatCreated}
        />
      )}
    </div>
  );
}

function LiquidarModal({ parcela, titulo, onClose, onConfirm }) {
  const entrada = isEntrada(titulo);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState(parcela.valor);
  const [forma, setForma] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const res = await onConfirm(parcela, { data, valor, formaPagamento: forma });
    setSaving(false);
    if (res?.error) { toast.error('Erro: ' + res.error.message); return; }
    toast.success(entrada ? 'Recebimento registrado com sucesso.' : 'Pagamento registrado com sucesso.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="w-full max-w-md bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${entrada ? 'bg-[#107c42]/15 text-[#107c42]' : 'bg-red-500/15 text-red-500'}`}>
            <Banknote size={22} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-ink">{entrada ? 'Registrar recebimento' : 'Registrar pagamento'}</h3>
            <p className="text-[12.5px] text-ink-muted-48">{titulo.descricao} · parcela {parcela.numero}/{parcela.totalParcelas}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={lblClass}>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={lblClass}>Valor (R$)</label>
            <input type="number" min="0" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="mb-5">
          <label className={lblClass}>Forma de Pagamento</label>
          <CustomSelect value={forma} onChange={setForma} placeholder="Opcional..." options={['PIX', 'TED', 'Boleto', 'Dinheiro', 'Cartão', 'Outro'].map(f => ({ value: f, label: f }))} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment text-[13px] font-semibold">Cancelar</button>
          <button type="button" onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-[#107c42] hover:bg-[#107c42]/90 text-white text-[13px] font-bold flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

const gerarLinhasParcela = (valorTotal, n, primeira) => {
  const qtd = Math.max(1, Number(n) || 1);
  const total = Number(valorTotal) || 0;
  const base = Math.floor((total / qtd) * 100) / 100;
  const resto = Math.round((total - base * qtd) * 100) / 100;
  const inicio = primeira ? new Date(`${String(primeira).slice(0, 10)}T12:00:00`) : new Date();
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(inicio);
    d.setMonth(d.getMonth() + i);
    return { vencimento: d.toISOString().slice(0, 10), valor: i === 0 ? Math.round((base + resto) * 100) / 100 : base };
  });
};

function ReparcelarModal({ titulo, onClose, onConfirm }) {
  const [modo, setModo] = useState('auto'); // 'auto' | 'custom'
  const [numeroParcelas, setNumero] = useState((titulo.parcelas || []).length || 1);
  const [primeiraData, setData] = useState(titulo.parcelas?.[0]?.vencimento?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [linhas, setLinhas] = useState(() =>
    (titulo.parcelas || []).length
      ? titulo.parcelas.map(p => ({ vencimento: p.vencimento?.slice(0, 10), valor: p.valor }))
      : gerarLinhasParcela(titulo.valorTotal, 1, new Date().toISOString().slice(0, 10))
  );
  const [saving, setSaving] = useState(false);

  const valorParcelaAuto = (titulo.valorTotal || 0) / Math.max(1, Number(numeroParcelas) || 1);
  const soma = Math.round(linhas.reduce((a, l) => a + (Number(l.valor) || 0), 0) * 100) / 100;
  const diff = Math.round(((titulo.valorTotal || 0) - soma) * 100) / 100;

  const irParaCustom = () => { setLinhas(gerarLinhasParcela(titulo.valorTotal, numeroParcelas, primeiraData)); setModo('custom'); };
  const setLinha = (i, campo, v) => setLinhas(ls => ls.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  const addLinha = () => setLinhas(ls => {
    const ult = ls[ls.length - 1];
    const base = ult?.vencimento ? new Date(`${ult.vencimento}T12:00:00`) : new Date();
    base.setMonth(base.getMonth() + 1);
    return [...ls, { vencimento: base.toISOString().slice(0, 10), valor: diff > 0 ? diff : 0 }];
  });
  const removeLinha = (i) => setLinhas(ls => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));
  const distribuir = () => setLinhas(ls => gerarLinhasParcela(titulo.valorTotal, ls.length, ls[0]?.vencimento || primeiraData));
  const ajustarUltima = () => setLinhas(ls => ls.map((l, idx) => (idx === ls.length - 1 ? { ...l, valor: Math.round(((Number(l.valor) || 0) + diff) * 100) / 100 } : l)));

  const submit = async () => {
    if (modo === 'custom') {
      if (linhas.some(l => !l.vencimento)) { toast.error('Defina a data de todas as parcelas.'); return; }
      if (Math.abs(diff) > 0.01) { toast.error(`A soma das parcelas (${fmtMoney(soma)}) difere do total do título (${fmtMoney(titulo.valorTotal)}).`); return; }
    }
    setSaving(true);
    const payload = modo === 'custom' ? { parcelas: linhas } : { numeroParcelas, primeiraData };
    const res = await onConfirm(titulo, payload);
    setSaving(false);
    if (res?.error) { toast.error('Erro ao reparcelar: ' + res.error.message); return; }
    toast.success('Título reparcelado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-ink">Reparcelar título</h3>
            <p className="text-[12.5px] text-ink-muted-48">{titulo.descricao} · {fmtMoney(titulo.valorTotal)}</p>
          </div>
        </div>

        {/* Alternância de Modo (Auto vs Custom) */}
        <div className="flex bg-canvas-parchment p-1 rounded-xl border border-hairline text-[13px] font-bold mb-4">
          <button
            type="button"
            onClick={() => setModo('auto')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${modo === 'auto' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}
          >
            <Layers size={14} /> Automático
          </button>
          <button
            type="button"
            onClick={() => modo === 'auto' ? irParaCustom() : setModo('custom')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${modo === 'custom' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}
          >
            <ListChecks size={14} /> Personalizado
          </button>
        </div>

        {modo === 'auto' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={lblClass}>Nº de parcelas</label>
                <input type="number" min="1" max="120" value={numeroParcelas} onChange={e => setNumero(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={lblClass}>1º vencimento</label>
                <input type="date" value={primeiraData} onChange={e => setData(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="text-[12.5px] text-ink-muted-80 p-3 rounded-xl bg-canvas-parchment border border-hairline mb-3">
              {numeroParcelas}x de aprox. <strong>{fmtMoney(valorParcelaAuto)}</strong> — mensais a partir de {fmtDataFull(primeiraData)}
            </div>
            <button type="button" onClick={irParaCustom} className="text-[12.5px] font-bold text-[#107c42] hover:underline mb-2">
              Ajustar cada parcela (data e valor) →
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[24px_1fr_120px_32px] gap-2 px-1 mb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-muted-48">
              <span>#</span><span>Vencimento</span><span className="text-right">Valor (R$)</span><span />
            </div>
            <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
              {linhas.map((l, i) => (
                <div key={i} className="grid grid-cols-[24px_1fr_120px_32px] gap-2 items-center">
                  <span className="text-[12px] font-bold text-ink-muted-48">{i + 1}</span>
                  <input type="date" value={l.vencimento || ''} onChange={e => setLinha(i, 'vencimento', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-hairline bg-canvas-parchment text-ink text-[13px] outline-none" />
                  <input type="number" min="0" step="0.01" value={l.valor} onChange={e => setLinha(i, 'valor', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-hairline bg-canvas-parchment text-ink text-[13px] text-right outline-none" />
                  <button type="button" onClick={() => removeLinha(i)} disabled={linhas.length <= 1} className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-red-500 disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLinha} className="w-full mt-3 py-2 rounded-xl border border-dashed border-hairline text-ink-muted-80 hover:text-ink text-[13px] font-bold flex items-center justify-center gap-1.5">
              <Plus size={15} /> Adicionar parcela
            </button>

            <div className={`mt-3 p-3 rounded-xl border ${Math.abs(diff) > 0.01 ? 'border-red-500/30 bg-red-500/10' : 'border-hairline bg-canvas-parchment'}`}>
              <div className="flex justify-between text-[12.5px] text-ink-muted-80">
                <span>Total do título</span><strong className="text-ink">{fmtMoney(titulo.valorTotal)}</strong>
              </div>
              <div className="flex justify-between text-[12.5px] text-ink-muted-80 mt-1">
                <span>Soma das {linhas.length} parcela(s)</span><strong className="text-ink">{fmtMoney(soma)}</strong>
              </div>
              {Math.abs(diff) > 0.01 && (
                <div className="flex justify-between items-center text-[12.5px] mt-2 pt-2 border-t border-hairline">
                  <span className="text-red-500 font-bold">Diferença: {diff > 0 ? '+' : ''}{fmtMoney(diff)}</span>
                  <button type="button" onClick={ajustarUltima} className="text-[12px] font-bold text-[#107c42] hover:underline">Jogar na última parcela</button>
                </div>
              )}
            </div>
            <button type="button" onClick={distribuir} className="text-[12.5px] font-bold text-[#107c42] hover:underline mt-2">
              Distribuir igualmente (mensal)
            </button>
          </>
        )}

        <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-hairline">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink text-[13px] font-semibold">Cancelar</button>
          <button type="button" onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-[#107c42] hover:bg-[#107c42]/90 text-white text-[13px] font-bold flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />} Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteTituloModal({ titulo, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="w-full max-w-md bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center"><Trash2 size={22} /></div>
          <div>
            <h3 className="text-[17px] font-bold text-ink">Excluir lançamento</h3>
            <p className="text-[12.5px] text-ink-muted-48">{titulo.descricao}</p>
          </div>
        </div>
        <p className="text-[13.5px] text-ink-muted-80 leading-relaxed mb-6">
          O título e todas as suas <strong>{(titulo.parcelas || []).length} parcela(s)</strong> serão removidos permanentemente.
        </p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment text-[13px] font-semibold">Cancelar</button>
          <button type="button" onClick={async () => { setDeleting(true); await onConfirm(titulo); setDeleting(false); }} disabled={deleting} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold flex items-center gap-2">
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupPanel() {
  return (
    <div className="bg-surface-pearl border border-hairline rounded-2xl p-8 lg:p-12 max-w-3xl mx-auto text-center shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-5"><Database size={32} /></div>
      <h2 className="text-[22px] font-bold text-ink mb-2">Módulo financeiro ainda não instalado</h2>
      <p className="text-[14.5px] text-ink-muted-80 leading-relaxed mb-4">
        As tabelas <code className="bg-canvas-parchment px-1.5 py-0.5 rounded font-mono text-ink text-[13px]">titulos_financeiros</code> e <code className="bg-canvas-parchment px-1.5 py-0.5 rounded font-mono text-ink text-[13px]">parcelas_financeiras</code> ainda não existem no seu banco Supabase.
      </p>
      <p className="text-[13.5px] text-ink-muted-80 leading-relaxed bg-canvas-parchment p-4 rounded-xl border border-hairline font-mono text-left mb-6">
        Script criado em: <strong>supabase/manual-sql/financeiro.sql</strong><br />
        Copie e rode o script no SQL Editor do seu projeto Supabase e atualize esta página.
      </p>
    </div>
  );
}

/* ============================================================
   PÁGINA PRINCIPAL: FINANCEIRO
   ============================================================ */
const VIEWS = [
  { key: 'fluxo', label: 'Fluxo de caixa', curto: 'Fluxo', icon: <LineChart size={15} /> },
  { key: 'titulos', label: 'Títulos', curto: 'Títulos', icon: <ListChecks size={15} /> },
  { key: 'agenda', label: 'Agenda de parcelas', curto: 'Parcelas', icon: <CalendarClock size={15} /> },
  { key: 'gastos', label: 'Gastos por categoria', curto: 'Gastos', icon: <PieChart size={15} /> },
];

export default function Financeiro() {
  const { titulos, loading, setupNeeded, criarLancamento, reparcelar, liquidarParcela, estornarParcela, excluirTitulo } = useFinanceiro();

  const [projetos, setProjetos] = useState([]);
  const [categoriasDb, setCategoriasDb] = useState([]);
  const isMobile = useIsMobile();
  const [view, setView] = useState('fluxo');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [criando, setCriando] = useState(false);
  const [reparcelando, setReparcelando] = useState(null);
  const [liquidando, setLiquidando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const loadCategorias = async () => {
    const { data: cData } = await supabase.from('categorias_financeiras').select('id, nome, tipo, cor').order('nome');
    if (cData) setCategoriasDb(cData);
  };

  useEffect(() => {
    async function loadAuxData() {
      const { data: pData } = await supabase.from('projetos').select('id, nome').order('nome');
      if (pData) setProjetos(pData);

      await loadCategorias();
    }
    loadAuxData();
  }, []);

  const handleCategoryAdded = (newCat) => {
    setCategoriasDb(prev => {
      const exists = prev.some(c => c.nome.toLowerCase() === newCat.nome.toLowerCase() && c.tipo === newCat.tipo);
      return exists ? prev : [...prev, newCat];
    });
    loadCategorias();
  };

  const titulosFiltrados = useMemo(() => {
    let list = titulos;
    if (tipoFiltro === 'Entradas') list = list.filter(isEntrada);
    else if (tipoFiltro === 'Saídas') list = list.filter(t => !isEntrada(t));
    if (statusFiltro !== 'Todos') list = list.filter(t => statusTitulo(t).key === statusFiltro);
    return list;
  }, [titulos, tipoFiltro, statusFiltro]);

  const parcelas = useMemo(
    () => titulosFiltrados.flatMap(t => (t.parcelas || []).map(p => ({ ...p, titulo: t }))),
    [titulosFiltrados]
  );

  const kpis = useMemo(() => {
    const todas = titulos.flatMap(t => (t.parcelas || []).map(p => ({ ...p, titulo: t })));
    const ent = todas.filter(p => isEntrada(p.titulo));
    const sai = todas.filter(p => !isEntrada(p.titulo));
    const pend = (arr) => arr.filter(p => p.status === 'pendente');
    const aReceber = pend(ent).reduce((a, p) => a + p.valor, 0);
    const aPagar = pend(sai).reduce((a, p) => a + p.valor, 0);
    const recebido = ent.filter(p => p.status === 'recebido').reduce((a, p) => a + (p.valorLiquidado ?? p.valor), 0);
    const vencido = pend(ent).filter(parcelaVencida).reduce((a, p) => a + p.valor, 0);
    const limite30 = addDays(HOJE, 30);
    const proximos30 = pend(ent).filter(p => { const d = toDate(p.vencimento); return d && d >= HOJE && d <= limite30; }).reduce((a, p) => a + p.valor, 0);
    return { aReceber, aPagar, recebido, vencido, proximos30, saldoPrevisto: aReceber - aPagar };
  }, [titulos]);

  const handleLiquidar = async (parcela, { data, valor, formaPagamento }) => {
    return liquidarParcela(parcela, { data, valor, formaPagamento });
  };
  const handleEstornar = async (parcela) => {
    const res = await estornarParcela(parcela);
    if (res?.error) toast.error('Erro ao estornar.');
    else toast.success('Baixa estornada com sucesso.');
  };
  const handleExcluir = async (titulo) => {
    const res = await excluirTitulo(titulo.id);
    setExcluindo(null);
    if (res?.error) toast.error('Erro ao excluir: ' + res.error.message);
    else toast.success('Lançamento excluído com sucesso.');
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-canvas-parchment text-ink font-sans overflow-hidden">
        
        {/* Sticky Header */}
        <header className="h-14 lg:h-20 bg-canvas/80 backdrop-blur-xl border-b border-hairline flex items-center justify-between px-4 lg:px-8 shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-2 font-body text-ink-muted-48">
            <span className="text-ink font-body-strong flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#107c42]">payments</span>
              Gestão Financeira
            </span>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 text-ink">
            <TopBarIcons />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 fade-in bg-canvas-parchment">
          <div className="max-w-[1600px] mx-auto">

            {/* Page Title & Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="font-display-lg text-[28px] lg:text-[40px] text-ink tracking-tight font-light mb-2">
                  Financeiro
                </h1>
                <p className="text-ink-muted-80 text-[13.5px] lg:text-[15px]">
                  Contas a pagar, receitas de projetos, despesas e fluxo de caixa num só painel.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                <CotacoesHoje mobile={isMobile} />
                {!setupNeeded && (
                  <button
                    type="button"
                    onClick={() => setCriando(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#107c42] hover:bg-[#107c42]/90 text-white rounded-xl text-[14px] font-bold transition-all shadow-md hover:scale-[0.99] active:scale-95"
                  >
                    <Plus size={18} /> Novo Lançamento
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-ink-muted-48 gap-3">
                <Loader2 size={32} className="animate-spin text-[#107c42]" />
                <span className="text-[14px] font-medium">Carregando financeiro...</span>
              </div>
            ) : setupNeeded ? (
              <SetupPanel />
            ) : (
              <>
                {/* KPIs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6">
                  <Kpi icon={<Coins size={20} />} tint="#107c42" value={fmtMoney(kpis.aReceber)} label="A receber" sub="Receitas pendentes" accent="linear-gradient(90deg,#107c42,transparent)" />
                  <Kpi icon={<CheckCircle2 size={20} />} tint="#107c42" value={fmtMoney(kpis.recebido)} label="Recebido" sub="Já baixado no caixa" accent="linear-gradient(90deg,#107c42,transparent)" />
                  <Kpi icon={<Clock size={20} />} tint="#0891b2" value={fmtMoney(kpis.proximos30)} label="Próximos 30 dias" sub="Entradas a vencer" />
                  <Kpi icon={<AlertTriangle size={20} />} tint="#ef4444" value={fmtMoney(kpis.vencido)} label="Vencido" sub="Em atraso" />
                  <Kpi icon={<ArrowDownRight size={20} />} tint="#f59e0b" value={fmtMoney(kpis.aPagar)} label="A pagar" sub="Despesas pendentes" />
                  <Kpi icon={<Wallet size={20} />} tint="#3b82f6" value={fmtMoney(kpis.saldoPrevisto)} label="Saldo previsto" sub="A receber − a pagar" />
                </div>

                {/* View Switcher & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
                  <div className="flex bg-surface-pearl p-1 rounded-xl border border-hairline text-[13px] font-bold shadow-sm">
                    {VIEWS.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setView(v.key)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          view === v.key ? 'bg-[#107c42] text-white shadow-md' : 'text-ink-muted-80 hover:text-ink'
                        }`}
                      >
                        {v.icon} {isMobile ? v.curto : v.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center">
                    {view !== 'gastos' && (
                      <div className="w-40">
                        <CustomSelect
                          value={tipoFiltro}
                          onChange={setTipoFiltro}
                          options={['Todos', 'Entradas', 'Saídas'].map(t => ({ value: t, label: t === 'Todos' ? 'Todos os tipos' : t }))}
                        />
                      </div>
                    )}
                    {view === 'titulos' && (
                      <div className="w-44">
                        <CustomSelect
                          value={statusFiltro}
                          onChange={setStatusFiltro}
                          options={[
                            { value: 'Todos', label: 'Todos os status' },
                            { value: 'aberto', label: 'Em aberto' },
                            { value: 'parcial', label: 'Parcial' },
                            { value: 'atrasado', label: 'Atrasado' },
                            { value: 'liquidado', label: 'Liquidado' },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Active View */}
                {view === 'fluxo' && <FluxoView parcelas={parcelas} mobile={isMobile} />}
                {view === 'titulos' && (
                  <TitulosView
                    titulos={titulosFiltrados}
                    onLiquidar={(parcela, titulo) => setLiquidando({ parcela, titulo })}
                    onEstornar={handleEstornar}
                    onReparcelar={setReparcelando}
                    onExcluir={setExcluindo}
                  />
                )}
                {view === 'agenda' && (
                  <AgendaView
                    parcelas={parcelas}
                    onLiquidar={(parcela, titulo) => setLiquidando({ parcela, titulo })}
                    onEstornar={handleEstornar}
                  />
                )}
                {view === 'gastos' && <GastosCategoriaView titulos={titulos} mobile={isMobile} />}
              </>
            )}

          </div>
        </div>

        {/* Modals */}
        {criando && <NovoLancamentoModal onClose={() => setCriando(false)} onSave={criarLancamento} projetos={projetos} categoriasDb={categoriasDb} onCategoryAdded={handleCategoryAdded} />}
        {reparcelando && <ReparcelarModal titulo={reparcelando} onClose={() => setReparcelando(null)} onConfirm={reparcelar} />}
        {liquidando && <LiquidarModal parcela={liquidando.parcela} titulo={liquidando.titulo} onClose={() => setLiquidando(null)} onConfirm={handleLiquidar} />}
        {excluindo && <DeleteTituloModal titulo={excluindo} onClose={() => setExcluindo(null)} onConfirm={handleExcluir} />}

      </div>
    </Layout>
  );
}
