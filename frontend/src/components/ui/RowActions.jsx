import { IconEye, IconPencil, IconTrash } from './Icons'

/**
 * Boutons d'actions standard pour une ligne de tableau (voir / éditer / supprimer).
 *
 * Chaque action est rendue uniquement si son callback est fourni.
 * Un *DisabledReason* (string) désactive l'action et sert de tooltip explicatif
 * (ex: facture certifiée FNE → suppression interdite).
 *
 *   <RowActions
 *     onView={() => navigate(`/comptabilite/factures/${f.id}`)}
 *     onEdit={() => setEditing(f)}
 *     onDelete={() => setDeleting(f)}
 *     editDisabledReason={f.est_verrouillee ? 'Facture certifiée FNE — verrouillée' : null}
 *     deleteDisabledReason={f.est_verrouillee ? 'Facture certifiée FNE — verrouillée' : null}
 *   />
 *
 * `stopPropagation` sur chaque bouton pour éviter de déclencher un éventuel
 * onClick parent (ex : si la ligne entière devient cliquable un jour).
 */
export default function RowActions({
  onView,
  onEdit,
  onDelete,
  editDisabledReason,
  deleteDisabledReason,
}) {
  return (
    <div className="flex items-center gap-0.5 justify-end">
      {onView && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView() }}
          aria-label="Voir le détail"
          title="Voir le détail"
          className="row-action"
        >
          <IconEye className="w-3.5 h-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!editDisabledReason) onEdit() }}
          aria-label="Modifier"
          title={editDisabledReason || 'Modifier'}
          disabled={!!editDisabledReason}
          className="row-action"
        >
          <IconPencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!deleteDisabledReason) onDelete() }}
          aria-label="Supprimer"
          title={deleteDisabledReason || 'Supprimer'}
          disabled={!!deleteDisabledReason}
          className="row-action row-action-danger"
        >
          <IconTrash className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
