/**
 * Placeholders shimmer pour les états de chargement.
 *
 *   <Skeleton.Line w="60%" />
 *   <Skeleton.Rect h="120px" />
 *   <Skeleton.Card />           // preset carte avec lignes
 *   <SkeletonPage />            // preset pleine page (utilisé par MainLayout)
 */
export default function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

Skeleton.Line = ({ w = '100%', h = '12px', className = '' }) => (
  <Skeleton className={className} style={{ width: w, height: h }} />
)

Skeleton.Rect = ({ w = '100%', h = '80px', className = '' }) => (
  <Skeleton
    className={`rounded-lg ${className}`}
    style={{ width: w, height: h }}
  />
)

Skeleton.Card = () => (
  <div className="card p-5">
    <div className="space-y-2.5">
      <Skeleton.Line w="35%" h="10px" />
      <Skeleton.Line w="78%" />
      <Skeleton.Line w="60%" />
    </div>
    <div className="mt-4">
      <Skeleton.Rect h="120px" />
    </div>
  </div>
)

/** Squelette page : 4 KPIs + 2 cartes. Utilisé par MainLayout en Suspense. */
export function SkeletonPage() {
  return (
    <div className="space-y-[14px]">
      <div>
        <Skeleton.Line w="180px" h="10px" />
        <div className="mt-2">
          <Skeleton.Line w="280px" h="22px" />
        </div>
      </div>
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kpi">
            <Skeleton.Line w="60%" h="10px" />
            <div className="mt-3">
              <Skeleton.Line w="40%" h="22px" />
            </div>
            <div className="mt-3">
              <Skeleton.Line w="80%" h="10px" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton.Card />
    </div>
  )
}
