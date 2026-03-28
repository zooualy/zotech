// ===== MENU MOBILE =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu')
    if (!menu) return
    menu.classList.toggle('ouvert')
    document.body.classList.toggle('menu-ouvert', menu.classList.contains('ouvert'))
    mettreAJourMenuMobile()
}

function fermerMobileMenu() {
    const menu = document.getElementById('mobile-menu')
    if (menu) menu.classList.remove('ouvert')
    document.body.classList.remove('menu-ouvert')
}

async function mettreAJourMenuMobile() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null

    const menuDeconnexion = document.getElementById('menu-mobile-deconnexion')
    if (!menuDeconnexion) return

    if (utilisateur) {
        menuDeconnexion.style.display = 'flex'
    } else {
        menuDeconnexion.style.display = 'none'
    }
}

window.addEventListener('load', mettreAJourMenuMobile)