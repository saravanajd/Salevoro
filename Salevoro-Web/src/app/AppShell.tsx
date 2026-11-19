import React from 'react';
import { Outlet } from 'react-router-dom';
import { DCLogic, cssObj } from '../lib/DCLogic';
import { db } from '../api/db';
import { A, scGo, scMain, toRoute } from '../lib/nav';
import styles from './AppShell.module.css';

export default class AppShell extends DCLogic {
  PAGES = [
    ['dashboard', 'Dashboard', 'Overview', 'Dashboard', 'ph ph-squares-four'],
    ['billing', 'New bill', 'Sales', 'Billing', 'ph ph-receipt'],
    ['invoices', 'Invoices & returns', 'Sales', 'Invoices', 'ph ph-files'],
    ['customers', 'Customers', 'Masters', 'Customers', 'ph ph-users'],
    ['categories', 'Categories', 'Masters', 'Categories', 'ph ph-squares-four'],
    ['products', 'Products & items', 'Masters', 'Products', 'ph ph-dress'],
    ['inventory', 'Inventory', 'Masters', 'Inventory', 'ph ph-package'],
    ['purchases', 'Purchases & suppliers', 'Purchasing', 'Purchases', 'ph ph-truck'],
    ['whatsapp', 'WhatsApp Business', 'Engage & insights', 'WhatsApp', 'ph ph-whatsapp-logo'],
    ['events', 'Events', 'Engage & insights', 'Events', 'ph ph-calendar-heart'],
    ['reports', 'Reports', 'Engage & insights', 'Reports', 'ph ph-chart-bar'],
    ['store', 'Store configuration', 'System', 'Store', 'ph ph-storefront', true],
    ['gst', 'GST slabs', 'System', 'GST', 'ph ph-percent'],
    ['schema', 'SQL schema', 'System', 'Schema', 'ph ph-database'],
    ['profile', 'My profile', 'Account', 'Profile', 'ph ph-user-circle', false, true],
  ];
  read(k, d) { try { return { ...d, ...(JSON.parse(db.getItem(k)) || {}) }; } catch (e) { return { ...d }; } }
  defUser = { name: 'Priya Raman', email: 'priya@saanvicouture.in', role: 'Admin', photo: '' };
  defStore = { name: 'Saanvi Couture', logo: '' };
  KEEPER_GROUPS = ['Sales', 'Masters', 'Account'];
  roleOf(u) { return (u && u.role) === 'Admin' ? 'Admin' : 'Store Keeper'; }
  canSee(p, u) { return this.roleOf(u || this.read('sc_user', this.defUser)) === 'Admin' || this.KEEPER_GROUPS.includes(p[2]); }
  home(u) { return this.PAGES.find(p => p[0] === (this.roleOf(u) === 'Admin' ? 'dashboard' : 'billing')); }
  pageFromHash() { const h = (this.props.location?.pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase(), u = this.read('sc_user', this.defUser), p = this.PAGES.find(x => x[0] === h); return p && this.canSee(p, u) ? p : this.home(u); }
  initial = this.pageFromHash();
  state: any = { active: this.initial[0], loading: true, collapsed: db.getItem('sc_nav') === '1' || (window.innerWidth < 1100 && window.innerWidth >= 760), mobile: window.innerWidth < 760, drawer: false, menu: false,
    branch: db.getItem('sc_branch') || 'Chennai · T. Nagar', user: this.read('sc_user', this.defUser), store: this.read('sc_store', this.defStore) };
  componentDidMount() {
    window.__scShell = true;
    window.__scActivePage = this.state.active; window.scTheme && window.scTheme.apply();
    if (db.getItem('sc_session') === 'out') { scGo('/login'); return; }
    this.onResize = () => { const m = window.innerWidth < 760; if (m !== this.state.mobile) this.setState({ mobile: m, drawer: false }); };
    this.onStorage = e => {
      if (e.key === 'sc_theme') { window.scTheme && window.scTheme.apply(); this.forceUpdate(); }
      if (e.key === 'sc_store' || e.key === 'sc_user') this.setState({ store: this.read('sc_store', this.defStore), user: this.read('sc_user', this.defUser) });
      if (e.key === 'sc_session' && e.newValue === 'out') scGo('/login');
    };
    this.onTheme = () => { this.forceUpdate(); this.syncFrameTheme(); };
    this.onDoc = e => { if (this.state.menu && !e.target.closest('[data-acct]')) this.setState({ menu: false }); };
    this.onHash = () => { const p = this.pageFromHash(); if (p[0] !== this.state.active) this.go(p[3] + '.dc.html'); };
    window.addEventListener('resize', this.onResize); window.addEventListener('storage', this.onStorage); window.addEventListener('sc-theme', this.onTheme);
    this.onStoreEv = () => this.setState({ store: this.read('sc_store', this.defStore), user: this.read('sc_user', this.defUser) }); window.addEventListener('sc-store', this.onStoreEv); this.onRoute(); document.addEventListener('mousedown', this.onDoc);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize); window.removeEventListener('storage', this.onStorage); window.removeEventListener('sc-theme', this.onTheme);
    window.removeEventListener('sc-store', this.onStoreEv); document.removeEventListener('mousedown', this.onDoc);
  }
  syncFrameTheme() {}
  componentDidUpdate(prev) { if (prev.location?.key !== this.props.location?.key) this.onRoute(); }
  go(href) { this.t0 = Date.now(); this.setState({ loading: true }); scGo(toRoute(href) || '/'); }
  onRoute = () => {
    const path = (this.props.location?.pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
    const p = this.PAGES.find(x => x[0] === path);
    if (!p || !this.canSee(p, this.state.user)) { scGo('/' + this.home(this.state.user)[0], true); return; }
    const id = p[0];
    window.__scActivePage = id; document.documentElement.setAttribute('data-page', id);
    window.scTheme && window.scTheme.apply(); window.dispatchEvent(new CustomEvent('sc-theme'));
    const m = document.getElementById('sc-main'); if (m) m.scrollTop = 0;
    const wait = Math.max(0, 380 - (Date.now() - (this.t0 || 0)));
    this.setState({ active: id, drawer: false });
    clearTimeout(this.lt); this.lt = setTimeout(() => { this.pendingLabel = ''; this.setState({ loading: false }); }, wait);
  };
  renderVals() {
    const s = this.state, u = { ...s.user, role: this.roleOf(s.user) }, isAdmin = u.role === 'Admin', full = s.mobile || !s.collapsed;
    const T = window.scTheme, light = T && T.resolvedMode() === 'light';
    const cur = this.PAGES.find(p => p[0] === s.active) || this.PAGES[0];
    const groups = [];
    this.PAGES.filter(p => !p[6] && (!p[5] || isAdmin) && this.canSee(p, u)).forEach(p => { let g = groups.find(x => x.label === p[2]); if (!g) groups.push(g = { label: p[2], items: [] });
      const on = p[0] === s.active;
      g.items.push({ label: p[1], icon: p[4], href: p[3] + '.dc.html', color: on ? 'var(--color-accent-300)' : 'var(--color-neutral-300)', bg: on ? 'color-mix(in srgb, var(--color-accent) 13%, transparent)' : 'transparent', ring: on ? 'inset 2px 0 0 var(--color-accent)' : 'none' }); });
    return {
      full, mobile: s.mobile, notMobile: !s.mobile, navWidth: s.mobile ? 264 : full ? 228 : 64,
      asidePos: s.mobile ? 'fixed' : 'relative', asideTx: s.mobile && !s.drawer ? 'translateX(-105%)' : 'none',
      drawerOpen: s.mobile && s.drawer, closeDrawer: () => this.setState({ drawer: false }),
      toggleNav: () => { if (s.mobile) return this.setState({ drawer: !s.drawer }); const c = !s.collapsed; db.setItem('sc_nav', c ? '1' : '0'); this.setState({ collapsed: c }); },
      navBtnIcon: s.mobile ? 'ph ph-list' : s.collapsed ? 'ph ph-sidebar-simple' : 'ph ph-sidebar',
      navBtnTitle: s.mobile ? 'Menu' : s.collapsed ? 'Expand menu' : 'Collapse menu',
      navClick: e => { const t = e.currentTarget, lbl = t && (t.getAttribute('title') || t.textContent || '').trim(); this.pendingLabel = lbl && lbl.length < 40 ? lbl : ''; this.t0 = Date.now(); this.setState({ loading: true, drawer: false, menu: false }); },
      store: { ...s.store, initial: (s.store.name || 'S').trim()[0].toUpperCase() }, hasLogo: !!s.store.logo, noLogo: !s.store.logo,
      logoImg: s.store.logo ? React.createElement('img', { src: s.store.logo, alt: '', style: { width: 32, height: 32, flex: 'none', borderRadius: 8, objectFit: 'contain', background: 'var(--color-neutral-900)' } }) : null,
      user: { ...u, initials: u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }, hasPhoto: !!u.photo, noPhoto: !u.photo,
      photoImg: u.photo ? React.createElement('img', { src: u.photo, alt: '', style: { width: 30, height: 30, flex: 'none', borderRadius: '50%', objectFit: 'cover' } }) : null,
      groups, crumbGroup: cur[2], crumbPage: cur[1],
      branch: s.branch, branches: (s.store.branches || [{ name: 'Chennai · T. Nagar' }, { name: 'Chennai · Anna Nagar' }, { name: 'Bengaluru · Koramangala' }]).map(b => b.name),
      onBranch: e => { const v = e.target.value; db.setItem('sc_branch', v); this.setState({ branch: v }); try { window.dispatchEvent(new CustomEvent('sc-branch', { detail: v })); } catch (er) {} },
      modeIcon: light ? 'ph ph-moon' : 'ph ph-sun', modeTitle: light ? 'Switch to dark mode' : 'Switch to light mode',
      toggleMode: () => { if (!T) return; if (T.isBilling() && T.get().brightBilling) T.set({ brightBilling: false, mode: 'dark' }); else T.set({ mode: light ? 'dark' : 'light' }); this.syncFrameTheme(); },
      menuOpen: s.menu, toggleMenu: () => this.setState({ menu: !s.menu }),
      menu: [['My profile', 'ph ph-user-circle', 'Profile.dc.html'], ...(isAdmin ? [['Store configuration', 'ph ph-storefront', 'Store.dc.html']] : [])].map(([label, icon, href]) => ({ label, icon, href })),
      signOut: () => { db.setItem('sc_session', 'out'); scGo('/login'); },
      loader: s.loading ? React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', zIndex: 5 } },
        React.createElement('div', { style: { width: '40%', height: '100%', background: 'var(--color-accent)', boxShadow: '0 0 10px var(--color-accent)', animation: 'scload 0.9s ease-in-out infinite' } })) : null,
      overlay: s.loading ? React.createElement('div', { style: { position: 'absolute', inset: 0, zIndex: 4, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-bg) 72%, transparent)', backdropFilter: 'blur(2px)' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 10, background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', fontSize: 13, color: 'var(--color-neutral-300)' } },
          React.createElement('span', { style: { width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--color-accent-800)', borderTopColor: 'var(--color-accent)', animation: 'scspin .7s linear infinite' } }),
          'Loading ' + (this.pendingLabel || cur[1]) + '…')) : null,
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1} data-shell-root="1">
        {$v.drawerOpen ? (
          <>
            <div className={styles.box2} onClick={$v.closeDrawer} />
          </>
        ) : null}
        <aside className={styles.aside1} data-shell-chrome="1" style={{ position: $v.asidePos, transform: $v.asideTx, width: `${$v.navWidth ?? ''}px` }}>
          <div className={styles.box3}>
            <A className={styles.link1} href="Dashboard.dc.html" target="work" onClick={$v.navClick} title={`${$v.store?.name ?? ''} · ${$v.branch ?? ''}`}>
              {$v.hasLogo ? (
                <>
                  {$v.logoImg}
                </>
              ) : null}
              {$v.noLogo ? (
                <>
                  <div className={styles.box4}>{$v.store?.initial}</div>
                </>
              ) : null}
              {$v.full ? (
                <>
                  <div className={styles.box5}>
                    <div className={styles.box6}>{$v.store?.name}</div>
                    <div className={styles.box7}>
                      <i className={`ph ph-map-pin ${styles.icon1}`} />
                      <span className={styles.text1}>{$v.branch}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </A>
            {$v.mobile ? (
              <>
                <div className={styles.box8}>
                  <span className={styles.text2}>Branch</span>
                  <select className={`input ${styles.select1}`} value={$v.branch} onChange={$v.onBranch}>
                    {($v.branches || []).map((b: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={b}>{b}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </div>
          <nav className={styles.nav1}>
            {($v.groups || []).map((g: any, $index: number) => (
              <React.Fragment key={$index}>
                <div className={styles.box9}>
                  {$v.full ? (
                    <>
                      <span className={styles.text3}>{g?.label}</span>
                    </>
                  ) : null}
                  {(g?.items || []).map((i: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <A className={styles.link2} href={i?.href} target="work" title={i?.label} onClick={$v.navClick} style={{ color: i?.color, "--dyn-background": i?.bg, boxShadow: i?.ring }}>
                        <i className={`${i?.icon ?? ''} ${styles.icon2}`} />
                        {$v.full ? (
                          <>
                            <span className={styles.text4}>{i?.label}</span>
                          </>
                        ) : null}
                      </A>
                    </React.Fragment>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </nav>
          <A className={styles.link3} href="Profile.dc.html" target="work" onClick={$v.navClick} title={`${$v.user?.name ?? ''} · ${$v.user?.role ?? ''}`}>
            {$v.hasPhoto ? (
              <>
                {$v.photoImg}
              </>
            ) : null}
            {$v.noPhoto ? (
              <>
                <div className={styles.box10}>{$v.user?.initials}</div>
              </>
            ) : null}
            {$v.full ? (
              <>
                <div className={styles.box11}>
                  <div className={styles.box12}>{$v.user?.name}</div>
                  <div className={styles.box13}>{$v.user?.role}</div>
                </div>
                <i className={`ph ph-caret-right ${styles.icon3}`} />
              </>
            ) : null}
          </A>
        </aside>
        <div className={styles.box14}>
          <header className={styles.header1} data-shell-chrome="1">
            <button className={styles.button1} onClick={$v.toggleNav} title={$v.navBtnTitle}><i className={`${$v.navBtnIcon ?? ''} ${styles.icon4}`} /></button>
            <div className={styles.box15}>
              {$v.notMobile ? (
                <>
                  <span className={styles.text5}>{$v.crumbGroup}</span>
                  <i className={`ph ph-caret-right ${styles.icon5}`} />
                </>
              ) : null}
              <span className={styles.text6}>{$v.crumbPage}</span>
            </div>
            {$v.notMobile ? (
              <>
                <div className={styles.box16}>
                  <i className={`ph ph-storefront ${styles.icon6}`} />
                  <select className={styles.select2} value={$v.branch} onChange={$v.onBranch}>
                    {($v.branches || []).map((b: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option className={styles.option1} value={b}>{b}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            <button className={styles.button1} onClick={$v.toggleMode} title={$v.modeTitle}><i className={`${$v.modeIcon ?? ''} ${styles.icon7}`} /></button>
            <A className={`btn btn-primary ${styles.link4}`} href="Billing.dc.html" target="work" onClick={$v.navClick}>
              <i className="ph ph-receipt" />
              {$v.notMobile ? (
                <>
                  New bill
                </>
              ) : null}
            </A>
            <div className={styles.box17}>
              <button className={styles.button2} onClick={$v.toggleMenu} data-acct="1" title="Account">
                {$v.hasPhoto ? (
                  <>
                    {$v.photoImg}
                  </>
                ) : null}
                {$v.noPhoto ? (
                  <>
                    <div className={styles.box18}>{$v.user?.initials}</div>
                  </>
                ) : null}
                {$v.notMobile ? (
                  <>
                    <div className={styles.box19}>
                      <div className={styles.box20}>{$v.user?.name}</div>
                      <div className={styles.box21}>{$v.user?.role}</div>
                    </div>
                  </>
                ) : null}
              </button>
              {$v.menuOpen ? (
                <>
                  <div className={styles.box22} data-acct="1">
                    <div className={styles.box23}>
                      <span className={styles.text7}>{$v.user?.name}</span>
                      <span className={styles.text8}>{$v.user?.email}</span>
                    </div>
                    {($v.menu || []).map((m: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <A className={styles.link5} href={m?.href} target="work" onClick={$v.navClick}>
                          <i className={`${m?.icon ?? ''} ${styles.icon8}`} />
                          {m?.label}
                        </A>
                      </React.Fragment>
                    ))}
                    <div className={styles.box24} />
                    <button className={styles.button3} onClick={$v.signOut}>
                      <i className={`ph ph-sign-out ${styles.icon8}`} />
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </header>
          <div className={styles.box25}>
            {$v.loader} {$v.overlay}{" "}
            <div id="sc-main" className={styles.main}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }
}
