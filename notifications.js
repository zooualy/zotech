// ===== NOTIFICATIONS =====
let notificationsOuvert = false
let ongletNotifActuel = 'tous'

// ===== INITIALISER =====
async function initialiserNotifications() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null
    if (!utilisateur) return

    const wrapper = document.getElementById('nav-notif-wrapper')
    if (wrapper) wrapper.style.display = 'block'

    await chargerNotifications(utilisateur.id)
}

// ===== CHARGER =====
async function chargerNotifications(userId) {
    const { data: notifs } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (!notifs) return

    // Badge
    const nonLues = notifs.filter(n => !n.lu).length
    const badge = document.getElementById('notif-badge')
    if (badge) {
        if (nonLues > 0) {
            badge.textContent = nonLues > 9 ? '9+' : nonLues
            badge.style.display = 'flex'
        } else {
            badge.style.display = 'none'
        }
    }

    afficherNotifications(notifs)
}

// ===== AFFICHER =====
async function afficherNotifications(notifs) {
    const liste = document.getElementById('notif-liste')
    if (!liste) return

    // Récupérer photos des expéditeurs
    const expediteurIds = [...new Set(notifs.filter(n => n.expediteur_id).map(n => n.expediteur_id))]
    let photosExpéditeurs = {}

    if (expediteurIds.length > 0) {
        const { data: profils } = await supabaseClient
            .from('profils')
            .select('user_id, photo_profil, pseudo, username')
            .in('user_id', expediteurIds)
        if (profils) profils.forEach(p => photosExpéditeurs[p.user_id] = p)
    }

    // Filtrer selon onglet
    let notifsFiltrees = notifs
    if (ongletNotifActuel === 'likes') {
        notifsFiltrees = notifs.filter(n => n.type === 'like')
    } else if (ongletNotifActuel === 'commentaires') {
        notifsFiltrees = notifs.filter(n => n.type === 'commentaire')
    } else if (ongletNotifActuel === 'favoris') {
        notifsFiltrees = notifs.filter(n => n.type === 'favori')
   } else if (ongletNotifActuel === 'abonnements') {
        notifsFiltrees = notifs.filter(n => n.type === 'abonnement')
    } else if (ongletNotifActuel === 'tags') {
        notifsFiltrees = notifs.filter(n => n.type === 'tag')
    }

    if (notifsFiltrees.length === 0) {
        liste.innerHTML = `
            <div class="notif-vide">
                <div style="font-size:2rem;">🔔</div>
                <p>Aucune notification</p>
            </div>
        `
        return
    }

    liste.innerHTML = notifsFiltrees.map(n => {
        const expediteur = photosExpéditeurs[n.expediteur_id]
        const photoHtml = expediteur?.photo_profil
            ? `<img src="${expediteur.photo_profil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : (expediteur?.pseudo || '?').charAt(0).toUpperCase()
        const bgAvatar = expediteur?.photo_profil ? 'background:none;' : ''

        const icone = n.type === 'like' ? '❤️' :
                      n.type === 'commentaire' ? '💬' :
                      n.type === 'favori' ? '🔖' :
                      n.type === 'abonnement' ? '👤' :
                      n.type === 'tag' ? '🏷️' : '🔔'

        const date = new Date(n.created_at)
        const maintenant = new Date()
        const diff = Math.floor((maintenant - date) / 1000 / 60)
        const dateStr = diff < 1 ? 'À l\'instant' :
                        diff < 60 ? `il y a ${diff} min` :
                        diff < 1440 ? `il y a ${Math.floor(diff/60)}h` :
                        date.toLocaleDateString('fr-FR')
return `
            <div class="notif-item ${n.lu ? '' : 'non-lu'}" data-type="${n.type}"
                onclick="clicNotification('${n.id}', '${n.lien || ''}')">
                ${!n.lu ? '<div class="notif-point"></div>' : ''}
                <a href="profil.html?u=${expediteur?.username || ''}" 
                    onclick="event.stopPropagation()"
                    style="text-decoration:none;">
                    <div class="notif-avatar" style="${bgAvatar}">
                        ${photoHtml}
                        <span class="notif-type-icone">${icone}</span>
                    </div>
                </a>
                <div class="notif-texte">
                    <p><strong>${expediteur?.pseudo || 'Quelqu\'un'}</strong> ${getNomAction(n.type)} <strong>${getTitreArticle(n.message)}</strong></p>
                    <span>${dateStr}</span>
                </div>
            </div>
        `
    }).join('')
}

function getNomAction(type) {
    if (type === 'like') return 'a aimé ton article'
    if (type === 'commentaire') return 'a commenté ton article'
    if (type === 'favori') return 'a mis en favori ton article'
    if (type === 'abonnement') return 's\'est abonné à toi'
    return 'a interagi avec toi'
}

function getTitreArticle(message) {
    const match = message.match(/"([^"]+)"/)
    return match ? match[1] : ''
}

// ===== ONGLETS =====
function changerOngletNotif(onglet) {
    ongletNotifActuel = onglet

    document.querySelectorAll('.notif-onglet').forEach(o => o.classList.remove('active'))
    document.getElementById(`notif-onglet-${onglet}`).classList.add('active')

    // Recharger
    supabaseClient.auth.getSession().then(({ data: sessionData }) => {
        const userId = sessionData.session?.user?.id
        if (userId) chargerNotifications(userId)
    })
}

// ===== TOGGLE =====
function toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown')
    if (!dropdown) return

    notificationsOuvert = !notificationsOuvert
    dropdown.classList.toggle('ouvert', notificationsOuvert)
    document.body.classList.toggle('notif-ouvert', notificationsOuvert)
}

document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('nav-notif-wrapper')
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = document.getElementById('notif-dropdown')
        if (dropdown) dropdown.classList.remove('ouvert')
        notificationsOuvert = false
        document.body.classList.remove('notif-ouvert')
    }
})

// ===== CLIC NOTIFICATION =====
async function clicNotification(notifId, lien) {
    await supabaseClient
        .from('notifications')
        .update({ lu: true })
        .eq('id', notifId)

    if (lien) window.location.href = lien
}

// ===== MARQUER TOUT LU =====
async function marquerToutLu() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null
    if (!utilisateur) return

    await supabaseClient
        .from('notifications')
        .update({ lu: true })
        .eq('user_id', utilisateur.id)

    const badge = document.getElementById('notif-badge')
    if (badge) badge.style.display = 'none'

    document.querySelectorAll('.notif-item.non-lu').forEach(el => {
        el.classList.remove('non-lu')
        const point = el.querySelector('.notif-point')
        if (point) point.remove()
    })
}

// ===== CRÉER NOTIFICATION =====
async function creerNotification(userId, type, message, lien) {
    if (!userId) return

    const { data: sessionData } = await supabaseClient.auth.getSession()
    const expediteurId = sessionData.session?.user?.id || null

    await supabaseClient
        .from('notifications')
        .insert([{
            user_id: userId,
            type: type,
            message: message,
            lu: false,
            lien: lien || '',
            expediteur_id: expediteurId
        }])
}

// ===== LANCER =====
window.addEventListener('load', initialiserNotifications)