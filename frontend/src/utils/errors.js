// Transforme une erreur Axios en message lisible pour l'utilisateur.
// DRF renvoie soit { field: ["msg"] } soit { detail: "msg" } soit { non_field_errors: ["msg"] }
export function apiErrorMessage(err) {
  const data = err.response?.data
  if (!data) return 'Erreur réseau — vérifiez votre connexion.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.non_field_errors) return data.non_field_errors[0]
  const firstKey = Object.keys(data)[0]
  if (!firstKey) return 'Erreur inconnue.'
  const msg = data[firstKey]
  if (Array.isArray(msg)) return `${firstKey} : ${msg[0]}`
  return typeof msg === 'string' ? msg : 'Données invalides — vérifiez les champs.'
}
