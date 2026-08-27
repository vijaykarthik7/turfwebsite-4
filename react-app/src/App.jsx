import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import taglineLogo from './assets/Tagline.png'
import LoadingRadar from './components/ui/loading-radar'
import './App.css'

window.renderPaymentQr = (image, status, uri) => QRCode.toDataURL(uri, { width: 320, margin: 2, errorCorrectionLevel: 'M' }).then((dataUrl) => {
  image.src = dataUrl
  image.style.display = 'block'
  status.style.display = 'none'
})

const OPENING_DATE = '2026-09-13T00:00:00+05:30'

function getCountdown() {
  const remaining = Math.max(0, Date.parse(OPENING_DATE) - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isOpen: remaining === 0,
  }
}

function LaunchPage({ onExplore }) {
  const [countdown, setCountdown] = useState(getCountdown)

  useEffect(() => {
    const updateCountdown = () => setCountdown(getCountdown())
    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="launch-page">
      <div className="launch-grid" aria-hidden="true" />
      <div className="launch-light launch-light--one" aria-hidden="true" />
      <div className="launch-light launch-light--two" aria-hidden="true" />
      <header className="launch-header">
        <img src={taglineLogo} alt="TurfOn24" className="launch-logo" />
      </header>
      <main className="launch-content">
        <div className="launch-eyebrow"><span aria-hidden="true">●</span> {countdown.isOpen ? 'NOW OPEN' : 'OPENING SOON'}</div>
        <h1>{countdown.isOpen ? "WE'RE OPEN" : "WE'RE OPENING SOON"}</h1>
        <p className="launch-tagline">YOUR TURF. YOUR TIME. YOUR GAME.</p>
        <div className="launch-date"><span>GRAND OPENING</span><strong>13 SEPTEMBER 2026</strong></div>
        {countdown.isOpen ? (
          <p className="launch-message">The wait is over. TurfOn24 is now open and ready for the game.</p>
        ) : (
          <>
            <p className="launch-message">The wait is almost over.<br />Get ready to play, compete, and make your game count.</p>
            <div className="countdown-grid" aria-label="Countdown to the TurfOn24 opening" aria-live="polite">
              {[
                ['days', 'DAYS', countdown.days],
                ['hours', 'HOURS', countdown.hours],
                ['minutes', 'MINUTES', countdown.minutes],
                ['seconds', 'SECONDS', countdown.seconds],
              ].map(([key, label, value]) => (
                <div className="countdown-card" key={key}>
                  <strong>{key === 'days' ? value : String(value).padStart(2, '0')}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="launch-cta" type="button" onClick={onExplore}>{countdown.isOpen ? 'Book your slot' : 'Explore TurfOn24'}<span aria-hidden="true">→</span></button>
      </main>
      <footer className="launch-footer"><span>ASIA / KOLKATA</span><span>TURFON24 · CUDDALORE</span></footer>
    </div>
  )
}

function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const [showLegacy, setShowLegacy] = useState(isAdmin)
  const [isLoading, setIsLoading] = useState(!isAdmin)
  const pageTitle = isAdmin ? 'TurfOn24 Admin' : (!showLegacy ? 'TurfOn24 — Opening Soon' : 'TurfOn24')
  const pageUrl = `${import.meta.env.BASE_URL}legacy/${isAdmin ? 'admin' : 'index'}.html`

  useEffect(() => {
    document.title = pageTitle
  }, [pageTitle])

  useEffect(() => {
    if (isAdmin || !showLegacy) return undefined
    const loadingTimer = window.setTimeout(() => setIsLoading(false), 1800)
    return () => window.clearTimeout(loadingTimer)
  }, [isAdmin, showLegacy])

  useEffect(() => {
    if (!isAdmin) return undefined
    const handleProfilePictureUpdate = (event) => {
      if (event.data?.type !== 'turfon24-profile-picture') return
      const avatar = document.querySelector('.legacy-page')?.contentDocument?.querySelector('.admin-profile-avatar')
      if (avatar) avatar.src = event.data.source
    }
    window.addEventListener('message', handleProfilePictureUpdate)
    return () => window.removeEventListener('message', handleProfilePictureUpdate)
  }, [isAdmin])

  const replaceNavigationLogo = (event) => {
    const pageDocument = event.currentTarget.contentDocument
    const navigationLogo = pageDocument?.querySelector('#nav .official-logo')
    if (navigationLogo) {
      navigationLogo.src = taglineLogo
    }

    const footerLogo = pageDocument?.querySelector('footer .official-logo')
    if (footerLogo) {
      footerLogo.src = taglineLogo
    }

    const assistantLogo = pageDocument?.querySelector('.comm-fab img')
    const assistantHeaderLogo = pageDocument?.querySelector('.comm-head-avatar img')
    if (assistantLogo) assistantLogo.src = '/logo-assets/Logo.png'
    if (assistantHeaderLogo) assistantHeaderLogo.src = '/logo-assets/Logo.png'

    if (navigationLogo) return

    const adminBranding = pageDocument?.querySelectorAll('.vlogo, .side-head')
    if (adminBranding?.length) {
      const style = pageDocument.createElement('style')
      style.textContent = '.vlogo .admin-tagline-logo{width:210px;height:auto;display:block}.side-head .admin-tagline-logo{height:52px;width:auto;display:block;margin:0 auto}.sidebar.collapsed .side-head .admin-tagline-logo{display:none}.login-card .login-tagline-logo{width:210px;height:auto;display:block;margin-bottom:28px}.side-foot .admin-profile{display:flex;align-items:center;gap:10px;width:100%;padding:6px 10px;border:1px solid rgba(57,255,122,0.12);border-radius:28px;background:rgba(255,255,255,0.025)}.side-foot .admin-profile-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0}.side-foot .admin-profile-email{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sidebar.collapsed .side-foot .admin-profile{justify-content:center;padding:6px}.sidebar.collapsed .side-foot .admin-profile-email{display:none}'
      pageDocument.head.appendChild(style)
      adminBranding.forEach((branding) => {
        if (!branding.querySelector('.admin-tagline-logo')) {
          branding.innerHTML = `<img class="admin-tagline-logo" src="${taglineLogo}" alt="TurfOn24" />`
        }
      })

      const loginCard = pageDocument.querySelector('.login-card')
      if (loginCard && !loginCard.querySelector('.login-tagline-logo')) {
        const loginLogo = pageDocument.createElement('img')
        loginLogo.className = 'login-tagline-logo'
        loginLogo.src = taglineLogo
        loginLogo.alt = 'TurfOn24'
        loginCard.prepend(loginLogo)
      }

      const footerAvatar = pageDocument.querySelector('.side-foot .avatar')
      const footer = pageDocument.querySelector('.side-foot')
      if (footer && footerAvatar && !footer.querySelector('.admin-profile')) {
        const profilePicture = window.localStorage.getItem('turfon24-admin-profile-picture') || '/logo-assets/Turfon24_Logo_Mark.png'
        footer.innerHTML = `<div class="admin-profile"><img class="admin-profile-avatar" src="${profilePicture}" alt="TurfOn24" /><div class="admin-profile-email">ask@turfon24.com</div></div>`
      }
    }
  }

  if (!isAdmin && !showLegacy) return <LaunchPage onExplore={() => setShowLegacy(true)} />

  return (
    <main className="legacy-shell">
      {!isAdmin && (
        <div className={`loading-screen${isLoading ? '' : ' loading-screen--hidden'}`}>
          <LoadingRadar />
          <div className="loading-screen__brand">
            <img className="loading-screen__tagline" src={taglineLogo} alt="TurfOn24" />
          </div>
        </div>
      )}
      <iframe
        key={pageUrl}
        className="legacy-page"
        src={pageUrl}
        title={pageTitle}
        onLoad={replaceNavigationLogo}
      />
    </main>
  )
}

export default App
