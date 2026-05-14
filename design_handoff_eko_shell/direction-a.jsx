/* Direction A — Forest Classic
   - Sidebar sombre forest-900
   - Modules groupés par domaine (Pilotage, Exploitation, Équipe, Commercial)
   - Mobile: drawer overlay (hamburger)
   - Popover profil au-dessus du bouton avatar
*/

function DirA({ device }) {
  const [active, setActive] = React.useState('dashboard');
  const [openProfile, setOpenProfile] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState(null);
  const isMobile = device === 'mobile';

  // Click outside for popover
  React.useEffect(() => {
    if (!openProfile) return;
    const onDoc = (e) => {
      if (!e.target.closest('[data-profile-pop]') && !e.target.closest('[data-profile-trigger]')) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openProfile]);

  const handleSelect = (id) => {
    setActive(id);
    if (isMobile) setMobileOpen(false);
  };

  // Group modules
  const byGroup = window.GROUPS.map(g => ({
    name: g,
    items: window.MODULES.filter(m => m.group === g),
  }));

  const activeMod = window.MODULE_BY_ID[active.split('/')[0]];
  const activeChild = active.includes('/') ? activeMod.children?.find(c => c.id === active) : null;

  const SidebarContent = ({ onClose }) => (
    <div className="h-full flex flex-col bg-[#123d26] text-forest-100">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-forest-500/20 ring-1 ring-forest-400/30 flex items-center justify-center">
          <window.Icon.Leaf className="w-4 h-4 text-forest-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-white text-[15px] leading-tight">eko</div>
          <div className="text-[11px] text-forest-300 font-body tracking-wide uppercase">EKO SARL</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-forest-300 hover:text-white p-1 -mr-1">
            <window.Icon.Close className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-forest-300 text-[13px] font-body">
          <window.Icon.Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">Rechercher…</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-forest-300 font-mono">⌘K</span>
        </div>
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {byGroup.map((grp) => (
          <div key={grp.name}>
            <div className="px-3 pb-1.5 text-[10.5px] font-display font-semibold tracking-[0.12em] uppercase text-forest-400/80">
              {grp.name}
            </div>
            <div className="space-y-0.5">
              {grp.items.map((m) => {
                const isActive = activeMod?.id === m.id;
                const isExpanded = openGroup === m.id || isActive;
                const I = window.Icon[m.icon];
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => {
                        if (m.children) {
                          setOpenGroup(isExpanded ? null : m.id);
                          handleSelect(m.id);
                        } else {
                          handleSelect(m.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-display font-medium transition-colors ${
                        isActive
                          ? 'bg-forest-500/15 text-white ring-1 ring-forest-400/30'
                          : 'text-forest-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <I className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1 text-left truncate">{m.label}</span>
                      {m.children && (
                        <window.Icon.ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    {m.children && isExpanded && (
                      <div className="ml-[34px] mt-0.5 pl-3 border-l border-forest-700/60 space-y-0.5">
                        {m.children.map((c) => {
                          const cActive = active === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => handleSelect(c.id)}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-[12.5px] font-body transition-colors ${
                                cActive
                                  ? 'text-white bg-forest-500/10'
                                  : 'text-forest-300 hover:text-white hover:bg-white/5'
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
            </div>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-white/5 relative shrink-0">
        {openProfile && (
          <div
            data-profile-pop
            className="absolute left-3 right-3 bottom-[68px] bg-[#1a5c38] rounded-xl ring-1 ring-forest-400/20 shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-[13px] font-display font-semibold text-white">Aïcha Koné</div>
              <div className="text-[11.5px] text-forest-300 font-body truncate">a.kone@ekosarl.ci</div>
            </div>
            <div className="py-1">
              <PopItem icon="User" label="Mon profil" />
              <PopItem icon="Help" label="Aide & support" />
              <div className="h-px bg-white/5 my-1 mx-2" />
              <PopItem icon="Logout" label="Déconnexion" tone="danger" />
            </div>
          </div>
        )}
        <button
          data-profile-trigger
          onClick={() => setOpenProfile(o => !o)}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
            openProfile ? 'bg-white/5' : 'hover:bg-white/5'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center shrink-0 ring-1 ring-forest-400/30">
            <span className="text-white font-display font-semibold text-[13px]">AK</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-white text-[13px] font-display font-medium truncate">Aïcha Koné</div>
            <div className="text-forest-300 text-[11px] font-body truncate">Administratrice</div>
          </div>
          <window.Icon.ChevronUp className={`w-3.5 h-3.5 text-forest-300 transition-transform ${openProfile ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  );

  function PopItem({ icon, label, tone }) {
    const I = window.Icon[icon];
    return (
      <button
        onClick={() => setOpenProfile(false)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-body transition-colors ${
          tone === 'danger'
            ? 'text-red-300 hover:bg-red-500/10'
            : 'text-forest-100 hover:bg-white/5'
        }`}
      >
        <I className="w-[15px] h-[15px]" />
        <span>{label}</span>
      </button>
    );
  }

  /* Layouts */
  if (isMobile) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col overflow-hidden relative">
        {/* Mobile top bar */}
        <header className="bg-[#123d26] px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-white p-1 -ml-1">
            <window.Icon.Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-white font-display font-semibold text-[15px] truncate">
              {activeChild ? activeChild.label : (window.PAGES[active]?.title || activeMod?.label)}
            </div>
            <div className="text-forest-300 text-[11px] font-body truncate">
              {window.PAGES[active.split('/')[0]]?.subtitle}
            </div>
          </div>
          <button className="text-forest-200 relative">
            <window.Icon.Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#123d26]" />
          </button>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-4">
          <PageContent active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>

        {/* Drawer */}
        {mobileOpen && (
          <>
            <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-[300px] z-50 shadow-2xl">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 flex overflow-hidden">
      <aside className="w-[248px] shrink-0">
        <SidebarContent />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-7 py-4 flex items-center gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11.5px] font-body text-gray-500">
              <span>{activeMod?.group}</span>
              <window.Icon.Chevron className="w-3 h-3" />
              <span className="text-gray-700">{activeMod?.label}</span>
              {activeChild && (
                <>
                  <window.Icon.Chevron className="w-3 h-3" />
                  <span className="text-gray-700">{activeChild.label}</span>
                </>
              )}
            </div>
            <h1 className="font-display font-bold text-gray-900 text-[22px] leading-tight mt-0.5">
              {activeChild ? activeChild.label : window.PAGES[active]?.title}
            </h1>
          </div>
          <button className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 relative">
            <window.Icon.Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          </button>
          <button className="px-3.5 py-2 rounded-lg bg-[#123d26] text-white text-[13px] font-display font-medium flex items-center gap-1.5 hover:bg-forest-800">
            <window.Icon.Plus className="w-4 h-4" />
            Nouveau
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-7">
          <PageContent active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>
      </main>
    </div>
  );
}

function PageContent({ active, activeMod, activeChild }) {
  const pageKey = active.split('/')[0];
  const page = window.PAGES[pageKey];
  if (!page) return null;
  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Subtitle on desktop replaced; show subtitle here */}
      <p className="text-[12.5px] font-body text-gray-500 -mt-2">
        {activeChild ? `${activeMod.label} \u2022 ${page.subtitle}` : page.subtitle}
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {page.kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-[11.5px] font-body text-gray-500">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display font-bold text-gray-900 text-[22px] leading-none">{k.value}</span>
              {k.unit && <span className="text-[11px] font-body text-gray-500">{k.unit}</span>}
            </div>
            <div className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-display font-medium ${
              k.up ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {k.up ? <window.Icon.ArrowUp className="w-3 h-3" /> : <window.Icon.ArrowDown className="w-3 h-3" />}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-900 text-[14px]">Évolution mensuelle</h3>
            <div className="flex gap-1 text-[11px] font-body">
              {['7j','30j','90j','12m'].map((p,i) => (
                <button key={p} className={`px-2 py-1 rounded ${i===1 ? 'bg-forest-50 text-forest-700' : 'text-gray-500 hover:bg-gray-50'}`}>{p}</button>
              ))}
            </div>
          </div>
          <Chart />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-gray-900 text-[14px] mb-4">Répartition</h3>
          <Donut />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-gray-900 text-[14px]">Activité récente</h3>
          <button className="text-[11.5px] font-body text-forest-700 hover:underline">Tout voir</button>
        </div>
        <ul className="divide-y divide-gray-100">
          {window.RECENT_ACTIVITY.map((r) => (
            <li key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
              <span className="font-mono text-[10.5px] text-gray-400 w-[100px] shrink-0">{r.id}</span>
              <div className="flex-1 min-w-0">
                <div className="font-body text-[13px] text-gray-900 truncate">{r.label}</div>
                <div className="text-[11px] font-body text-gray-500 truncate">{r.meta}</div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-display font-medium ${
                r.tone === 'good' ? 'bg-forest-50 text-forest-700'
                : r.tone === 'bad' ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
              }`}>{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Chart() {
  const points = [22,28,25,34,42,38,52,48,58,62,56,68];
  const max = 70;
  const w = 100, h = 100;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const fill = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
      <defs>
        <linearGradient id="grad-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#388562" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#388562" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map(y => (
        <line key={y} x1="0" y1={y*h} x2={w} y2={y*h} stroke="#f3f4f6" strokeWidth="0.3" />
      ))}
      <path d={fill} fill="url(#grad-a)" />
      <path d={path} fill="none" stroke="#1a5c38" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Donut() {
  const segs = [
    { v: 42, c: '#1a5c38', label: 'BTP' },
    { v: 28, c: '#5aa382', label: 'Agriculture' },
    { v: 18, c: '#8dc3a9', label: 'Location' },
    { v: 12, c: '#dceee4', label: 'Autre' },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="w-24 h-24 -rotate-90 shrink-0">
        <circle cx="21" cy="21" r="15.9" fill="white" stroke="#f3f4f6" strokeWidth="6" />
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
            <span className="flex-1 text-gray-700">{s.label}</span>
            <span className="text-gray-500 tabular-nums">{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DirA });
