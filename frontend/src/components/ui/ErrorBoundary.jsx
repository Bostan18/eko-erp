import { Component } from 'react'

/**
 * ErrorBoundary — capture les erreurs JS dans les pages lazy-loadées
 * pour éviter qu'un crash unique ne tombe le layout entier (sidebar perdue,
 * besoin de F5). Le parent passe `key={pathname}` pour reset au changement
 * de route.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] page crash:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="card p-8 max-w-lg mx-auto mt-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-display font-semibold text-[16px] text-ink mb-1.5">
          Cette page a rencontré une erreur
        </h2>
        <p className="font-body text-[12.5px] text-sand-600 mb-5">
          La navigation reste fonctionnelle — choisissez un autre module dans le menu
          ou rechargez la page.
        </p>
        <pre className="font-mono text-[10.5px] text-sand-500 bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 mb-5 text-left overflow-x-auto whitespace-pre-wrap">
          {this.state.error.message || String(this.state.error)}
        </pre>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="btn-secondary"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
