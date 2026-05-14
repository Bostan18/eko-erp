/* Direction B — Light Modern (sidebar noir / accents forest)
   - Sidebar charcoal #212121, liste plate, boutons & SVG forest
   - Contenu : fond crème clair, accents forest
   - Mobile: bottom-nav 5 icons, sidebar disparaît
   - Popover profil au-dessus du bouton
*/

function DirB({ device }) {
  const [active, setActive] = React.useState('dashboard');
  const [openProfile, setOpenProfile] = React.useState(false);
  const [openChild, setOpenChild] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [hoverTip, setHoverTip] = React.useState(null);
  const isMobile = device === 'mobile';

  React.useEffect(() => {
    if (!openProfile) return;
    const onDoc = (e) => {
      if (!e.target.closest('[data-profile-pop-b]') && !e.target.closest('[data-profile-trigger-b]')) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openProfile]);

  const activeMod = window.MODULE_BY_ID[active.split('/')[0]];
  const activeChild = active.includes('/') ? activeMod.children?.find(c => c.id === active) : null;

  function PopItem({ icon, label, tone, onClick }) {
    const I = window.Icon[icon];
    return (
      <button
        onClick={() => { setOpenProfile(false); onClick?.(); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-body transition-colors ${
          tone === 'danger'
            ? 'text-red-300 hover:bg-red-500/10'
            : 'text-gray-200 hover:bg-white/[0.06]'
        }`}
      >
        <I className="w-[15px] h-[15px]" />
        <span>{label}</span>
      </button>
    );
  }

  /* Desktop sidebar — charcoal, collapsible */
  const DesktopSidebar = () => (
    <aside className={`shrink-0 h-full flex flex-col bg-[#212121] border-r border-black/40 transition-[width] duration-200 ease-out relative ${
      collapsed ? 'w-[68px]' : 'w-[244px]'
    }`}>
      {/* Brand + collapse toggle */}
      <div className={`pt-5 pb-4 shrink-0 flex items-center ${collapsed ? 'px-3 justify-center' : 'px-5 gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center shadow-sm ring-1 ring-forest-400/30 shrink-0">
          <window.Icon.Leaf className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-white text-[15px] leading-tight">eko</div>
            <div className="text-[10.5px] font-body uppercase tracking-[0.12em] text-gray-500">EKO SARL</div>
          </div>
        )}
      </div>

      {/* Collapse toggle — floating on right edge */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#2a2a2a] ring-1 ring-white/10 text-gray-300 hover:text-white hover:bg-forest-600 hover:ring-forest-400/40 flex items-center justify-center shadow-md z-30 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Flat nav */}
      <nav className={`flex-1 overflow-y-auto pb-2 space-y-0.5 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {window.MODULES.map(m => {
          const I = window.Icon[m.icon];
          const isActive = activeMod?.id === m.id;
          const isExp = !collapsed && (openChild === m.id || (isActive && m.children));
          return (
            <div key={m.id} className="relative">
              <button
                onClick={() => {
                  setActive(m.id);
                  if (m.children && !collapsed) setOpenChild(isExp ? null : m.id);
                }}
                onMouseEnter={() => collapsed && setHoverTip(m.id)}
                onMouseLeave={() => collapsed && setHoverTip(null)}
                className={`w-full flex items-center rounded-lg text-[13.5px] font-display font-medium transition-colors relative ${
                  collapsed ? 'justify-center h-10' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-forest-500/10 text-white ring-1 ring-forest-400/25'
                    : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {isActive && <span className={`absolute top-2 bottom-2 w-[2px] rounded-r bg-forest-400 ${collapsed ? '-left-2.5' : '-left-3'}`} />}
                <I className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-forest-300' : 'text-gray-500'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{m.label}</span>
                    {m.children && (
                      <window.Icon.ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                    )}
                  </>
                )}
              </button>

              {/* Tooltip when collapsed */}
              {collapsed && hoverTip === m.id && (
                <span className="absolute left-[58px] top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-[#2a2a2a] ring-1 ring-white/[0.08] text-white text-[12px] font-display font-medium whitespace-nowrap shadow-xl z-50">
                  {m.label}
                </span>
              )}

              {m.children && isExp && (
                <div className="ml-[34px] mt-0.5 pl-3 border-l border-white/[0.06] space-y-0.5">
                  {m.children.map(c => {
                    const cActive = active === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActive(c.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-[12.5px] font-body transition-colors ${
                          cActive ? 'text-forest-300 bg-forest-500/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile */}
      <div className={`py-3 border-t border-white/[0.06] relative shrink-0 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {openProfile && (
          <div
            data-profile-pop-b
            className={`absolute bottom-[68px] bg-[#2a2a2a] rounded-xl ring-1 ring-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-50 ${
              collapsed ? 'left-[60px] w-[220px]' : 'left-3 right-3'
            }`}
          >
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="text-[13px] font-display font-semibold text-white">Aïcha Koné</div>
              <div className="text-[11.5px] text-gray-400 font-body truncate">a.kone@ekosarl.ci</div>
            </div>
            <div className="py-1">
              <PopItem icon="User" label="Mon profil" />
              <PopItem icon="Help" label="Aide & support" />
              <div className="h-px bg-white/[0.06] my-1 mx-2" />
              <PopItem icon="Logout" label="Déconnexion" tone="danger" />
            </div>
          </div>
        )}
        <button
          data-profile-trigger-b
          onClick={() => setOpenProfile(o => !o)}
          className={`w-full flex items-center rounded-lg transition-colors ${
            collapsed ? 'justify-center py-1' : 'gap-3 px-2.5 py-2'
          } ${openProfile ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center shrink-0 ring-1 ring-forest-400/30">
            <span className="text-white font-display font-semibold text-[13px]">AK</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white text-[13px] font-display font-medium truncate">Aïcha Koné</div>
                <div className="text-gray-500 text-[11px] font-body truncate">Administratrice</div>
              </div>
              <window.Icon.ChevronUp className={`w-3.5 h-3.5 text-gray-500 transition-transform ${openProfile ? '' : 'rotate-180'}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  );

  /* Mobile bottom nav */
  const BottomNav = () => (
    <nav className="bg-[#212121] border-t border-black/40 px-2 pb-1 pt-1.5 shrink-0 relative">
      {openProfile && (
        <div
          data-profile-pop-b
          className="absolute left-3 right-3 bottom-[72px] bg-[#2a2a2a] rounded-xl ring-1 ring-white/[0.08] shadow-2xl overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center ring-1 ring-forest-400/30">
              <span className="text-white font-display font-semibold text-[13px]">AK</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-display font-semibold text-white">Aïcha Koné</div>
              <div className="text-[11.5px] text-gray-400 font-body truncate">a.kone@ekosarl.ci</div>
            </div>
          </div>
          <div className="py-1">
            <PopItem icon="User" label="Mon profil" />
            <PopItem icon="Help" label="Aide & support" />
            <div className="h-px bg-white/[0.06] my-1 mx-2" />
            <PopItem icon="Logout" label="Déconnexion" tone="danger" />
          </div>
        </div>
      )}
      <div className="flex items-stretch justify-between">
        {window.BOTTOM_NAV.map(id => {
          const m = window.MODULE_BY_ID[id];
          const I = window.Icon[m.icon];
          const isActive = activeMod?.id === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-forest-300' : 'text-gray-500'
              }`}
            >
              <div className={`relative px-3.5 py-1 rounded-full ${isActive ? 'bg-forest-500/15' : ''}`}>
                <I className="w-[19px] h-[19px]" />
              </div>
              <span className="text-[10px] font-display font-medium">{m.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  /* Layouts */
  if (isMobile) {
    return (
      <div className="w-full h-full bg-[#fbf7f0] flex flex-col overflow-hidden relative">
        {/* Top */}
        <header className="bg-[#212121] px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            data-profile-trigger-b
            onClick={() => setOpenProfile(o => !o)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center shrink-0 ring-1 ring-forest-400/30"
          >
            <span className="text-white font-display font-semibold text-[12px]">AK</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-white font-display font-semibold text-[15px] truncate">
              {activeChild ? activeChild.label : window.PAGES[active]?.title}
            </div>
            <div className="text-gray-400 text-[11px] font-body truncate">
              {window.PAGES[active.split('/')[0]]?.subtitle}
            </div>
          </div>
          <button className="text-gray-300 relative">
            <window.Icon.Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-forest-400 ring-2 ring-[#212121]" />
          </button>
        </header>
        {/* Search row */}
        <div className="bg-[#212121] px-4 pb-3 shrink-0">
          <div className="relative">
            <window.Icon.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08] text-[13px] font-body text-white placeholder:text-gray-500 focus:outline-none focus:ring-forest-400/40"
            />
          </div>
        </div>
        {/* Sub-tabs if children */}
        {activeMod?.children && (
          <div className="bg-white px-3 py-2 border-b border-[#ece2d3] shrink-0 overflow-x-auto">
            <div className="flex gap-1.5">
              <Pill label={activeMod.label} active={active === activeMod.id} onClick={() => setActive(activeMod.id)} />
              {activeMod.children.map(c => (
                <Pill key={c.id} label={c.label} active={active === c.id} onClick={() => setActive(c.id)} />
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          <PageContentB active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#fbf7f0] flex overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#faf6ee]">
        <header className="bg-white/60 backdrop-blur border-b border-[#ece2d3] px-7 py-3.5 shrink-0">
          {/* Top row: title block + search + actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11.5px] font-body text-[#a8957a]">
                <span>{activeMod?.group}</span>
                <window.Icon.Chevron className="w-3 h-3" />
                <span className="text-[#5d4f3a]">{activeMod?.label}</span>
                {activeChild && (
                  <>
                    <window.Icon.Chevron className="w-3 h-3" />
                    <span className="text-[#5d4f3a]">{activeChild.label}</span>
                  </>
                )}
              </div>
              <h1 className="font-display font-bold text-[#2b1f12] text-[22px] leading-tight mt-0.5">
                {activeChild ? activeChild.label : window.PAGES[active]?.title}
              </h1>
            </div>

            {/* Search */}
            <div className="relative w-[340px] max-w-[40%]">
              <window.Icon.Search className="w-4 h-4 text-[#a8957a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher clients, chantiers, factures…"
                className="w-full pl-9 pr-14 py-2 rounded-lg bg-white ring-1 ring-[#ece2d3] text-[13px] font-body text-[#2b1f12] placeholder:text-[#a8957a] focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] rounded bg-[#f4ebe0] text-[#8b7a5f] font-mono">⌘K</span>
            </div>

            <button className="px-3 py-2 rounded-lg bg-white ring-1 ring-[#ece2d3] text-[#5d4f3a] hover:bg-white relative">
              <window.Icon.Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-forest-500" />
            </button>
            <button className="px-3.5 py-2 rounded-lg bg-forest-700 text-white text-[13px] font-display font-medium flex items-center gap-1.5 hover:bg-forest-800 shadow-sm">
              <window.Icon.Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-7">
          <PageContentB active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>
      </main>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12px] font-display font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-forest-700 text-white' : 'bg-[#f4ebe0] text-[#5d4f3a]'
      }`}
    >
      {label}
    </button>
  );
}

function PageContentB({ active, activeMod, activeChild }) {
  const pageKey = active.split('/')[0];
  const page = window.PAGES[pageKey];
  if (!page) return null;
  return (
    <div className="space-y-5 max-w-[1100px]">
      <p className="text-[12.5px] font-body text-[#7a6b54] -mt-2 hidden lg:block">
        {activeChild ? `${activeMod.label} \u2022 ${page.subtitle}` : page.subtitle}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {page.kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-4">
            <div className="text-[11px] font-body text-[#a8957a] uppercase tracking-wider">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[#2b1f12] text-[24px] leading-none">{k.value}</span>
              {k.unit && <span className="text-[11px] font-body text-[#7a6b54]">{k.unit}</span>}
            </div>
            <div className={`mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium ${
              k.up ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {k.up ? <window.Icon.ArrowUp className="w-3 h-3" /> : <window.Icon.ArrowDown className="w-3 h-3" />}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[#2b1f12] text-[14px]">Évolution mensuelle</h3>
            <div className="flex gap-1 text-[11px] font-body">
              {['7j','30j','90j','12m'].map((p,i) => (
                <button key={p} className={`px-2 py-1 rounded ${i===1 ? 'bg-forest-50 text-forest-700' : 'text-[#7a6b54] hover:bg-[#fbf7f0]'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ChartB />
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5">
          <h3 className="font-display font-semibold text-[#2b1f12] text-[14px] mb-4">Répartition</h3>
          <DonutB />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl ring-1 ring-[#ece2d3] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f4ebe0] flex items-center justify-between bg-[#fbf7f0]">
          <h3 className="font-display font-semibold text-[#2b1f12] text-[14px]">Activité récente</h3>
          <button className="text-[11.5px] font-body text-forest-700 hover:underline">Tout voir</button>
        </div>
        <ul className="divide-y divide-[#f4ebe0]">
          {window.RECENT_ACTIVITY.map((r) => (
            <li key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#fbf7f0]">
              <span className="font-mono text-[10.5px] text-[#a8957a] w-[100px] shrink-0 hidden sm:block">{r.id}</span>
              <div className="flex-1 min-w-0">
                <div className="font-body text-[13px] text-[#2b1f12] truncate">{r.label}</div>
                <div className="text-[11px] font-body text-[#7a6b54] truncate">{r.meta}</div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium ${
                r.tone === 'good' ? 'bg-forest-50 text-forest-700'
                : r.tone === 'bad' ? 'bg-red-50 text-red-700'
                : 'bg-[#f4ebe0] text-[#7a6b54]'
              }`}>{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChartB() {
  // Bars
  const data = [22,28,25,34,42,38,52,48,58,62,56,68];
  const max = 70;
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((v,i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${(v/max)*100}%`,
              background: i === data.length - 1 ? '#1a5c38' : '#bbdccb',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function DonutB() {
  const segs = [
    { v: 42, c: '#1a5c38', label: 'BTP' },
    { v: 28, c: '#388562', label: 'Agriculture' },
    { v: 18, c: '#8dc3a9', label: 'Location' },
    { v: 12, c: '#dceee4', label: 'Autre' },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="w-24 h-24 -rotate-90 shrink-0">
        <circle cx="21" cy="21" r="15.9" fill="#fbf7f0" />
        {segs.map((s, i) => {
          const len = (s.v / total) * 100;
          const dash = `${len} ${100 - len}`;
          const off = 100 - acc;
          acc += len;
          return (
            <circle key={i} cx="21" cy="21" r="15.9" fill="transparent"
              stroke={s.c} strokeWidth="6"
              strokeDasharray={dash} strokeDashoffset={off}
              pathLength="100" />
          );
        })}
      </svg>
      <div className="flex-1 space-y-1.5">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] font-body">
            <span className="w-2 h-2 rounded-sm" style={{ background: s.c }} />
            <span className="flex-1 text-[#5d4f3a]">{s.label}</span>
            <span className="text-[#7a6b54] tabular-nums">{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DirB });
