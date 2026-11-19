import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Categories.module.css';

export default class Categories extends DCLogic {
  def = ['Anarkali', 'Lehenga', 'Saree', 'Kurti', 'Gown', 'Salwar', 'Accessories', 'Kids'].map(name => ({ name, active: true }));
  load() { try { const c = JSON.parse(db.getItem('sc_categories')); return c && c.length ? c.map(x => ({ name: x.name, active: x.active !== false })) : this.def; } catch (e) { return this.def; } }
  state: any = { cats: this.load(), draft: '', err: '' };
  commit(cats, extra) { try { db.setItem('sc_categories', JSON.stringify(cats)); } catch (e) {} this.setState({ cats, ...extra }); }
  renderVals() {
    const s = this.state, name = s.draft.trim();
    const exists = n => s.cats.some(c => c.name.toLowerCase() === n.toLowerCase());
    const add = () => { if (!name) return; if (exists(name)) return this.setState({ err: '“' + name + '” already exists.' }); this.commit([...s.cats, { name, active: true }], { draft: '', err: '' }); };
    const upd = (i, patch) => this.commit(s.cats.map((c, j) => j === i ? { ...c, ...patch } : c), { err: '' });
    const move = (i, d) => { const c = [...s.cats]; [c[i], c[i + d]] = [c[i + d], c[i]]; this.commit(c); };
    return {
      draft: s.draft, onDraft: e => this.setState({ draft: e.target.value, err: '' }), onKey: e => e.key === 'Enter' && add(),
      add, addInvalid: !name, hasErr: !!s.err, err: s.err,
      rows: s.cats.map((c, i) => ({ name: c.name, active: c.active, op: c.active ? 1 : 0.55,
        rename: e => upd(i, { name: e.target.value }), toggle: e => upd(i, { active: e.target.checked }),
        up: () => move(i, -1), down: () => move(i, 1), first: i === 0, last: i === s.cats.length - 1,
        del: () => this.commit(s.cats.filter((_, j) => j !== i)) })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header>
            <div className={styles.box2}>Masters</div>
            <h1 className={styles.title1}>Categories</h1>
            <div className={styles.box3}>These names appear in the product form, filters and reports.</div>
          </header>
          <section className={styles.section1}>
            <div className={styles.box4}>
              <input className={`input ${styles.field1}`} value={$v.draft} onChange={$v.onDraft} onKeyDown={$v.onKey} placeholder="New category name" />
              <button className="btn btn-primary" onClick={$v.add} disabled={$v.addInvalid}>
                <i className="ph ph-plus" />
                Add
              </button>
            </div>
            {$v.hasErr ? (
              <>
                <div className={styles.box5}>{$v.err}</div>
              </>
            ) : null}
            {($v.rows || []).map((r: any, $index: number) => (
              <React.Fragment key={$index}>
                <div className={styles.box6} style={{ opacity: r?.op }}>
                  <input className={styles.field2} value={r?.name} onChange={r?.rename} />
                  <label className={styles.label1} title="Active">
                    <input type="checkbox" checked={r?.active} onChange={r?.toggle} />
                    Active
                  </label>
                  <button className="btn btn-ghost btn-icon" onClick={r?.up} disabled={r?.first} title="Move up"><i className="ph ph-caret-up" /></button>
                  <button className="btn btn-ghost btn-icon" onClick={r?.down} disabled={r?.last} title="Move down"><i className="ph ph-caret-down" /></button>
                </div>
              </React.Fragment>
            ))}
          </section>
        </main>
      </div>
      </>
    );
  }
}
