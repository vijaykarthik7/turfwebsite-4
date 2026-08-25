import { useEffect } from 'react'
import taglineLogo from './assets/Tagline.png'
import './App.css'

function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const pageTitle = isAdmin ? 'TurfOn24 Admin' : 'TurfOn24'
  const pageUrl = `${import.meta.env.BASE_URL}legacy/${isAdmin ? 'admin' : 'index'}.html`

  useEffect(() => {
    document.title = pageTitle
  }, [pageTitle])

  const replaceNavigationLogo = (event) => {
    const pageDocument = event.currentTarget.contentDocument
    const navigationLogo = pageDocument?.querySelector('#nav .official-logo')
    if (navigationLogo) {
      navigationLogo.src = taglineLogo
    }

    const assistantLogo = pageDocument?.querySelector('.comm-fab img')
    const assistantHeaderLogo = pageDocument?.querySelector('.comm-head-avatar img')
    if (assistantLogo) assistantLogo.src = '/logo-assets/Logo.png'
    if (assistantHeaderLogo) assistantHeaderLogo.src = '/logo-assets/Logo.png'

    if (navigationLogo) return

    const adminBranding = pageDocument?.querySelectorAll('.vlogo, .side-head')
    if (adminBranding?.length) {
      const style = pageDocument.createElement('style')
      style.textContent = '.vlogo .admin-tagline-logo{width:210px;height:auto;display:block}.side-head .admin-tagline-logo{height:44px;width:auto;display:block}.sidebar.collapsed .side-head .admin-tagline-logo{display:none}.login-card .login-tagline-logo{width:210px;height:auto;display:block;margin-bottom:28px}.side-foot .admin-profile{display:flex;align-items:center;gap:10px;width:100%;padding:6px 10px;border:1px solid rgba(57,255,122,0.12);border-radius:28px;background:rgba(255,255,255,0.025)}.side-foot .admin-profile-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--emerald));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}.side-foot .admin-profile-email{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sidebar.collapsed .side-foot .admin-profile{justify-content:center;padding:6px}.sidebar.collapsed .side-foot .admin-profile-email{display:none}'
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
        footer.innerHTML = '<div class="admin-profile"><div class="admin-profile-avatar">T</div><div class="admin-profile-email">admin@gmail.com</div></div>'
      }
    }
  }

  return (
    <main className="legacy-shell">
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
