import { useState, useEffect } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { fmt, today } from '../../utils/format'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const LIGNE_INIT = { designation: '', quantite: '1', prix_unitaire: '' }

function validate(form, lignes) {
  if (!form.numero.trim()) return 'Le numéro de facture est requis.'
  if (!form.client) return 'Veuillez sélectionner un client.'
  if (!form.date_echeance) return "La date d'échéance est requise."
  if (form.date_echeance < form.date_emission) return "La date d'échéance doit être postérieure à la date d'émission."
  const lignesValides = lignes.filter((l) => l.designation && l.prix_unitaire)
  if (lignesValides.length === 0) return 'Ajoutez au moins une ligne de facturation avec désignation et prix.'
  return null
}

export default function FactureForm({ initial, onSuccess, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm]       = useState({
    numero:         initial?.numero_local ?? initial?.numero ?? '',
    client:         String(initial?.client ?? ''),
    projet:         String(initial?.projet ?? ''),
    taux_tva:       String(initial?.taux_tva ?? '18'),
    date_emission:  initial?.date_emission ?? today(),
    date_echeance:  initial?.date_echeance ?? '',
    notes:          initial?.notes ?? '',
    mode_reglement: initial?.mode_reglement ?? 'cash',
    template_fne:   initial?.template_fne ?? 'B2B',
    centre_cout:    String(initial?.centre_cout ?? ''),
  })
  const [lignes, setLignes]   = useState([{ ...LIGNE_INIT }])
  const [clients, setClients] = useState([])
  const [projets, setProjets] = useState([])
  const [centres, setCentres] = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/crm/clients/').then(({ data }) => setClients(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
    api.get('/core/centres-cout/?actif=true').then(({ data }) => setCentres(data.results ?? data))
    if (isEdit) {
      // Charge les lignes existantes pour les afficher en lecture seule.
      // L'édition fine des lignes se fait depuis FactureDetail (TODO).
      api.get(`/comptabilite/lignes/?facture=${initial.id}`)
        .then(({ data }) => {
          const items = data.results ?? data
          if (items.length > 0) {
            setLignes(items.map((l) => ({
              designation: l.designation,
              quantite: String(l.quantite),
              prix_unitaire: String(l.prix_unitaire),
            })))
          }
        })
        .catch(() => {})
    }
  }, [isEdit, initial?.id])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function setLigne(idx, field, value) {
    setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }
  function ajouterLigne() { setLignes((prev) => [...prev, { ...LIGNE_INIT }]) }
  function supprimerLigne(idx) { setLignes((prev) => prev.filter((_, i) => i !== idx)) }

  const clientSelectionne = clients.find((c) => String(c.id) === String(form.client))
  const montantHT  = lignes.reduce((s, l) => s + (Number(l.quantite) * Number(l.prix_unitaire || 0)), 0)
  const montantTVA = montantHT * Number(form.taux_tva) / 100
  const montantTTC = montantHT + montantTVA

  async function handleSubmit(e) {
    e.preventDefault()
    // En mode édition, les lignes sont en lecture seule — on ne valide
    // que les champs de la facture.
    const validErr = isEdit ? validate(form, [{ designation: 'ok', prix_unitaire: '1' }]) : validate(form, lignes)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        client: form.client || null,
        projet: form.projet || null,
        centre_cout: form.centre_cout || null,
        montant_ht: montantHT,
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
        date_echeance: form.date_echeance || null,
      }
      if (isEdit) {
        // PATCH la facture — les lignes ne sont pas touchées ici.
        await api.patch(`/comptabilite/factures/${initial.id}/`, payload)
      } else {
        const { data: facture } = await api.post('/comptabilite/factures/', payload)
        await Promise.all(
          lignes
            .filter((l) => l.designation && l.prix_unitaire)
            .map((l) => api.post('/comptabilite/lignes/', {
              facture: facture.id,
              designation: l.designation,
              quantite: l.quantite,
              prix_unitaire: l.prix_unitaire,
            }))
        )
      }
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert-red mb-5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          {error}
        </div>
      )}

      <FormSection titre="Identification">
        <FormRow cols={2}>
          <Field label="Numéro" required hint={isEdit ? 'Le numéro ne peut pas être modifié après création.' : null}>
            <input className="input" placeholder="FAC-001" value={form.numero}
              onChange={(e) => set('numero', e.target.value.toUpperCase())}
              readOnly={isEdit}
              disabled={isEdit} />
          </Field>
          <Field label="TVA (%)" hint="Par défaut : 18 % en CI">
            <input type="number" min="0" max="100" step="0.5" className="input" value={form.taux_tva}
              onChange={(e) => set('taux_tva', e.target.value)} />
          </Field>
        </FormRow>
        <Field label="Client" required>
          <select className="input" value={form.client} onChange={(e) => set('client', e.target.value)}>
            <option value="">— Choisir un client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Field>
        <Field label="Projet (optionnel)">
          <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
            <option value="">— Sans projet —</option>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
          </select>
        </Field>
      </FormSection>

      <FormSection titre="Dates">
        <FormRow cols={2}>
          <Field label="Date d'émission" required>
            <input type="date" className="input" value={form.date_emission}
              onChange={(e) => set('date_emission', e.target.value)} />
          </Field>
          <Field label="Date d'échéance" required>
            <input type="date" className="input" value={form.date_echeance}
              min={form.date_emission || undefined}
              onChange={(e) => set('date_echeance', e.target.value)} />
          </Field>
        </FormRow>
      </FormSection>

      <FormSection titre="Facturation FNE">
        <FormRow cols={2}>
          <Field label="Type de facturation" hint="B2B/B2G : NCC client requis">
            <select className="input" value={form.template_fne} onChange={(e) => set('template_fne', e.target.value)}>
              <option value="B2B">B2B — Entreprise</option>
              <option value="B2C">B2C — Particulier</option>
              <option value="B2G">B2G — Administration</option>
              <option value="B2F">B2F — International</option>
            </select>
          </Field>
          <Field label="Mode de règlement">
            <select className="input" value={form.mode_reglement} onChange={(e) => set('mode_reglement', e.target.value)}>
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="check">Chèque</option>
              <option value="mobile-money">Mobile Money</option>
              <option value="transfer">Virement</option>
              <option value="deferred">Différé</option>
            </select>
          </Field>
        </FormRow>
        <Field label="Centre de coût" hint="Ventilation analytique (optionnel)">
          <select className="input" value={form.centre_cout} onChange={(e) => set('centre_cout', e.target.value)}>
            <option value="">— Aucun —</option>
            {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </Field>
        {clientSelectionne && ['B2B', 'B2G'].includes(form.template_fne) && (
          <p className={`text-[11.5px] mt-1 ${clientSelectionne.ncc ? 'text-forest-700' : 'text-gold-700'}`}>
            {clientSelectionne.ncc
              ? `NCC client : ${clientSelectionne.ncc}`
              : '⚠ Ce client n’a pas de NCC — requis pour la certification FNE B2B/B2G.'}
          </p>
        )}
      </FormSection>

      {/* Lignes de facturation — pattern « line table » de la maquette */}
      <FormSection titre="Lignes de facturation">
        {isEdit && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-sand-50 border border-sand-200 text-[11.5px] text-sand-700 font-body">
            ℹ Les lignes ne sont pas modifiables ici. Utilisez la page « Détail » de la facture pour les ajuster.
          </div>
        )}
        <div className="rounded-lg border border-sand-200 overflow-hidden bg-white">
          <div
            className="grid gap-2 px-3 py-2 bg-sand-50 border-b border-sand-200
                       font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500 font-medium"
            style={{ gridTemplateColumns: '2.2fr 0.7fr 1fr 0.9fr 24px' }}
          >
            <span>Désignation</span>
            <span className="text-center">Qté</span>
            <span>Prix unit.</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>
          <div className="divide-y divide-sand-100">
            {lignes.map((ligne, idx) => (
              <div
                key={idx}
                className="grid gap-2 px-3 py-2 items-center"
                style={{ gridTemplateColumns: '2.2fr 0.7fr 1fr 0.9fr 24px' }}
              >
                <input
                  className="input input-sm"
                  placeholder="Désignation…"
                  value={ligne.designation}
                  onChange={(e) => setLigne(idx, 'designation', e.target.value)}
                  readOnly={isEdit}
                  disabled={isEdit}
                />
                <input
                  type="number" min="0.01" step="0.01"
                  className="input input-sm text-center"
                  placeholder="Qté"
                  value={ligne.quantite}
                  onChange={(e) => setLigne(idx, 'quantite', e.target.value)}
                  readOnly={isEdit}
                  disabled={isEdit}
                />
                <input
                  type="number" min="0" step="1"
                  className="input input-sm"
                  placeholder="Prix"
                  value={ligne.prix_unitaire}
                  onChange={(e) => setLigne(idx, 'prix_unitaire', e.target.value)}
                  readOnly={isEdit}
                  disabled={isEdit}
                />
                <span className="font-display text-[12.5px] font-semibold text-ink text-right">
                  {fmt(Number(ligne.quantite) * Number(ligne.prix_unitaire || 0))} <span className="text-[10px] font-normal text-sand-500">F</span>
                </span>
                {!isEdit && lignes.length > 1 ? (
                  <button
                    type="button" onClick={() => supprimerLigne(idx)}
                    className="w-[22px] h-[22px] rounded text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 flex items-center justify-center transition"
                    aria-label="Supprimer la ligne"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                ) : <span />}
              </div>
            ))}
          </div>
        </div>
        {!isEdit && (
          <button
            type="button" onClick={ajouterLigne}
            className="mt-2 text-[12px] font-display font-medium text-forest-700 hover:text-forest-900"
          >+ Ajouter une ligne</button>
        )}
      </FormSection>

      {/* Totaux — bandeau sombre comme dans la maquette */}
      <div className="rounded-lg bg-forest-950 px-4 py-3 mt-2">
        <div className="flex justify-between text-[12.5px] text-forest-200 mb-1">
          <span>Montant HT</span>
          <span className="font-mono">{fmt(montantHT)} F</span>
        </div>
        <div className="flex justify-between text-[12.5px] text-forest-200 mb-1">
          <span>TVA ({form.taux_tva}%)</span>
          <span className="font-mono">{fmt(montantTVA)} F</span>
        </div>
        <div className="flex justify-between font-display font-bold text-white text-[15px] pt-2 mt-1 border-t border-forest-800">
          <span>Total TTC</span>
          <span>{fmt(montantTTC)} F</span>
        </div>
      </div>

      <FormSection titre="Notes (interne)">
        <Field label="Notes">
          <textarea className="input resize-none" rows={2} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </FormSection>

      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour' : 'Créer la facture')}
        </button>
      </ModalFooter>
    </form>
  )
}
