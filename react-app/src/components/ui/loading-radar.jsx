import './loading-radar.css'

function LoadingRadar() {
  return (
    <>
      <div className="loading-stadium" aria-hidden="true">
        <div className="loading-stadium__stand loading-stadium__stand--left" />
        <div className="loading-stadium__stand loading-stadium__stand--right" />
        <div className="loading-tower loading-tower--left">
          <div className="loading-tower__mast" />
          <div className="loading-tower__brace" />
          <div className="loading-lights loading-lights--left">
            {Array.from({ length: 24 }, (_, index) => <span key={index} />)}
          </div>
        </div>
        <div className="loading-tower loading-tower--right">
          <div className="loading-tower__mast" />
          <div className="loading-tower__brace" />
          <div className="loading-lights loading-lights--right">
            {Array.from({ length: 24 }, (_, index) => <span key={index} />)}
          </div>
        </div>
        <div className="loading-particles">
          {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
        </div>
        <div className="loading-hexes">
          <span className="loading-hex loading-hex--one" />
          <span className="loading-hex loading-hex--two" />
          <span className="loading-hex loading-hex--three" />
          <span className="loading-hex loading-hex--four" />
        </div>
        <div className="loading-floor" />
      </div>
      <div className="loading-radar" aria-label="Loading TurfOn24" role="status">
        <div className="loading-radar__outer-ring" />
        <div className="loading-radar__inner-ring" />
        <div className="loading-radar__center" />
        <span className="loading-radar__sweep">
          <span className="loading-radar__glow" />
        </span>
      </div>
    </>
  )
}

export default LoadingRadar