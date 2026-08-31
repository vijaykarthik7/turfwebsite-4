import './loading-radar.css'

function LoadingRadar() {
  return (
    <div className="loading-radar" aria-label="Loading TurfOn24" role="status">
      <div className="loading-radar__ring loading-radar__ring--inner" />
      <div className="loading-radar__center" />
      <span className="loading-radar__sweep" aria-hidden="true">
        <span className="loading-radar__glow" />
      </span>
    </div>
  )
}

export default LoadingRadar
