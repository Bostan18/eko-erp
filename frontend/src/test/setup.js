// Polyfills pour exécuter les modules offline (Dexie, axios, navigator.onLine, window.events)
import 'fake-indexeddb/auto'

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

// Permet d'écouter les CustomEvent sans devoir charger jsdom (axios + dexie
// se contentent d'un window minimal). Vitest expose déjà globalThis.window
// si environment='happy-dom' ou 'jsdom' ; ici on bricole un mini-EventTarget.
if (typeof globalThis.window === 'undefined') {
  const target = new EventTarget()
  globalThis.window = target
  globalThis.window.addEventListener = target.addEventListener.bind(target)
  globalThis.window.removeEventListener = target.removeEventListener.bind(target)
  globalThis.window.dispatchEvent = target.dispatchEvent.bind(target)
  globalThis.CustomEvent = globalThis.CustomEvent ?? class extends Event {
    constructor(name, init = {}) {
      super(name, init)
      this.detail = init.detail
    }
  }
}

// navigator.onLine mutable pour simuler online/offline
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = {}
}
let __online = true
Object.defineProperty(globalThis.navigator, 'onLine', {
  configurable: true,
  get: () => __online,
})
globalThis.__setOnline = (v) => { __online = !!v }
