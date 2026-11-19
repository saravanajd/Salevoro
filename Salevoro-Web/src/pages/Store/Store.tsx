import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Store.module.css';

export default class Store extends DCLogic {
  def = { name: 'Saanvi Couture', legal: 'Saanvi Couture Pvt. Ltd.', gstin: '33ABCPS1234K1Z5', mobile: '9844012345', phone: '044 4012 3456', email: 'hello@saanvicouture.in', website: 'saanvicouture.in',
    address: '42, Usman Road, T. Nagar\nChennai, Tamil Nadu 600017', footer: 'Exchange within 7 days with original tags and this invoice. No cash refunds on sale items.', logo: '',
    branches: [{ name: 'Chennai · T. Nagar', address: '42, Usman Road, T. Nagar, Chennai 600017', mobile: '9844012345' }, { name: 'Chennai · Anna Nagar', address: '2nd Avenue, Anna Nagar, Chennai 600040', mobile: '9844012346' }, { name: 'Bengaluru · Koramangala', address: '14, 80 Ft Road, Koramangala, Bengaluru 560034', mobile: '9844012347' }] };
  load() { try { return { ...this.def, ...(JSON.parse(db.getItem('sc_store')) || {}) }; } catch (e) { return { ...this.def }; } }
  saved = this.load();
  state: any = { f: { ...this.saved }, base: JSON.stringify(this.saved), tried: false, err: '', logoErr: '', savedAt: '', role: ((() => { try { return JSON.parse(db.getItem('sc_user')) || {}; } catch (e) { return {}; } })().role) || 'Admin' };
  renderVals() {
    const s = this.state, f = s.f;
    const set = k => e => this.setState({ f: { ...f, [k]: e.target.value } });
    const mob = (f.mobile || '').replace(/\D/g, '');
    const bad = { name: s.tried && !f.name.trim(), mobile: s.tried && mob.length !== 10 };
    const F = [['name', 'Store name *', 'Saanvi Couture', '1 / -1', 'text'], ['legal', 'Legal / registered name', 'Saanvi Couture Pvt. Ltd.', 'auto', 'text'], ['gstin', 'GSTIN', '33ABCDE1234F1Z5', 'auto', 'text'],
      ['mobile', 'Mobile *', '10-digit mobile', 'auto', 'tel'], ['phone', 'Landline', '044 4012 3456', 'auto', 'tel'], ['email', 'Email', 'hello@store.in', 'auto', 'email'], ['website', 'Website', 'store.in', 'auto', 'url']];
    const updB = (i, k) => e => this.setState({ f: { ...f, branches: f.branches.map((b, j) => j === i ? { ...b, [k]: e.target.value } : b) } });
    const fmtMob = m => m.replace(/\D/g, '').replace(/^(\d{5})(\d{5})$/, '$1 $2');
    return {
      isAdmin: s.role === 'Admin', notAdmin: s.role !== 'Admin', role: s.role,
      clean: JSON.stringify(f) === s.base, savedNote: s.savedAt ? 'Saved ' + s.savedAt : '',
      f, logoBig: (f.logo) ? React.createElement('img', { src: f.logo, alt: '', style: { width: '100%', height: '100%', objectFit: 'contain', padding: 10, boxSizing: 'border-box', background: 'var(--color-neutral-100)' } }) : null, logoSmall: (f.logo) ? React.createElement('img', { src: f.logo, alt: '', style: { width: 52, height: 52, objectFit: 'contain', flex: 'none' } }) : null, hasLogo: !!f.logo, noLogo: !f.logo, logoBtn: f.logo ? 'Replace logo' : 'Upload logo',
      hasLogoErr: !!s.logoErr, logoErr: s.logoErr,
      onLogo: e => {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        if (file.size > 500 * 1024) return this.setState({ logoErr: 'That file is over 500 KB. Please use a smaller image.' });
        const r = new FileReader(); r.onload = () => this.setState({ f: { ...this.state.f, logo: r.result }, logoErr: '' }); r.readAsDataURL(file);
        e.target.value = '';
      },
      removeLogo: () => this.setState({ f: { ...f, logo: '' } }),
      fields: F.map(([k, label, ph, span, mode]) => ({ label, ph, span, mode, value: f[k] || '', onChange: set(k), err: bad[k] ? '0 0 0 1px var(--color-accent-300)' : 'none' })),
      onAddress: set('address'), onFooter: set('footer'),
      hasErr: !!s.err, err: s.err,
      branches: f.branches.map((b, i) => ({ ...b, only: f.branches.length === 1, onName: updB(i, 'name'), onAddress: updB(i, 'address'), onMobile: updB(i, 'mobile'),
        remove: () => this.setState({ f: { ...f, branches: f.branches.filter((_, j) => j !== i) } }) })),
      addBranch: () => this.setState({ f: { ...f, branches: [...f.branches, { name: '', address: '', mobile: '' }] } }),
      pv: { name: f.name || 'Store name', legal: f.legal, address: f.address || 'Address', contact: ['+91 ' + fmtMob(f.mobile || ''), f.phone, f.email].filter(x => x && x.trim() !== '+91').join(' · '), gstin: f.gstin || '—', footer: f.footer },
      discard: () => this.setState({ f: JSON.parse(s.base), tried: false, err: '' }),
      save: () => {
        let err = '';
        if (!f.name.trim()) err = 'Store name is required.';
        else if (mob.length !== 10) err = 'Mobile must be 10 digits.';
        else if (!f.address.trim()) err = 'Address is required.';
        else if (f.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(f.gstin.toUpperCase())) err = 'GSTIN should be 15 characters, e.g. 33ABCDE1234F1Z5.';
        else if (f.branches.some(b => !b.name.trim())) err = 'Every branch needs a name.';
        if (err) return this.setState({ err, tried: true });
        const clean = { ...f, gstin: f.gstin.toUpperCase(), branches: f.branches.map(b => ({ ...b, name: b.name.trim() })) };
        try { db.setItem('sc_store', JSON.stringify(clean)); } catch (e) { return this.setState({ err: 'Could not save — the logo may be too large for browser storage.' }); }
        window.dispatchEvent(new CustomEvent('sc-store'));
        this.setState({ f: clean, base: JSON.stringify(clean), err: '', tried: false, savedAt: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) });
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
              <div className={styles.box2}>System · Admin only</div>
              <h1 className={styles.title1}>Store configuration</h1>
              <div className={styles.box3}>
                Store name, logo and contact details appear on the sidebar, sign-in screen and every printed invoice.
              </div>
            </div>
            {$v.isAdmin ? (
              <>
                <div className={styles.box4}>
                  <span className={styles.text1}>{$v.savedNote}</span>
                  <button className="btn btn-secondary" onClick={$v.discard} disabled={$v.clean}>Discard</button>
                  <button className="btn btn-primary" onClick={$v.save} disabled={$v.clean}>
                    <i className="ph ph-check" />
                    Save changes
                  </button>
                </div>
              </>
            ) : null}
          </header>
          {$v.notAdmin ? (
            <>
              <div className={`card ${styles.box5}`}>
                <i className={`ph ph-lock-key ${styles.icon1}`} />
                <div className="card-title">Only admins can change store settings</div>
                <div className="card-body">
                  You're signed in as {$v.role}. Ask the store owner or an admin to update these details.
                </div>
                <A className="btn btn-secondary" href="Dashboard.dc.html">Back to dashboard</A>
              </div>
            </>
          ) : null}
          {$v.isAdmin ? (
            <>
              <div className={styles.box6}>
                <section className={styles.section1}>
                  <div className={`card ${styles.box7}`}>
                    <div className="card-kicker">Store logo</div>
                    <div className={styles.box8}>
                      <div className={styles.box9}>
                        {$v.hasLogo ? (
                          <>
                            {$v.logoBig}
                          </>
                        ) : null}
                        {$v.noLogo ? (
                          <>
                            <span className={styles.text2}>
                              logo
                              <br />
                              PNG / SVG
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div className={styles.box10}>
                        <div className={styles.box11}>
                          <label className={`btn btn-secondary ${styles.label1}`}>
                            <i className="ph ph-upload-simple" />
                            {$v.logoBtn}
                            <input className={styles.field1} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={$v.onLogo} />
                          </label>
                          {$v.hasLogo ? (
                            <>
                              <button className="btn btn-ghost" onClick={$v.removeLogo}>Remove</button>
                            </>
                          ) : null}
                        </div>
                        <div className={styles.box12}>
                          Square, at least 256 × 256 px, under 500 KB. A dark logo on a transparent background prints best.
                        </div>
                        {$v.hasLogoErr ? (
                          <>
                            <div className={styles.box13}>{$v.logoErr}</div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className={`card ${styles.box14}`}>
                    <div className="card-kicker">Store details</div>
                    <div className={styles.box15}>
                      {($v.fields || []).map((x: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className="field" style={{ gridColumn: x?.span }}>
                            <label>{x?.label}</label>
                            <input className="input" value={x?.value} onChange={x?.onChange} placeholder={x?.ph} inputMode={x?.mode} style={{ boxShadow: x?.err }} />
                          </div>
                        </React.Fragment>
                      ))}
                      <div className={`field ${styles.box16}`}>
                        <label>Registered address *</label>
                        <textarea className={`input ${styles.textarea1}`} value={$v.f?.address} onChange={$v.onAddress} placeholder="Door no, street, area, city, PIN" />
                      </div>
                      <div className={`field ${styles.box16}`}>
                        <label>Invoice footer note</label>
                        <input className="input" value={$v.f?.footer} onChange={$v.onFooter} placeholder="Exchange within 7 days with original tags." />
                      </div>
                    </div>
                    {$v.hasErr ? (
                      <>
                        <div className={styles.box17}>{$v.err}</div>
                      </>
                    ) : null}
                  </div>
                  <div className={`card ${styles.box18}`}>
                    <div className={styles.box19}>
                      <div className="card-kicker">Branches</div>
                      <button className="btn btn-ghost" onClick={$v.addBranch}>
                        <i className="ph ph-plus" />
                        Add branch
                      </button>
                    </div>
                    {($v.branches || []).map((b: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box20}>
                          <input className={`input ${styles.field2}`} value={b?.name} onChange={b?.onName} placeholder="City · Area" />
                          <input className={`input ${styles.field2}`} value={b?.address} onChange={b?.onAddress} placeholder="Branch address" />
                          <input className={`input ${styles.field2}`} value={b?.mobile} onChange={b?.onMobile} placeholder="Branch mobile" inputMode="tel" />
                          <button className={styles.button1} onClick={b?.remove} title="Remove branch" disabled={b?.only}><i className="ph ph-trash" /></button>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </section>
                <aside className={styles.aside1}>
                  <div className={`card-kicker ${styles.box21}`}>Invoice header preview</div>
                  <div className={styles.box22} data-paper="1">
                    <div className={styles.box23}>
                      {$v.hasLogo ? (
                        <>
                          {$v.logoSmall}
                        </>
                      ) : null}
                      <div className={styles.box24}>
                        <div className={styles.box25}>{$v.pv?.name}</div>
                        <div className={styles.box26}>{$v.pv?.legal}</div>
                        <div className={styles.box27}>{$v.pv?.address}</div>
                        <div className={styles.box26}>{$v.pv?.contact}</div>
                        <div className={styles.box26}>GSTIN {$v.pv?.gstin}</div>
                      </div>
                      <div className={styles.box28}>
                        <div className={styles.box29}>Tax invoice</div>
                        <div className={styles.box30}>TNG/26-27/01043</div>
                      </div>
                    </div>
                    <div className={styles.box31}>{$v.pv?.footer}</div>
                  </div>
                  <div className={styles.box12}>
                    Changes apply to new invoices after you save. Printed invoices keep the details they were issued with.
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </main>
      </div>
      </>
    );
  }
}
