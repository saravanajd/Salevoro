import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Reports.module.css';

export default class Reports extends DCLogic {
  state: any = { rep: 'sales', range: 'month', branch: 'All branches' };
  renderVals() {
    const s = this.state, inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const F = { today: 1 / 26, week: 0.24, month: 1, fy: 7.4 }[s.range] * (s.branch === 'All branches' ? 1 : s.branch === 'T. Nagar' ? 0.4 : 0.3);
    const R = {
      sales: { label: 'Sales summary', sub: 'Bills, value, discounts', icon: 'ph ph-chart-line-up',
        cols: ['Date', 'Bills', 'Gross', 'Discount', 'Returns', 'Net sales', 'Avg bill'],
        data: [['18 Nov', 96, 412000, 18600, 8240], ['17 Nov', 88, 371500, 14200, 6890], ['16 Nov', 102, 455800, 21300, 0], ['15 Nov', 79, 318400, 9800, 2150], ['14 Nov', 71, 286900, 8400, 0], ['13 Nov', 84, 342100, 12600, 3450]].map(([d, b, g, di, r]) => { const k = F / ({ today: 1 / 26, week: 0.24, month: 1, fy: 7.4 }[s.range]); return [d, Math.round(b * k), inr(g * k), inr(di * k), inr(r * k), inr((g - di - r) * k), inr((g - di - r) / b)]; }) },
      gst: { label: 'GST summary (GSTR-1)', sub: 'Rate & HSN-wise output tax', icon: 'ph ph-percent',
        cols: ['HSN', 'Description', 'Rate', 'Taxable value', 'CGST', 'SGST', 'IGST'],
        data: [['6204', "Women's suits, gowns, lehengas", 18, 1820000, 0.9], ['6204', "Women's suits ≤ ₹2,500", 5, 412000, 0.95], ['5007', 'Silk sarees', 18, 940000, 0.97], ['6206', 'Kurtis / blouses', 5, 286000, 1], ['6214', 'Dupattas & stoles', 5, 118000, 0.92], ['6209', "Children's garments", 5, 96000, 1]].map(([h, d, r, t, intra]) => { const tx = t * F * r / 100; return [h, d, r + '%', inr(t * F), inr(tx * intra / 2), inr(tx * intra / 2), inr(tx * (1 - intra))]; }) },
      cat: { label: 'Category-wise sales', sub: 'Pieces and value by category', icon: 'ph ph-dress',
        cols: ['Category', 'Pieces', 'Net sales', 'Gross margin', 'Share'], bars: true,
        data: [['Lehenga', 46, 1980000, 41], ['Saree', 88, 1420000, 38], ['Anarkali', 132, 860000, 46], ['Gown', 41, 470000, 44], ['Salwar', 118, 380000, 48], ['Kurti', 296, 352000, 52], ['Accessories', 164, 318000, 55], ['Kids', 71, 166000, 49]] },
      pay: { label: 'Payment modes', sub: 'Cash, card, UPI, split', icon: 'ph ph-wallet',
        cols: ['Mode', 'Transactions', 'Amount', 'Share'], bars: true,
        data: [['UPI', 1120, 2640000], ['Card', 610, 2120000], ['Cash', 740, 1060000], ['Split (UPI + Cash)', 94, 126000]] },
      top: { label: 'Top selling items', sub: 'Best SKUs by value', icon: 'ph ph-trophy',
        cols: ['#', 'SKU', 'Item', 'Pieces', 'Net sales'],
        data: [['SC-LHG-021-M', 'Mehr Bridal Lehenga · M', 14, 679000], ['SC-SAR-310-FS', 'Kanjivaram Silk Saree', 31, 564200], ['SC-GWN-077-S', 'Celeste Evening Gown · S', 18, 223200], ['SC-ANK-104-M', 'Noor Anarkali Suit · M', 29, 199810], ['SC-SAL-218-L', 'Phulkari Salwar Set · L', 37, 127650], ['SC-KUR-552-M', 'Ira Cotton Kurti · M', 88, 113520]].map((r, i) => [i + 1, r[0], r[1], Math.round(r[2] * F), inr(r[3] * F)]) },
      stock: { label: 'Stock valuation', sub: 'On-hand at cost & MRP', icon: 'ph ph-package',
        cols: ['Branch', 'SKUs', 'Pieces', 'Value at cost', 'Value at MRP', 'Ageing > 90 days'],
        data: [['T. Nagar', 34, 214, 1886000, 3624000, '12%'], ['Anna Nagar', 34, 168, 1342000, 2581000, '9%'], ['Koramangala', 31, 181, 1508000, 2900000, '15%']].map(r => [r[0], r[1], r[2], inr(r[3]), inr(r[4]), r[5]]) },
      staff: { label: 'Salesperson performance', sub: 'Bills and value per staff', icon: 'ph ph-identification-badge',
        cols: ['Salesperson', 'Branch', 'Bills', 'Net sales', 'Avg bill', 'Returns %'],
        data: [['Meena K', 'T. Nagar', 412, 1840000, '1.8%'], ['Arjun S', 'T. Nagar', 356, 1260000, '2.4%'], ['Divya P', 'Anna Nagar', 388, 1490000, '1.2%'], ['Karthik V', 'Koramangala', 401, 1610000, '2.9%']].map(r => [r[0], r[1], Math.round(r[2] * F), inr(r[3] * F), inr(r[3] / r[2]), r[4]]) },
    };
    const cur = R[s.rep];
    let data = cur.data, bars = [];
    if (s.rep === 'cat') { const t = data.reduce((a, r) => a + r[2], 0); bars = data.map(r => ({ label: r[0], pct: Math.round(r[2] / t * 100) })); data = data.map(r => [r[0], Math.round(r[1] * F), inr(r[2] * F), r[3] + '%', Math.round(r[2] / t * 100) + '%']); }
    if (s.rep === 'pay') { const t = data.reduce((a, r) => a + r[2], 0); bars = data.map(r => ({ label: r[0], pct: Math.round(r[2] / t * 100) })); data = data.map(r => [r[0], Math.round(r[1] * F), inr(r[2] * F), Math.round(r[2] / t * 100) + '%']); }
    const isNum = v => typeof v === 'number' || /^[₹\d]/.test(String(v));
    const num = v => +String(v).replace(/[^\d.]/g, '') || 0;
    const kpis = s.rep === 'gst' ? [['Taxable value', inr(data.reduce((a, r) => a + num(r[3]), 0))], ['Output tax', inr(data.reduce((a, r) => a + num(r[4]) + num(r[5]) + num(r[6]), 0))], ['Invoices', Math.round(2560 * F)]]
      : s.rep === 'stock' ? [['Pieces on hand', 563], ['Value at cost', '₹47,36,000'], ['Value at MRP', '₹91,05,000']]
      : [['Net sales', inr(5946000 * F)], ['Bills', Math.round(2564 * F)], ['Avg bill', '₹2,319'], ['Returns', inr(96000 * F)]];
    const rl = { today: 'Today', week: 'This week', month: 'November 2026', fy: 'FY 2026-27 to date' }[s.range];
    return {
      branch: s.branch, onBranch: e => this.setState({ branch: e.target.value }),
      ranges: [['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['fy', 'FY']].map(([k, label]) => ({ label, pick: () => this.setState({ range: k }), color: s.range === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.range === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      reports: Object.entries(R).map(([k, r]) => { const on = k === s.rep; return { label: r.label, sub: r.sub, icon: r.icon, pick: () => this.setState({ rep: k }), color: on ? 'var(--color-accent-300)' : 'var(--color-text)', bg: on ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent', ring: on ? 'inset 2px 0 0 var(--color-accent)' : 'none' }; }),
      cur, rangeLabel: rl,
      kpis: kpis.map(([k, v]) => ({ k, v })),
      cols: cur.cols.map((label, i) => ({ label, align: i > 0 && isNum(data[0][i]) ? 'right' : 'left' })),
      rows: data.map(r => ({ cells: r.map((v, i) => ({ v, align: i > 0 && isNum(v) ? 'right' : 'left', color: i === 0 ? 'var(--color-text)' : 'var(--color-neutral-300)' })) })),
      hasBars: bars.length > 0, bars,
      print: () => window.print(),
      exportCsv: () => {
        const csv = [cur.cols, ...data].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = cur.label.replace(/\W+/g, '-') + '.csv'; a.click();
      },
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Insights</div>
              <h1 className={styles.title1}>Reports</h1>
            </div>
            <div className={styles.box3}>
              <select className={`input ${styles.select1}`} value={$v.branch} onChange={$v.onBranch}>
                <option>All branches</option>
                <option>T. Nagar</option>
                <option>Anna Nagar</option>
                <option>Koramangala</option>
              </select>
              <div className="seg">
                {($v.ranges || []).map((r: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <button className={`seg-opt ${styles.button1}`} onClick={r?.pick} style={{ color: r?.color, boxShadow: r?.ring }}>{r?.label}</button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </header>
          <div className={styles.box4}>
            <nav className={styles.nav1}>
              {($v.reports || []).map((r: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={styles.button2} onClick={r?.pick} style={{ color: r?.color, "--dyn-background": r?.bg, boxShadow: r?.ring }}>
                    <i className={`${r?.icon ?? ''} ${styles.icon1}`} />
                    <div>
                      <div className={styles.box5}>{r?.label}</div>
                      <div className={styles.box6}>{r?.sub}</div>
                    </div>
                  </button>
                </React.Fragment>
              ))}
            </nav>
            <section className={styles.section1}>
              <div className={styles.box7}>
                <div>
                  <div className={styles.box8}>{$v.cur?.label}</div>
                  <div className={styles.box9}>{$v.rangeLabel} · {$v.branch}</div>
                </div>
                <div className={styles.box10}>
                  <button className="btn btn-secondary" onClick={$v.exportCsv}>
                    <i className="ph ph-download-simple" />
                    Export CSV
                  </button>
                  <button className="btn btn-secondary" onClick={$v.print}>
                    <i className="ph ph-printer" />
                    Print
                  </button>
                </div>
              </div>
              <div className={styles.box11}>
                {($v.kpis || []).map((k: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={`card ${styles.box12}`}>
                      <div className={styles.box13}>{k?.k}</div>
                      <div className={styles.box14}>{k?.v}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.box15}>
                <table className={`table ${styles.table1}`}>
                  <thead>
                    <tr>
                      {($v.cols || []).map((c: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <th style={{ textAlign: c?.align }}>{c?.label}</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {($v.rows || []).map((r: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          {(r?.cells || []).map((c: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <td style={{ textAlign: c?.align, color: c?.color }}>{c?.v}</td>
                            </React.Fragment>
                          ))}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {$v.hasBars ? (
                <>
                  <div className={`card ${styles.box16}`}>
                    <div className="card-kicker">Share</div>
                    {($v.bars || []).map((b: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box17}>
                          <span className={styles.text1}>{b?.label}</span>
                          <div className={styles.box18}>
                            <div className={styles.box19} style={{ width: `${b?.pct ?? ''}%` }} />
                          </div>
                          <span className={styles.text2}>{b?.pct}%</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </main>
      </div>
      </>
    );
  }
}
