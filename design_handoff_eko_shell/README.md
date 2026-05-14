# Handoff — eko ERP · Nouveau frontend (Sidebar + Layout)

## Aperçu
Refonte de la coquille (shell) de l'ERP eko : sidebar latérale, layout principal, barre de recherche globale, menu profil et navigation mobile. Cette refonte remplace `frontend/src/components/layout/Sidebar.jsx` et `frontend/src/components/layout/MainLayout.jsx` du codebase existant.

**Direction retenue : B — Modern · Charcoal** (`direction-b.jsx`).
Les directions A et C sont incluses comme références alternatives mais ne sont pas à implémenter.

## À propos des fichiers de design
Les fichiers HTML/JSX livrés sont des **références de design** — des prototypes montrant le rendu et le comportement attendus, pas du code de production à copier tel quel. Le travail consiste à **recréer ces designs dans l'environnement du codebase eko** (React 18 + Vite + TailwindCSS + react-router-dom) en réutilisant les conventions existantes (`forest-*` colors, font-display Sora, font-body DM Sans, classes `.btn-primary`, `.card`, etc.).

## Fidélité
**Hi-fi.** Couleurs, typographie, espacements et interactions sont définitifs. À recréer pixel-perfect avec les composants/utilities Tailwind du codebase.

---

## Stack cible (existant dans `eko-erp/frontend/`)
- React 18 + Vite
- TailwindCSS (config dans `tailwind.config.js`) — palette `forest-*` déjà définie
- react-router-dom — `NavLink`, `useNavigate`, `useLocation`
- Zustand pour l'auth (`useAuthStore`)
- Fonts : Sora (display), DM Sans (body)

---

## Design tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| Sidebar bg | `#212121` | Fond sidebar desktop + headers mobiles |
| Sidebar hover | `rgba(255,255,255,0.05)` | Hover items nav |
| Sidebar item actif | `bg-forest-500/10` + ring `ring-forest-400/25` | Module sélectionné |
| Active accent stripe | `bg-forest-400` | Barre verticale 2px à gauche de l'item actif |
| Sidebar text | `text-gray-300` (idle), `text-white` (actif/hover) | |
| Sidebar muted | `text-gray-500` | EKO SARL, sous-titres profil |
| Sidebar divider | `border-white/[0.06]` | Séparateurs internes |
| Popover profil bg | `#2a2a2a` | |
| Popover danger text | `text-red-300` | Déconnexion |
| Content bg | `#fbf7f0` (crème) puis `#faf6ee` dans main | Fond pages |
| Card bg | `white` ring `ring-[#ece2d3]` | Cartes KPI, tables, panels |
| Header bg | `bg-white/60 backdrop-blur` border-bottom `#ece2d3` | |
| Breadcrumb muted | `#a8957a` | |
| Body text | `#2b1f12` | Titres, valeurs |
| Body secondary | `#5d4f3a` | Labels, liens nav header |
| Body tertiary | `#7a6b54` | Sous-titres, métadonnées |
| Pill inactive bg | `#f4ebe0` | |
| List hover | `#fbf7f0` | |
| Primary button | `bg-forest-700 hover:bg-forest-800 text-white` | "Nouveau" |
| Secondary button | `bg-white ring-1 ring-[#ece2d3] text-[#5d4f3a]` | Cloche notif |
| Success | `bg-forest-50 text-forest-700` | Badges OK, deltas positifs |
| Warn | `bg-amber-50 text-amber-700` | Deltas négatifs |
| Error | `bg-red-50 text-red-700` | Statut Rupture |

### Typographie
- **Display** (Sora) : titres, labels nav, valeurs KPI, badges. Weights utilisés : 500, 600, 700.
- **Body** (DM Sans) : texte courant, descriptions, libellés secondaires. Weights : 400, 500.
- **Mono** (JetBrains Mono ou ui-monospace) : IDs (`CHA-014`, `FNE-2026-038`), raccourcis clavier (`⌘K`).

Échelle utilisée :
- H1 page : `text-[22px]` font-display font-bold
- Heading card : `text-[14px]` font-display font-semibold
- Item nav : `text-[13.5px]` font-display font-medium
- Sub-item nav : `text-[12.5px]` font-body
- Body courant : `text-[13px]` font-body
- Caption / breadcrumb : `text-[11.5px]` ou `text-[11px]` font-body
- KPI value : `text-[24px]` font-display font-bold
- KPI label : `text-[11px]` font-body uppercase tracking-wider

### Espacements & rayons
- Sidebar largeur : **244px** déployée / **68px** réduite
- Header h : `py-3.5` (~58px total)
- Page padding : `p-7` desktop / `p-4` mobile
- Rayons : `rounded-lg` (boutons, items nav), `rounded-xl` (popover profil, badge marque), `rounded-2xl` (cartes), `rounded-full` (avatar, pills, badges status)
- Ring/border standard : `ring-1 ring-[#ece2d3]` sur les cartes claires, `ring-1 ring-white/[0.06]` sur les surfaces sombres
- Shadows : `shadow-sm` boutons primaires ; `shadow-2xl shadow-black/60` popover sidebar

---

## Écran 1 — Layout principal (Desktop)

### Structure (flex horizontal pleine hauteur)
```
[ Sidebar 244px / 68px ]  [ Main flex-1 ]
                          ├─ Header (sticky)
                          └─ Content (overflow-y-auto, p-7)
```

### Sidebar (`<aside>`)
**État `collapsed: boolean`** — local state, peut être persisté en `localStorage`.

Structure verticale :
1. **Brand row** — leaf icon (forest-600, rounded-xl 36×36) + "eko" (Sora bold) + "EKO SARL" (uppercase tracking-wide). Quand `collapsed` : centré, texte caché.
2. **Toggle button** — flottant sur le bord droit (`absolute -right-3 top-7`), cercle 24×24, `bg-[#2a2a2a]` ring blanc/10, contient chevron-left. Au survol passe `bg-forest-600`. Tourne 180° quand `collapsed`.
3. **Nav** (`<nav>` flex-1 overflow-y-auto) — liste plate des 7 modules. Chaque item :
   - Icône SVG forest (18×18) + label + chevron-down si enfants
   - Item actif : `bg-forest-500/10 ring-1 ring-forest-400/25 text-white` + barre verticale forest-400 à -3 left
   - Hover : `bg-white/[0.05]`
   - Sous-menu : indenté `ml-[34px] pl-3 border-l border-white/[0.06]`, items 12.5px font-body
   - Quand `collapsed` : item centré, label/chevron cachés, **tooltip** au hover (popover absolu à `left-[58px]`)
4. **Profile row** — avatar 36×36 gradient `from-forest-400 to-forest-700` + initiales blanches, nom + rôle, chevron-up. Au clic ouvre le popover.

### Modules (depuis `shared.jsx`)
| id | label | short (mobile) | enfants |
|---|---|---|---|
| `dashboard` | Tableau de bord | Accueil | — |
| `rh` | **GRH** | GRH | Employés, Pointage journée, Pointage semaine, Paie & bulletins |
| `projets` | Projets | Projets | Chantiers BTP, Agriculture, Locations |
| `crm` | CRM | CRM | Clients, Devis, Prospects |
| `stocks` | Stocks | Stocks | Articles, Mouvements, Alertes |
| `compta` | Comptabilité | Compta | Factures, Paiements, Charges |
| `reporting` | Reporting | KPI | — |

Mobile bottom-nav (5 max) : `dashboard, rh, projets, crm, compta`.

### Popover profil
Position : au-dessus du bouton avatar, `bottom-[68px]`. Largeur : déployé → `left-3 right-3` ; collapsed → `left-[60px] w-[220px]`.

Contenu :
- En-tête : nom + email (`a.kone@ekosarl.ci`), border-bottom
- Items (icon 15×15 + label, hover `bg-white/[0.06]`) :
  - **Mon profil** — icon User
  - **Aide & support** — icon Help
  - séparateur
  - **Déconnexion** — icon Logout, `text-red-300 hover:bg-red-500/10`

Comportement : ouvre/ferme au clic sur le bouton avatar. Se ferme au clic en dehors (listener `mousedown` sur document, vérifie `[data-profile-pop-b]` et `[data-profile-trigger-b]`).

### Header principal (`<header>`)
Sticky-like (à l'intérieur d'un main scrollable, donc rester en haut du main). Une seule ligne :
- **Bloc titre** (flex-1) : breadcrumb `groupe > module > sous-module` (caption 11.5px, séparateurs chevron) + H1 (22px Sora bold)
- **Champ recherche** — width `340px max-w-[40%]`, input avec icône loupe à gauche, placeholder *"Rechercher clients, chantiers, factures…"*, badge `⌘K` à droite. Focus : ring forest-500 2px.
- **Bouton cloche** — secondary button avec un dot forest-500 absolu (notification indicator)
- **Bouton "Nouveau"** — primary button forest-700, icône Plus + label

### Content
- max-width `1100px`
- vertical stack `space-y-5`
- Grille KPI : `grid-cols-2 lg:grid-cols-4 gap-3`
- Grille chart : `lg:grid-cols-3` (chart 2/3 + donut 1/3)
- Liste activité récente : carte rounded-2xl avec header et `divide-y`

Le contenu (KPIs, listes, charts) est de la donnée de démo et sera remplacé par les pages métier existantes (`Dashboard.jsx`, `EmployeList.jsx`, etc.). Seule la **coquille** (Sidebar + MainLayout + Header) est à implémenter d'après ce handoff.

---

## Écran 2 — Layout mobile (≤ 768px)

### Structure
```
[ Header noir (avatar + titre + cloche) ]
[ Search row noire ]
[ Sub-tabs pills (si module a enfants) ]
[ Content scrollable ]
[ Bottom-nav fixe 5 icônes ]
```

### Header mobile
- Background `#212121`, `px-4 py-3`
- Avatar 36×36 (clic = popover profil — même contenu que desktop)
- Titre + sous-titre (truncate)
- Cloche avec dot forest-400

### Search row
- Background `#212121`, `px-4 pb-3`
- Input pleine largeur, fond `bg-white/[0.06]`, icône loupe gauche

### Sub-tabs (conditionnel)
Visible uniquement si le module actif a des `children`. Bande blanche, overflow-x-auto, pills :
- Actif : `bg-forest-700 text-white`
- Inactif : `bg-[#f4ebe0] text-[#5d4f3a]`
- Premier pill = label parent (ex. "GRH"), suivants = enfants

### Bottom-nav
- Position en bas du conteneur, fond `#212121`, border-top
- 5 icônes flex-1 chacune, label 10px sous l'icône
- Actif : couleur `text-forest-300`, badge `bg-forest-500/15` rond derrière l'icône
- Popover profil mobile : ouvre depuis l'avatar du header, position `bottom-[72px]` au-dessus de la bottom-nav

---

## Interactions & comportements

| Interaction | Comportement |
|---|---|
| Clic module sans enfants | Navigation directe (`navigate(path)`) |
| Clic module avec enfants | Navigation vers premier enfant + ouvre le sous-menu |
| Clic chevron module | Toggle expand/collapse du sous-menu |
| Clic toggle sidebar | `collapsed ↔ !collapsed` ; sauvegarder en `localStorage` |
| Hover item collapsed | Tooltip après ~150ms (peut être instantané) |
| Clic avatar | Ouvre/ferme popover profil |
| Clic hors popover | Ferme popover |
| Mobile : tab bottom-nav | Change `active`, ferme popover si ouvert |
| Mobile : tap sub-tab | Change `active` au niveau enfant |
| `⌘K` / `Ctrl+K` | À implémenter — focus le champ recherche |
| **Déconnexion** | `useAuthStore.logout()` + `navigate('/login')` — comme dans le Sidebar actuel |

### Transitions
- Sidebar width : `transition-[width] duration-200 ease-out`
- Chevron rotate : `transition-transform` 150ms
- Hover bg : `transition-colors` 150ms

### Responsive breakpoint
- Desktop layout : ≥ 768px (md)
- Mobile layout : < 768px → bottom-nav + headers noirs
- À 1024px+ (lg) : grilles passent à 4 colonnes pour les KPIs

---

## État (state management)

```js
// Local au composant Layout
const [collapsed, setCollapsed] = useState(
  () => localStorage.getItem('eko.sidebar.collapsed') === '1'
);
useEffect(() => {
  localStorage.setItem('eko.sidebar.collapsed', collapsed ? '1' : '0');
}, [collapsed]);

const [openProfile, setOpenProfile] = useState(false);
const [openChild, setOpenChild]   = useState(null); // id du module dont le sous-menu est ouvert

// Routing
const location = useLocation();   // pour l'état actif
const navigate = useNavigate();
const { user, logout } = useAuthStore();
```

Pour le mapping `location.pathname → activeMod` : matcher par `startsWith(path)` (ex. `/rh/pointage` → module `rh`, sous-item `rh/pointage`).

---

## Mapping vers routes existantes (`App.jsx`)

| Module id | Route(s) actuelle(s) | Composant page |
|---|---|---|
| `dashboard` | `/` | `Dashboard.jsx` |
| `rh` (GRH) | `/rh`, `/rh/pointage`, `/rh/pointage-semaine` | `EmployeList`, `Pointage`, `PointageSemaine` |
| `rh/paie` | *(à créer)* | — |
| `projets` | `/projets` | `ProjetList`, `ProjetDetail`, `TacheDetail` |
| `projets/chantiers` etc. | *(filtres sur ProjetList)* | — |
| `crm` | `/crm` | `ClientList` |
| `stocks` | `/stocks` | `StockList` |
| `compta/factures` | `/comptabilite/factures` | `FactureList`, `FactureDetail` |
| `compta/charges` | `/comptabilite/charges` | `ChargeList` |
| `reporting` | `/reporting` *(à créer)* | — |

---

## SVG (icons)
Tous les icônes sont inlinés en SVG, **pas d'emoji**. Stroke 1.6, linecap/linejoin round, currentColor pour s'adapter aux états (forest-300 actif, gray-500 idle).

Liste utilisée (voir `shared.jsx` → `Icon` object) :
- Dashboard, RH, Projets, CRM, Stocks, Compta, Reporting (modules)
- Chevron, ChevronUp, ChevronDown (navigation)
- Logout, User, Help (popover profil)
- Menu, Close, Search, Bell, Plus (header & actions)
- ArrowUp, ArrowDown (trends)
- Leaf (logo eko)

À conserver tels quels, copier dans `frontend/src/components/icons.jsx` (créer un nouveau fichier).

---

## Conventions de copie / wording
- **« Mon profil »**, **« Aide & support »**, **« Déconnexion »**
- **« Nouveau »** (CTA principal)
- **« Rechercher clients, chantiers, factures… »** placeholder
- Breadcrumb : `Groupe › Module › Sous-module` (chevron 12×12)
- Avatar : initiales (2 lettres), uppercase, font-display semibold

---

## Fichiers livrés

| Fichier | Description |
|---|---|
| `EKO — Nouveau frontend.html` | Prototype démontrable des 3 directions sur un design canvas |
| `direction-b.jsx` | **Direction retenue** — composant React complet (Sidebar + Header + Layout + démos) |
| `direction-a.jsx` | Direction A (sidebar forest sombre, modules groupés) — référence, **non implémenté** |
| `direction-c.jsx` | Direction C (rail icon-only + panneau secondaire) — référence, **non implémenté** |
| `shared.jsx` | Icons SVG + structure des modules + données démo |
| `design-canvas.jsx` | Wrapper de présentation (pas à implémenter) |

### Fichiers à modifier dans le codebase
- `frontend/src/components/layout/Sidebar.jsx` — réécrire d'après direction B
- `frontend/src/components/layout/MainLayout.jsx` — ajouter Header + responsive mobile bottom-nav
- Créer `frontend/src/components/layout/Header.jsx` (séparation propre)
- Créer `frontend/src/components/layout/BottomNav.jsx` (mobile)
- Créer `frontend/src/components/icons.jsx` (extraction SVG)
- `frontend/src/index.css` — pas de changement nécessaire, les utilities Tailwind existantes suffisent

### Tailwind config
Vérifier que `tailwind.config.js` contient déjà les couleurs `forest-*` (c'est le cas). Aucune extension nécessaire.

---

## Notes finales
- Le bouton « Nouveau » du header est contextuel : son action dépend du module actif (nouvelle facture, nouveau client, nouveau chantier…). À implémenter via un dictionnaire `module → action`.
- La recherche globale est un champ avec placeholder pour l'instant ; le backend `/api/search/?q=…` n'existe pas encore — à brancher plus tard.
- Pour la **persistance de l'état collapsed**, voir bloc `useEffect` ci-dessus.
- Les sous-menus dans la sidebar restent ouverts tant qu'on est dans le module ; au changement de module, le précédent se ferme automatiquement.
