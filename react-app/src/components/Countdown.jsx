import { useEffect, useRef, useState } from 'react'
import './countdown.css'

const TARGET = new Date('2026-09-13T00:00:00').getTime()

function differenceText(target) {
  const diff = target - Date.now()
  const total = Math.max(0, Math.floor(diff / 1000))
  return {
    days: String(Math.floor(total / 86400)).padStart(2, '0'),
    hours: String(Math.floor((total % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    seconds: String(total % 60).padStart(2, '0'),
    done: total === 0,
  }
}

function Unit({ value, label }) {
  return (
    <div className="countdown__unit">
      <div className="countdown__card">
        <span className="countdown__num" key={value}>{value}</span>
      </div>
      <span className="countdown__label">{label}</span>
    </div>
  )
}

export default function Countdown({ onHome }) {
  const [parts, setParts] = useState(() => differenceText(TARGET))
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setParts(differenceText(TARGET))
    }, 1000)
    return () => window.clearInterval(intervalRef.current)
  }, [])

  return (
    <main className="countdown-page">
      <div className="countdown__bg" aria-hidden="true" />
      <div className="countdown__scrim" aria-hidden="true" />
      <div className="countdown__mist" aria-hidden="true" />
      <div className="countdown__glow" aria-hidden="true" />

      <header className="countdown__topbar">
        <img
          className="countdown__logo"
          src="/logo-assets/Turfon24_Horizontal_Logo_with_Tagline.png"
          alt="TurfOn24"
          width="420"
          height="132"
        />
        {onHome && (
          <button type="button" className="countdown__home" onClick={onHome} aria-label="Go to home">
            <span className="countdown__home-arrow" aria-hidden="true">&larr;</span>
            <span>Home</span>
          </button>
        )}
      </header>

      <div className="countdown__content">
        <div className="countdown__inner">
          <p className="countdown__eyebrow">&#8226; Opening Soon</p>

          {parts.done ? (
            <p className="countdown__live" role="status">We&rsquo;re Live</p>
          ) : (
            <>
              <h1 className="countdown__title">
                We&rsquo;re<span aria-hidden="true"><br /></span>Opening Soon
              </h1>

              <p className="countdown__tagline">Your Turf. Your Time. Your Game.</p>

              <p className="countdown__grand-label">Grand Opening</p>
              <p className="countdown__date">13 September 2026</p>

              <p className="countdown__desc">
                The wait is almost over.<br />
                Get ready to play, compete, and make your game count.
              </p>

              <div className="countdown__timer" role="timer" aria-live="off">
                <Unit value={parts.days} label="Days" />
                <Unit value={parts.hours} label="Hours" />
                <Unit value={parts.minutes} label="Minutes" />
                <Unit value={parts.seconds} label="Seconds" />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
