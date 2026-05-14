/* Direction C — Compact Pro
   - Rail étroite icon-only (56px) + panneau secondaire contextuel (240px)
   - Style Linear/Notion: dense, power-user, fond presque-noir
   - Modules groupés dans le panneau secondaire (accordion)
   - Mobile: bottom-nav 5 icons
   - Accent: forest avec lime/électrique pour l'état actif
*/

function DirC({ device }) {
  const [active, setActive] = React.useState('dashboard');
  const [openProfile, setOpenProfile] = React.useState(false);
  const [hoverTip, setHoverTip] = React.useState(null);
  const isMobile = device === 'mobile';

  React.useEffect(() => {
    if (!openProfile) return;
    const onDoc = (e) => {
      if (!e.target.closest('[data-profile-pop-c]') && !e.target.closest('[data-profile-trigger-c]')) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openProfile]);

  const activeMod = window.MODULE_BY_ID[active.split('/')[0]];
  const activeChild = active.includes('/') ? activeMod.children?.find(c => c.id === active) : null;

  function PopItem({ icon, label, tone, kbd }) {
    const I = window.Icon[icon];
    return (
      <button
        onClick={() => setOpenProfile(false)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-body transition-colors ${
          tone === 'danger' ? 'text-red-300 hover:bg-red-500/10' : 'text-gray-200 hover:bg-white/[0.06]'
        }`}
      >
        <I className="w-[14px] h-[14px]" />
        <span className="flex-1 text-left">{label}</span>
        {kbd && <span className="text-[10px] font-mono text-gray-500">{kbd}</span>}
      </button>
    );
  }

  /* Desktop: 2-column sidebar */
  const Rail = () => (
    <div className="w-[56px] shrink-0 bg-[#0a1812] border-r border-white/[0.06] flex flex-col items-center py-3 relative">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9ee07c] to-[#388562] flex items-center justify-center mb-3 shrink-0">
        <window.Icon.Leaf className="w-4 h-4 text-[#0a2416]" />
      </div>
      <div className="h-px w-7 bg-white/[0.06] mb-2" />

      {/* Module icons */}
      <div className="flex-1 flex flex-col gap-0.5">
        {window.MODULES.map(m => {
          const I = window.Icon[m.icon];
          const isActive = activeMod?.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              onMouseEnter={() => setHoverTip(m.id)}
              onMouseLeave={() => setHoverTip(null)}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-[#9ee07c]/15 text-[#9ee07c]'
                  : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-200'
              }`}
            >
              {isActive && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#9ee07c]" />}
              <I className="w-[18px] h-[18px]" />
              {hoverTip === m.id && (
                <span className="absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-[#1a1f1c] text-gray-100 text-[11px] font-display whitespace-nowrap shadow-xl ring-1 ring-white/[0.06] z-50">
                  {m.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-px w-7 bg-white/[0.06] my-2" />

      {/* Profile button */}
      <button
        data-profile-trigger-c
        onClick={() => setOpenProfile(o => !o)}
        className={`w-9 h-9 rounded-full overflow-hidden ring-1 transition-all ${
          openProfile ? 'ring-[#9ee07c]' : 'ring-white/10 hover:ring-white/30'
        }`}
      >
        <div className="w-full h-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center">
          <span className="text-white font-display font-semibold text-[12px]">AK</span>
        </div>
      </button>

      {openProfile && (
        <div
          data-profile-pop-c
          className="absolute left-[60px] bottom-3 w-[230px] bg-[#13211a] rounded-xl ring-1 ring-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-50"
        >
          <div className="px-3 py-3 border-b border-white/[0.06] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center">
              <span className="text-white font-display font-semibold text-[12px]">AK</span>
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-display font-semibold text-white truncate">Aïcha Koné</div>
              <div className="text-[11px] text-gray-400 font-body truncate">a.kone@ekosarl.ci</div>
            </div>
          </div>
          <div className="py-1">
            <PopItem icon="User" label="Mon profil" kbd="P" />
            <PopItem icon="Help" label="Aide & support" kbd="?" />
            <div className="h-px bg-white/[0.06] my-1 mx-2" />
            <PopItem icon="Logout" label="Déconnexion" tone="danger" kbd="⌘Q" />
          </div>
        </div>
      )}
    </div>
  );

  const SecondaryPanel = () => {
    // Groups expanded by default
    const grouped = window.GROUPS.map(g => ({
      name: g,
      items: window.MODULES.filter(m => m.group === g),
    }));
    return (
      <div className="w-[236px] shrink-0 bg-[#0d1f17] border-r border-white/[0.06] flex flex-col h-full">
        {/* Workspace switcher */}
        <div className="px-3 py-3 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-display font-semibold leading-tight truncate">EKO SARL</div>
            <div className="text-gray-400 text-[10.5px] font-body">Workspace principal</div>
          </div>
          <window.Icon.ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.04] text-gray-400 text-[12px] font-body">
            <window.Icon.Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 truncate">Rechercher</span>
            <span className="text-[10px] font-mono opacity-60">⌘K</span>
          </div>
        </div>

        {/* Groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {grouped.map(grp => (
            <div key={grp.name}>
              <div className="px-2 pb-1 text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-gray-500">
                {grp.name}
              </div>
              <div className="space-y-px">
                {grp.items.map(m => {
                  const isActive = activeMod?.id === m.id;
                  const I = window.Icon[m.icon];
                  return (
                    <div key={m.id}>
                      <button
                        onClick={() => setActive(m.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12.5px] font-display font-medium transition-colors ${
                          isActive
                            ? 'bg-white/[0.06] text-white'
                            : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                        }`}
                      >
                        <I className={`w-[14px] h-[14px] ${isActive ? 'text-[#9ee07c]' : ''}`} />
                        <span className="flex-1 text-left truncate">{m.label}</span>
                        {m.children && <span className="text-[10px] font-mono text-gray-500">{m.children.length}</span>}
                      </button>
                      {m.children && isActive && (
                        <div className="ml-[24px] mt-0.5 pl-2 border-l border-white/[0.06] space-y-px py-0.5">
                          {m.children.map(c => {
                            const cActive = active === c.id;
                            return (
                              <button
                                key={c.id}
                                onClick={() => setActive(c.id)}
                                className={`w-full text-left px-2 py-1 rounded text-[12px] font-body transition-colors ${
                                  cActive ? 'text-[#9ee07c] bg-[#9ee07c]/10' : 'text-gray-500 hover:text-gray-200'
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

        {/* Footer status */}
        <div className="px-3 py-2.5 border-t border-white/[0.06] flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9ee07c]" />
          <span className="text-[11px] font-body text-gray-400">Tous les services</span>
          <span className="ml-auto text-[10px] font-mono text-gray-500">v2.4.1</span>
        </div>
      </div>
    );
  };

  /* Mobile bottom nav */
  const BottomNavC = () => (
    <nav className="bg-[#0d1f17] border-t border-white/[0.06] px-1.5 pt-1 pb-1 shrink-0 relative">
      {openProfile && (
        <div
          data-profile-pop-c
          className="absolute left-3 right-3 bottom-[64px] bg-[#13211a] rounded-xl ring-1 ring-white/[0.08] shadow-2xl overflow-hidden z-50"
        >
          <div className="px-3 py-3 border-b border-white/[0.06] flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center">
              <span className="text-white font-display font-semibold text-[13px]">AK</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-display font-semibold text-white truncate">Aïcha Koné</div>
              <div className="text-[11px] text-gray-400 font-body truncate">a.kone@ekosarl.ci</div>
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
      <div className="flex items-stretch">
        {window.BOTTOM_NAV.map(id => {
          const m = window.MODULE_BY_ID[id];
          const I = window.Icon[m.icon];
          const isActive = activeMod?.id === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors relative ${
                isActive ? 'text-[#9ee07c]' : 'text-gray-500'
              }`}
            >
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#9ee07c] rounded-full" />}
              <I className="w-[19px] h-[19px]" />
              <span className="text-[10px] font-display font-medium">{m.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <div className="w-full h-full bg-[#0a1812] flex flex-col overflow-hidden relative">
        {/* Top */}
        <header className="bg-[#0d1f17] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9ee07c] to-[#388562] flex items-center justify-center shrink-0">
            <window.Icon.Leaf className="w-4 h-4 text-[#0a2416]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-display font-semibold text-[14.5px] truncate">
              {activeChild ? activeChild.label : window.PAGES[active]?.title}
            </div>
            <div className="text-gray-400 text-[11px] font-body truncate">EKO SARL \u2022 {activeMod?.group}</div>
          </div>
          <button
            data-profile-trigger-c
            onClick={() => setOpenProfile(o => !o)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center ring-1 ring-white/10"
          >
            <span className="text-white font-display font-semibold text-[11px]">AK</span>
          </button>
        </header>
        {/* Sub-tabs */}
        {activeMod?.children && (
          <div className="bg-[#0a1812] px-3 py-2 border-b border-white/[0.06] shrink-0 overflow-x-auto">
            <div className="flex gap-1">
              <PillC label={activeMod.label} active={active === activeMod.id} onClick={() => setActive(activeMod.id)} />
              {activeMod.children.map(c => (
                <PillC key={c.id} label={c.label} active={active === c.id} onClick={() => setActive(c.id)} />
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-3">
          <PageContentC active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>
        <BottomNavC />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0a1812] flex overflow-hidden">
      <Rail />
      <SecondaryPanel />
      <main className="flex-1 flex flex-col min-w-0 bg-[#0e1813]">
        <header className="bg-[#0a1812]/60 backdrop-blur border-b border-white/[0.06] px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-body text-gray-500">
              <span>{activeMod?.group}</span>
              <window.Icon.Chevron className="w-3 h-3" />
              <span className="text-gray-300">{activeMod?.label}</span>
              {activeChild && (
                <>
                  <window.Icon.Chevron className="w-3 h-3" />
                  <span className="text-gray-300">{activeChild.label}</span>
                </>
              )}
            </div>
            <h1 className="font-display font-bold text-white text-[20px] leading-tight mt-0.5">
              {activeChild ? activeChild.label : window.PAGES[active]?.title}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500 px-2 py-1 rounded-md bg-white/[0.04] ring-1 ring-white/[0.06]">
            <span>Filtre</span>
            <span className="text-gray-300">⌘F</span>
          </div>
          <button className="px-2.5 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06] relative">
            <window.Icon.Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#9ee07c]" />
          </button>
          <button className="px-3 py-1.5 rounded-md bg-[#9ee07c] text-[#0a2416] text-[12.5px] font-display font-semibold flex items-center gap-1.5 hover:bg-[#b8ed98]">
            <window.Icon.Plus className="w-3.5 h-3.5" />
            Nouveau
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <PageContentC active={active} activeMod={activeMod} activeChild={activeChild} />
        </div>
      </main>
    </div>
  );
}

function PillC({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[12px] font-display font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-[#9ee07c]/15 text-[#9ee07c]' : 'text-gray-500 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function PageContentC({ active, activeMod, activeChild }) {
  const pageKey = active.split('/')[0];
  const page = window.PAGES[pageKey];
  if (!page) return null;
  return (
    <div className="space-y-4 max-w-[1100px]">
      <p className="text-[11.5px] font-mono text-gray-500 -mt-1 hidden lg:block">
        {activeChild ? `${activeMod.label} \u2022 ${page.subtitle}` : page.subtitle}
      </p>

      {/* KPI strip - dense, mono numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {page.kpis.map((k, i) => (
          <div key={i} className="bg-white/[0.03] ring-1 ring-white/[0.06] rounded-lg p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-display uppercase tracking-wider text-gray-500">{k.label}</div>
              <div className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${
                k.up ? 'text-[#9ee07c]' : 'text-amber-400'
              }`}>
                {k.up ? <window.Icon.ArrowUp className="w-2.5 h-2.5" /> : <window.Icon.ArrowDown className="w-2.5 h-2.5" />}
                {k.trend}
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-display font-bold text-white text-[22px] leading-none tabular-nums">{k.value}</span>
              {k.unit && <span className="text-[10.5px] font-mono text-gray-500">{k.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white/[0.03] ring-1 ring-white/[0.06] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-gray-200 text-[13px]">Évolution</h3>
            <div className="flex gap-px text-[10.5px] font-mono bg-white/[0.04] rounded p-0.5">
              {['7j','30j','90j','12m'].map((p,i) => (
                <button key={p} className={`px-2 py-0.5 rounded-sm ${i===1 ? 'bg-white/[0.08] text-white' : 'text-gray-500'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ChartC />
        </div>
        <div className="bg-white/[0.03] ring-1 ring-white/[0.06] rounded-lg p-4">
          <h3 className="font-display font-semibold text-gray-200 text-[13px] mb-3">Répartition</h3>
          <DonutC />
        </div>
      </div>

      {/* List - compact */}
      <div className="bg-white/[0.03] ring-1 ring-white/[0.06] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <h3 className="font-display font-semibold text-gray-200 text-[12.5px]">Activité récente</h3>
          <button className="text-[11px] font-mono text-[#9ee07c] hover:underline">view all →</button>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {window.RECENT_ACTIVITY.map((r) => (
            <li key={r.id} className="px-4 py-2 flex items-center gap-3 hover:bg-white/[0.03]">
              <span className="font-mono text-[10.5px] text-gray-500 w-[100px] shrink-0 hidden sm:block">{r.id}</span>
              <div className="flex-1 min-w-0">
                <div className="font-body text-[12.5px] text-gray-100 truncate">{r.label}</div>
                <div className="text-[10.5px] font-mono text-gray-500 truncate">{r.meta}</div>
              </div>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                r.tone === 'good' ? 'bg-[#9ee07c]/10 text-[#9ee07c]'
                : r.tone === 'bad' ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-500/10 text-blue-300'
              }`}>{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChartC() {
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-28">
      <defs>
        <linearGradient id="grad-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ee07c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9ee07c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75].map(y => (
        <line key={y} x1="0" y1={y*h} x2={w} y2={y*h} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" strokeDasharray="1 1" />
      ))}
      <path d={fill} fill="url(#grad-c)" />
      <path d={path} fill="none" stroke="#9ee07c" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DonutC() {
  const segs = [
    { v: 42, c: '#9ee07c', label: 'BTP' },
    { v: 28, c: '#5aa382', label: 'Agriculture' },
    { v: 18, c: '#388562', label: 'Location' },
    { v: 12, c: 'rgba(255,255,255,0.1)', label: 'Autre' },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 42 42" className="w-20 h-20 -rotate-90 shrink-0">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
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
      <div className="flex-1 space-y-1">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[11.5px] font-mono">
            <span className="w-1.5 h-1.5 rounded-sm" style={{ background: s.c }} />
            <span className="flex-1 text-gray-300">{s.label}</span>
            <span className="text-gray-500 tabular-nums">{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DirC });
