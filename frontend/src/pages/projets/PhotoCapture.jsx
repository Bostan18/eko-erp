import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const MAX_SIDE = 1600
const JPEG_QUALITY = 0.7

async function compresserImage(file) {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', JPEG_QUALITY),
  )
}

function obtenirPosition() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 },
    )
  })
}

export default function PhotoCapture() {
  const { id } = useParams()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [blob, setBlob] = useState(null)
  const [gps, setGps] = useState(null)
  const [legende, setLegende] = useState('')
  const [typePhoto, setTypePhoto] = useState('avant')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // Cleanup blob URL au démontage
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  async function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    setStatus('Compression de l\'image…')
    try {
      const compressed = await compresserImage(f)
      setBlob(compressed)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(compressed))
      setStatus('Récupération de la position GPS…')
      const pos = await obtenirPosition()
      setGps(pos)
      setStatus(pos ? `GPS : ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : 'GPS indisponible (la photo sera enregistrée sans coordonnées).')
    } catch (err) {
      setError('Impossible de traiter cette image.')
      setStatus('')
    }
  }

  async function envoyer() {
    if (!blob) return
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', blob, `chantier-${Date.now()}.jpg`)
      fd.append('prise_le', new Date().toISOString())
      fd.append('type_photo', typePhoto)
      if (legende) fd.append('legende', legende)
      if (gps) {
        fd.append('latitude', gps.lat.toFixed(6))
        fd.append('longitude', gps.lng.toFixed(6))
      }
      const { data } = await api.post(`/projets/projets/${id}/photos/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data?.offline) {
        setStatus('Photo enregistrée, sera envoyée au retour du réseau.')
      } else {
        setStatus('Photo enregistrée avec succès.')
      }
      setTimeout(() => navigate(`/projets/${id}`), 1500)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Échec de l\'envoi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-sm font-body text-[#A59F9B]">
        <Link to={`/projets/${id}`} className="hover:text-forest-700">Projet</Link>
        <span>/</span>
        <span className="text-[#1C1817]">Nouvelle photo</span>
      </div>

      <h1 className="font-display font-bold text-[#1C1817] text-[22px]">Photo géolocalisée</h1>

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full min-h-[120px] rounded-2xl bg-forest-700 text-white font-display font-medium text-[16px] flex flex-col items-center justify-center gap-2 active:bg-forest-800"
        >
          <span className="text-3xl">📷</span>
          Prendre une photo
        </button>
      ) : (
        <div className="rounded-2xl overflow-hidden ring-1 ring-[#ece2d3] bg-black">
          <img src={previewUrl} alt="Aperçu" className="w-full max-h-[360px] object-contain" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
        aria-label="Sélection ou capture d'une photo de chantier"
      />

      {previewUrl && (
        <>
          <div>
            <label className="block font-display text-[12px] font-medium text-[#1C1817] mb-1">Type</label>
            <select
              value={typePhoto}
              onChange={(e) => setTypePhoto(e.target.value)}
              className="input min-h-[44px]"
            >
              <option value="avant">Avant chantier</option>
              <option value="apres">Après chantier</option>
              <option value="incident">Incident</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block font-display text-[12px] font-medium text-[#1C1817] mb-1">Légende</label>
            <input
              className="input min-h-[44px]"
              value={legende}
              onChange={(e) => setLegende(e.target.value)}
              placeholder="Décrivez ce que montre la photo"
              maxLength={200}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setBlob(null); setPreviewUrl(null); setStatus('') }}
              className="flex-1 min-h-[48px] bg-[#f4ebe0] text-[#5d4f3a] rounded-lg px-4 font-display font-medium"
            >
              Reprendre
            </button>
            <button
              onClick={envoyer}
              disabled={saving}
              className="flex-1 min-h-[48px] bg-forest-700 text-white rounded-lg px-4 font-display font-medium active:bg-forest-800 disabled:opacity-60"
            >
              {saving ? 'Envoi…' : 'Valider'}
            </button>
          </div>
        </>
      )}

      {status && <p className="text-[13px] font-body text-[#5d4f3a]">{status}</p>}
      {error  && <p className="text-[13px] font-body text-red-600">{error}</p>}
    </div>
  )
}
