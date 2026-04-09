// ===== VARIABLES GLOBALES =====
let profilActuel = null
let utilisateurConnecte = null
let estMonProfil = false
let pubsOriginales = []

// ===== VARIABLES ÉDITEUR =====
let editeurPhotoType = null
let editeurPhotoFichier = null
let editeurPosX = 0, editeurPosY = 0
let editeurZoom = 1
let editeurDragging = false
let editeurStartX, editeurStartY

// ===== CHARGER LE PROFIL =====
async function chargerProfil() {
    const params = new URLSearchParams(window.location.search)
    const username = params.get('u')

    const { data: sessionData } = await supabaseClient.auth.getSession()
    utilisateurConnecte = sessionData.session?.user || null

    let query = supabaseClient.from('profils').select('*')
    if (username) {
        query = query.eq('username', username.toLowerCase())
    } else if (utilisateurConnecte) {
        query = query.eq('user_id', utilisateurConnecte.id)
    } else {
        window.location.href = 'index.html'
        return
    }

    const { data: profil, error } = await query.single()

    if (error || !profil) {
        document.querySelector('.profil-page').innerHTML = `
            <div style="text-align:center; padding: 5rem 2rem;">
                <div style="font-size: 4rem;">😕</div>
                <h2>Profil introuvable</h2>
                <a href="index.html" class="btn-primary" style="display:inline-block; margin-top: 1rem;">Retour à l'accueil</a>
            </div>
        `
        return
    }

profilActuel = profil
estMonProfil = utilisateurConnecte?.id === profil.user_id

// Vérifier si bloqué
if (utilisateurConnecte && !estMonProfil) {
    const { data: blocage } = await supabaseClient
        .from('blocages')
        .select('id')
        .eq('bloqueur_id', utilisateurConnecte.id)
        .eq('bloque_id', profil.user_id)
        .single()

    if (blocage) {
        document.querySelector('.profil-page').innerHTML = `
            <div style="text-align:center; padding: 5rem 2rem;">
                <div style="font-size: 4rem; margin-bottom:1rem;">🚫</div>
                <h2 style="color:#e24b4a; margin-bottom:0.5rem;">Utilisateur bloqué</h2>
                <p style="color:#94a3b8;">Tu as bloqué cet utilisateur.</p>
                <a href="index.html" style="display:inline-block; margin-top:1.5rem; background:linear-gradient(135deg, #7c3aed, #3b82f6); color:white; padding:0.75rem 1.5rem; border-radius:12px; text-decoration:none;">
                    <i class="fa-solid fa-house"></i> Retour à l'accueil
                </a>
            </div>
        `
        return
    }

    const { data: blocageInverse } = await supabaseClient
        .from('blocages')
        .select('id')
        .eq('bloqueur_id', profil.user_id)
        .eq('bloque_id', utilisateurConnecte.id)
        .single()

    if (blocageInverse) {
        document.querySelector('.profil-page').innerHTML = `
            <div style="text-align:center; padding: 5rem 2rem;">
                <div style="font-size: 4rem; margin-bottom:1rem;">🚫</div>
                <h2 style="color:#e24b4a; margin-bottom:0.5rem;">Profil inaccessible</h2>
                <p style="color:#94a3b8;">Tu ne peux pas voir ce profil.</p>
                <a href="index.html" style="display:inline-block; margin-top:1.5rem; background:linear-gradient(135deg, #7c3aed, #3b82f6); color:white; padding:0.75rem 1.5rem; border-radius:12px; text-decoration:none;">
                    <i class="fa-solid fa-house"></i> Retour à l'accueil
                </a>
            </div>
        `
        return
    }
}

// Vérifier si banni
if (profil.banni && !estMonProfil) {
    afficherProfil()
    document.getElementById('profil-boutons').innerHTML = ''
    document.querySelector('.profil-onglets').style.display = 'none'
    document.querySelector('.profil-contenu').innerHTML = `
        <div style="text-align:center; padding: 3rem 2rem;">
            <div style="font-size: 3rem; margin-bottom:1rem;">🚫</div>
            <h3 style="color:#e24b4a; margin-bottom:0.5rem;">Compte banni</h3>
            <p style="color:#94a3b8; font-size:0.9rem;">Ce compte a été banni de ZoTech.</p>
        </div>
    `
    return
}
    const p = profilActuel
// Recalculer les vrais compteurs
const { count: nbAbonnes } = await supabaseClient
    .from('abonnements')
    .select('*', { count: 'exact', head: true })
    .eq('cible_id', profil.user_id)

const { count: nbAbonnements } = await supabaseClient
    .from('abonnements')
    .select('*', { count: 'exact', head: true })
    .eq('abonne_id', profil.user_id)

profilActuel.abonnes = nbAbonnes || 0
profilActuel.abonnements = nbAbonnements || 0
    const couverture = document.getElementById('profil-couverture')
    if (p.photo_couverture) {
        couverture.style.backgroundImage = `url(${p.photo_couverture})`
        couverture.style.backgroundSize = 'cover'
        couverture.style.backgroundPosition = 'center'
    }
afficherProfil()
chargerPublications()
verifierAbonnement()
}
// ===== AFFICHER LE PROFIL =====
function afficherProfil() {
    const p = profilActuel

    const couverture = document.getElementById('profil-couverture')
    if (p.photo_couverture) {
        couverture.style.backgroundImage = `url(${p.photo_couverture})`
        couverture.style.backgroundSize = 'cover'
        couverture.style.backgroundPosition = 'center'
    }

    const avatar = document.getElementById('profil-avatar')
    const initiale = document.getElementById('profil-initiale')
    if (p.photo_profil) {
        avatar.style.backgroundImage = `url(${p.photo_profil})`
        avatar.style.backgroundSize = 'cover'
        avatar.style.backgroundPosition = 'center'
        initiale.style.display = 'none'
    } else {
        initiale.textContent = (p.pseudo || p.username).charAt(0).toUpperCase()
    }

    document.getElementById('profil-pseudo').textContent = p.pseudo || p.username
    document.getElementById('profil-username').textContent = '@' + p.username
    document.getElementById('profil-bio').textContent = p.bio || 'Aucune bio pour le moment'
    document.getElementById('stat-abonnes').textContent = p.abonnes || 0
    document.getElementById('stat-abonnements').textContent = p.abonnements || 0

    const boutons = document.getElementById('profil-boutons')
    if (estMonProfil) {
        boutons.innerHTML = `
            <button class="btn-edit-profil" onclick="ouvrirEditModal()">✏️ Modifier le profil</button>
        `
        document.getElementById('couverture-overlay').style.display = 'flex'
        document.getElementById('avatar-overlay').style.display = 'flex'
        document.getElementById('edit-pseudo').value = p.pseudo || ''
        document.getElementById('edit-username').value = p.username || ''
        document.getElementById('edit-bio').value = p.bio || ''
    } else {
        boutons.innerHTML = `
            <button class="btn-primary btn-abonner" onclick="toggleAbonnement()" id="btn-abonner">
                <i class="fa-solid fa-plus"></i> S'abonner
            </button>
        `
        const btnSignaler = document.getElementById('btn-signaler-profil')
        if (btnSignaler && utilisateurConnecte) btnSignaler.style.display = 'block'
    }
}

// ===== ÉDITEUR PHOTO =====
function ouvrirEditeurPhoto(fichier, type) {
    console.log('ouvrirEditeurPhoto appelé', fichier, type)
    editeurPhotoType = type
    editeurPhotoFichier = fichier
    editeurPosX = 0
    editeurPosY = 0
    editeurZoom = 1

    const modal = document.getElementById('editeur-photo-modal')
    const wrapper = document.getElementById('editeur-photo-wrapper')
    const img = document.getElementById('editeur-photo-img')
    const titre = document.getElementById('editeur-photo-titre')

    titre.textContent = type === 'avatar' ? '📸 Photo de profil' : '🖼️ Photo de couverture'

    if (type === 'avatar') {
        wrapper.style.width = '250px'
        wrapper.style.height = '250px'
        wrapper.style.borderRadius = '50%'
        wrapper.style.margin = '0 auto'
    } else {
        wrapper.style.width = '100%'
        wrapper.style.height = '200px'
        wrapper.style.borderRadius = '12px'
        wrapper.style.margin = '0'
    }

    const reader = new FileReader()
    reader.onload = function(e) {
        img.src = e.target.result
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'cover'
        img.style.position = 'absolute'
        img.style.top = '0'
        img.style.left = '0'
        img.style.transform = 'translate(0px, 0px) scale(1)'
        img.style.cursor = 'grab'
        document.getElementById('editeur-zoom').value = 100
        document.getElementById('editeur-zoom-value').textContent = '100%'
        initialiserDragPhoto()
    }
    reader.readAsDataURL(fichier)
    modal.style.display = 'flex'
}

function fermerEditeurPhoto() {
    document.getElementById('editeur-photo-modal').style.display = 'none'
}

function appliquerZoomPhoto(valeur) {
    editeurZoom = valeur / 100
    document.getElementById('editeur-zoom-value').textContent = valeur + '%'
    appliquerTransformPhoto()
}

function appliquerTransformPhoto() {
    const img = document.getElementById('editeur-photo-img')
    img.style.transform = `translate(${editeurPosX}px, ${editeurPosY}px) scale(${editeurZoom})`
    img.style.transformOrigin = 'center center'
}

function initialiserDragPhoto() {
    const img = document.getElementById('editeur-photo-img')
    img.onmousedown = (e) => {
        editeurDragging = true
        editeurStartX = e.clientX - editeurPosX
        editeurStartY = e.clientY - editeurPosY
        img.style.cursor = 'grabbing'
        e.preventDefault()
    }
    document.onmousemove = (e) => {
        if (!editeurDragging) return
        editeurPosX = e.clientX - editeurStartX
        editeurPosY = e.clientY - editeurStartY
        appliquerTransformPhoto()
    }
    document.onmouseup = () => {
        editeurDragging = false
        const img = document.getElementById('editeur-photo-img')
        if (img) img.style.cursor = 'grab'
    }
    img.ontouchstart = (e) => {
        editeurDragging = true
        editeurStartX = e.touches[0].clientX - editeurPosX
        editeurStartY = e.touches[0].clientY - editeurPosY
        e.preventDefault()
    }
    document.ontouchmove = (e) => {
        if (!editeurDragging) return
        editeurPosX = e.touches[0].clientX - editeurStartX
        editeurPosY = e.touches[0].clientY - editeurStartY
        appliquerTransformPhoto()
    }
    document.ontouchend = () => { editeurDragging = false }
}

function resetPhoto() {
    editeurPosX = 0
    editeurPosY = 0
    editeurZoom = 1
    document.getElementById('editeur-zoom').value = 100
    document.getElementById('editeur-zoom-value').textContent = '100%'
    appliquerTransformPhoto()
}

async function sauvegarderPhoto() {
    if (!editeurPhotoFichier) return
    const btn = document.querySelector('#editeur-photo-modal .btn-primary')
    btn.textContent = '⏳ Upload...'
    btn.disabled = true

    const nomFichier = `${editeurPhotoType}_${utilisateurConnecte.id}_${Date.now()}`
    const { error } = await supabaseClient.storage
        .from('photo')
        .upload(nomFichier, editeurPhotoFichier, { upsert: true })

    if (error) {
        afficherToast('Erreur : ' + error.message, 'erreur')
        btn.textContent = '✅ Appliquer'
        btn.disabled = false
        return
    }

    const { data: urlData } = supabaseClient.storage.from('photo').getPublicUrl(nomFichier)
    const champ = editeurPhotoType === 'avatar' ? 'photo_profil' : 'photo_couverture'

    await supabaseClient
        .from('profils')
        .update({ [champ]: urlData.publicUrl })
        .eq('user_id', utilisateurConnecte.id)

    fermerEditeurPhoto()
    afficherToast('Photo mise à jour !', 'succes')
    setTimeout(() => window.location.reload(), 1000)
}

// ===== CHARGER PUBLICATIONS =====
async function chargerPublications() {
    const { data: pubs } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('user_id', profilActuel.user_id)
        .order('created_at', { ascending: false })

    pubsOriginales = pubs || []

    if (!pubs || pubs.length === 0) {
        document.getElementById('grid-publications').innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #a0a0b0;">
                <div style="font-size: 3rem;">📝</div>
                <p>Aucune publication pour le moment</p>
            </div>
        `
        document.getElementById('stat-publications').textContent = 0
        return
    }

    document.getElementById('stat-publications').textContent = pubs.length

    const photos = pubs.filter(p => p.type_contenu === 'photo')
    const videos = pubs.filter(p => p.type_contenu === 'video')

    document.getElementById('grid-publications').innerHTML = pubs.map(creerCartePubli).join('')

    document.getElementById('grid-photos').innerHTML = photos.length > 0
        ? photos.map(p => `
            <div class="photo-profil-item" onclick="ouvrirArticle(${p.id}, 'supabase')">
                <img src="${p.url_image?.split(',')[0]}" alt="${p.titre}">
                <div class="photo-profil-overlay"><span>${p.titre}</span></div>
            </div>
        `).join('')
        : '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">📸</div><p>Aucune photo</p></div>'

    document.getElementById('grid-videos').innerHTML = videos.length > 0
        ? videos.map(creerCartePubli).join('')
        : '<div style="text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">🎥</div><p>Aucune vidéo</p></div>'

    await chargerFavorisEtAimes()
}

// ===== CRÉER CARTE PUBLICATION =====
function creerCartePubli(pub) {
    let imageHtml = ''
    if (pub.type_contenu === 'video' && pub.url_video) {
        let videoId = ''
        if (pub.url_video.includes('embed/')) videoId = pub.url_video.split('embed/')[1].split('?')[0]
        else if (pub.url_video.includes('watch?v=')) videoId = pub.url_video.split('watch?v=')[1].split('&')[0]
        else if (pub.url_video.includes('youtu.be/')) videoId = pub.url_video.split('youtu.be/')[1].split('?')[0]
        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
        imageHtml = thumbnail
            ? `<div class="card-image" style="background-image:url(${thumbnail}); background-size:cover; background-position:center;"></div>`
            : `<div class="card-image">🎥</div>`
    } else if (pub.type_contenu === 'photo' && pub.url_image) {
        const premierePhoto = pub.url_image.split(',')[0]
        imageHtml = `<div class="card-image" style="background-image:url(${premierePhoto}); background-size:cover; background-position:center;"></div>`
    } else if (pub.url_couverture) {
        imageHtml = `<div class="card-image" style="background-image:url(${pub.url_couverture}); background-size:cover; background-position:center;"></div>`
    } else {
        imageHtml = `<div class="card-image">${pub.emoji || '📝'}</div>`
    }

    const actionsAdmin = estMonProfil ? `
        <button class="card-action-btn card-action-edit" onclick="event.stopPropagation(); modifierPublication(${pub.id})">
            <i class="fa-solid fa-pen"></i>
        </button>
        <button class="card-action-btn card-action-delete" onclick="event.stopPropagation(); supprimerPublication(${pub.id})">
            <i class="fa-solid fa-trash"></i>
        </button>
    ` : ''

    return `
        <div class="card" onclick="ouvrirArticle(${pub.id}, 'supabase')" style="cursor:pointer">
            ${imageHtml}
            <div class="card-content">
                <span class="card-tag">${pub.tag}</span>
                <h3 class="card-title">${pub.titre}</h3>
                <p class="card-desc">${pub.description}</p>
                <div class="card-footer">
                    <span>${pub.type_contenu === 'video' ? '🎥' : pub.type_contenu === 'photo' ? '📸' : '📝'}</span>
                    <span>📅 ${new Date(pub.created_at).toLocaleDateString('fr-FR')}</span>
                    <div class="card-actions">
                        <button class="card-action-btn" onclick="event.stopPropagation(); partagerArticle(${pub.id}, '${pub.titre.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-link"></i>
                        </button>
                        ${!estMonProfil ? `
                        <button class="card-action-btn" onclick="event.stopPropagation(); signalerContenu('article', ${pub.id})" style="color:#e24b4a;">
                            <i class="fa-solid fa-flag"></i>
                        </button>
                        ` : ''}
                        ${actionsAdmin}
                    </div>
                </div>
            </div>
        </div>
    `
}

// ===== OUVRIR ARTICLE =====
function ouvrirArticle(id, source) {
    source = source || 'supabase'
    window.location.href = `article.html?id=${id}&src=${source}`
}

// ===== CHANGER ONGLET =====
function changerOnglet(onglet) {
    document.querySelectorAll('.onglet').forEach(o => o.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none')
    event.target.classList.add('active')
    document.getElementById(`tab-${onglet}`).style.display = 'block'
}

// ===== MODIFIER PROFIL =====
function ouvrirEditModal() {
    document.getElementById('edit-modal').style.display = 'flex'
}

function fermerEditModal() {
    document.getElementById('edit-modal').style.display = 'none'
}

async function sauvegarderProfil() {
    const nouveauPseudo = document.getElementById('edit-pseudo').value.trim()
    const nouveauUsername = document.getElementById('edit-username').value.trim()
    const nouvelleBio = document.getElementById('edit-bio').value.trim()
    const msg = document.getElementById('edit-message')

    if (!nouveauPseudo || !nouveauUsername) {
        msg.textContent = '❌ Pseudo et nom d\'utilisateur obligatoires !'
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    if (nouveauPseudo !== profilActuel.pseudo) {
        const result = await modifierPseudo(utilisateurConnecte.id, nouveauPseudo)
        if (result.erreur) {
            msg.textContent = result.erreur
            msg.style.color = '#e24b4a'
            msg.style.display = 'block'
            return
        }
    }

    if (nouveauUsername !== profilActuel.username) {
        const result = await modifierUsername(utilisateurConnecte.id, nouveauUsername)
        if (result.erreur) {
            msg.textContent = result.erreur
            msg.style.color = '#e24b4a'
            msg.style.display = 'block'
            return
        }
    }

    await supabaseClient
        .from('profils')
        .update({ bio: nouvelleBio })
        .eq('user_id', utilisateurConnecte.id)

    msg.textContent = '✅ Profil mis à jour !'
    msg.style.color = '#1D9E75'
    msg.style.display = 'block'

    setTimeout(() => {
        fermerEditModal()
        window.location.reload()
    }, 1500)
}

// ===== ABONNEMENT =====
async function toggleAbonnement() {
    if (!utilisateurConnecte) {
        ouvrirModal('connexion')
        return
    }

    const btn = document.getElementById('btn-abonner')

    const { data: existant } = await supabaseClient
        .from('abonnements')
        .select('*')
        .eq('abonne_id', utilisateurConnecte.id)
        .eq('cible_id', profilActuel.user_id)
        .single()

    if (existant) {
        await supabaseClient.from('abonnements').delete()
            .eq('abonne_id', utilisateurConnecte.id)
            .eq('cible_id', profilActuel.user_id)

        await supabaseClient.from('profils')
            .update({ abonnes: Math.max(0, (profilActuel.abonnes || 1) - 1) })
            .eq('user_id', profilActuel.user_id)

        await supabaseClient.from('profils')
            .update({ abonnements: Math.max(0, (profilActuel.abonnements || 1) - 1) })
            .eq('user_id', utilisateurConnecte.id)

        btn.innerHTML = '<i class="fa-solid fa-plus"></i> S\'abonner'
        btn.style.background = '#7c3aed'
        document.getElementById('stat-abonnes').textContent =
            Math.max(0, parseInt(document.getElementById('stat-abonnes').textContent) - 1)
    } else {
        await supabaseClient.from('abonnements')
            .insert([{ abonne_id: utilisateurConnecte.id, cible_id: profilActuel.user_id }])

        const { data: monProfil } = await supabaseClient
            .from('profils').select('pseudo').eq('user_id', utilisateurConnecte.id).single()

        await creerNotification(
            profilActuel.user_id,
            'abonnement',
            `👤 ${monProfil?.pseudo || 'Quelqu\'un'} s'est abonné à toi`,
            `profil.html?u=${profilActuel.username}`
        )

        await supabaseClient.from('profils')
            .update({ abonnes: (profilActuel.abonnes || 0) + 1 })
            .eq('user_id', profilActuel.user_id)

        await supabaseClient.from('profils')
            .update({ abonnements: (profilActuel.abonnements || 0) + 1 })
            .eq('user_id', utilisateurConnecte.id)

        btn.innerHTML = '✅ Abonné'
        btn.style.background = '#1D9E75'
        document.getElementById('stat-abonnes').textContent =
            parseInt(document.getElementById('stat-abonnes').textContent) + 1
    }
}

// ===== VÉRIFIER ABONNEMENT =====
async function verifierAbonnement() {
    if (!utilisateurConnecte || estMonProfil) return

    const { data: existant } = await supabaseClient
        .from('abonnements').select('*')
        .eq('abonne_id', utilisateurConnecte.id)
        .eq('cible_id', profilActuel.user_id).single()

    const btn = document.getElementById('btn-abonner')
    if (btn && existant) {
        btn.innerHTML = '✅ Abonné'
        btn.style.background = '#1D9E75'
    }
}

// ===== PARTAGER PROFIL =====
function partagerProfil() {
    const url = window.location.href
    if (navigator.share) {
        navigator.share({ title: profilActuel.pseudo + ' sur ZoTech', text: 'Découvre le profil de ' + profilActuel.pseudo + ' sur ZoTech !', url: url })
    } else {
        navigator.clipboard.writeText(url)
        afficherToast('Lien du profil copié !', 'succes')
    }
}

// ===== MODIFIER PUBLICATION =====
function modifierPublication(id) {
    window.location.href = `publier.html?edit=${id}`
}

// ===== SUPPRIMER PUBLICATION =====
async function supprimerPublication(id) {
    ouvrirConfirm({
        icone: '🗑️',
        titre: 'Supprimer la publication',
        message: 'Cette action est irréversible. Tu veux vraiment supprimer cette publication ?',
        texteBouton: 'Supprimer',
        onConfirm: async () => {
            const { error } = await supabaseClient.from('articles').delete()
                .eq('id', id).eq('user_id', utilisateurConnecte.id)
            if (error) { afficherToast('Erreur lors de la suppression', 'erreur'); return }
            afficherToast('Publication supprimée !', 'succes')
            chargerPublications()
        }
    })
}

// ===== PARTAGER ARTICLE =====
function partagerArticle(id, titre) {
    const url = `${window.location.origin}/article.html?id=${id}`
    if (navigator.share) {
        navigator.share({ title: titre + ' — ZoTech', text: 'Découvre cet article sur ZoTech !', url: url })
    } else {
        navigator.clipboard.writeText(url)
        afficherToast('Lien copié !', 'succes')
    }
}

// ===== TRIER PROFIL =====
async function trierProfil(tri) {
    if (pubsOriginales.length === 0) return
    let pubsTries = [...pubsOriginales]
    if (tri === 'recent') pubsTries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (tri === 'ancien') pubsTries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    document.getElementById('grid-publications').innerHTML = pubsTries.map(creerCartePubli).join('')
}

// ===== FAVORIS ET AIMÉS =====
async function chargerFavorisEtAimes() {
    if (!estMonProfil) return

    const { data: favoris } = await supabaseClient
        .from('favoris').select('article_id').eq('user_id', profilActuel.user_id)

    if (favoris && favoris.length > 0) {
        const ids = favoris.map(f => f.article_id)
        const { data: articlesFavoris } = await supabaseClient.from('articles').select('*').in('id', ids)
        document.getElementById('grid-favoris').innerHTML = articlesFavoris?.length > 0
            ? articlesFavoris.map(creerCartePubli).join('')
            : '<div style="text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">🔖</div><p>Aucun favori</p></div>'
    } else {
        document.getElementById('grid-favoris').innerHTML = '<div style="text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">🔖</div><p>Aucun favori pour le moment</p></div>'
    }

    const { data: aimes } = await supabaseClient
        .from('likes').select('article_id').eq('user_id', profilActuel.user_id).not('article_id', 'is', null)

    if (aimes && aimes.length > 0) {
        const ids = aimes.map(a => a.article_id)
        const { data: articlesAimes } = await supabaseClient.from('articles').select('*').in('id', ids)
        document.getElementById('grid-aimes').innerHTML = articlesAimes?.length > 0
            ? articlesAimes.map(creerCartePubli).join('')
            : '<div style="text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">❤️</div><p>Aucun article aimé</p></div>'
    } else {
        document.getElementById('grid-aimes').innerHTML = '<div style="text-align:center; padding:3rem; color:#a0a0b0;"><div style="font-size:3rem;">❤️</div><p>Aucun article aimé pour le moment</p></div>'
    }
}

// ===== MENU HAMBURGER PROFIL =====
function toggleMenuProfil() {
    const menu = document.getElementById('profil-menu-dropdown')
    if (!menu) return
    menu.classList.toggle('ouvert')
    const contenu = document.getElementById('profil-menu-contenu')
    if (estMonProfil) {
        contenu.innerHTML = `
        <a href="#" class="profil-menu-item" onclick="partagerProfil(); fermerMenuProfil()">
    <i class="fa-solid fa-link"></i> Partager le profil
</a>
<a href="#" class="profil-menu-item" onclick="ouvrirParametres()">
    <i class="fa-solid fa-gear"></i> Paramètres
</a>   
            <a href="#" class="profil-menu-item" onclick="ouvrirConfidentialite()">
                <i class="fa-solid fa-lock"></i> Confidentialité
            </a>
            <a href="#" class="profil-menu-item" onclick="ouvrirAppareils()">
                <i class="fa-solid fa-mobile"></i> Appareils connectés
            </a>
            ${profilActuel?.est_admin ? `
            <a href="admin.html" class="profil-menu-item" style="color:#7c3aed;">
                <i class="fa-solid fa-shield-halved"></i> Administration
            </a>
            ` : ''}
            <div class="profil-menu-divider"></div>
            <button class="profil-menu-item danger" onclick="deconnecter()">
                <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
            </button>
        `
    } else {
     contenu.innerHTML = `
            <a href="#" class="profil-menu-item" onclick="partagerProfil(); fermerMenuProfil()">
                <i class="fa-solid fa-link"></i> Partager le profil
            </a>
            <div class="profil-menu-divider"></div>
            <button class="profil-menu-item danger" onclick="bloquerProfilActuel(); fermerMenuProfil()">
                <i class="fa-solid fa-ban"></i> Bloquer
            </button>
            <button class="profil-menu-item danger" onclick="signalerProfil(); fermerMenuProfil()">
                <i class="fa-solid fa-flag"></i> Signaler ce profil
            </button>
        `
    }
}

function fermerMenuProfil() {
    const menu = document.getElementById('profil-menu-dropdown')
    if (menu) menu.classList.remove('ouvert')
}

document.addEventListener('click', (e) => {
    const hamburger = document.getElementById('profil-hamburger')
    const menu = document.getElementById('profil-menu-dropdown')
    if (hamburger && menu && !hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('ouvert')
    }
})

function ouvrirParametres() { fermerMenuProfil(); window.location.href = 'parametres.html' }
function ouvrirConfidentialite() { fermerMenuProfil(); afficherToast('Confidentialité — Bientôt disponible !', 'info') }
function ouvrirAppareils() { fermerMenuProfil(); afficherToast('Appareils connectés — Bientôt disponible !', 'info') }

// ===== LANCER =====
window.addEventListener('load', chargerProfil)

// ===== BLOQUER PROFIL =====
async function bloquerProfilActuel() {
    if (!utilisateurConnecte) {
        ouvrirModal('connexion')
        return
    }

    ouvrirConfirm({
        icone: '🚫',
        titre: 'Bloquer cet utilisateur',
        message: `Tu veux bloquer @${profilActuel.username} ? Il ne pourra plus voir ton profil ni interagir avec toi.`,
        texteBouton: 'Bloquer',
        onConfirm: async () => {
            const { error } = await supabaseClient
                .from('blocages')
                .insert([{
                    bloqueur_id: utilisateurConnecte.id,
                    bloque_id: profilActuel.user_id
                }])

            if (!error) {
                afficherToast(`@${profilActuel.username} bloqué !`, 'succes')
                setTimeout(() => window.location.href = 'index.html', 1500)
            }
        }
    })
}

// ===== LISTE ABONNÉS/ABONNEMENTS =====
async function ouvrirListeAbonnes() {
    document.getElementById('modal-abonnes-titre').textContent = '👥 Abonnés'
    document.getElementById('modal-abonnes').style.display = 'flex'
    
    const { data: abonnes } = await supabaseClient
        .from('abonnements')
        .select('abonne_id')
        .eq('cible_id', profilActuel.user_id)

    if (!abonnes || abonnes.length === 0) {
        document.getElementById('modal-abonnes-liste').innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Aucun abonné pour le moment</p>'
        return
    }

    const ids = abonnes.map(a => a.abonne_id)
    const { data: profils } = await supabaseClient
        .from('profils')
        .select('user_id, pseudo, username, photo_profil')
        .in('user_id', ids)

    document.getElementById('modal-abonnes-liste').innerHTML = (profils || []).map(p => `
        <a href="profil.html?u=${p.username}" onclick="fermerModalAbonnes()" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0; border-bottom:1px solid #252840; text-decoration:none;">
            <div style="width:40px; height:40px; border-radius:50%; background:#7c3aed; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                ${p.photo_profil ? `<img src="${p.photo_profil}" style="width:100%;height:100%;object-fit:cover;">` : (p.pseudo || p.username).charAt(0).toUpperCase()}
            </div>
            <div>
                <div style="color:#ffffff; font-weight:500; font-size:0.9rem;">${p.pseudo}</div>
                <div style="color:#7c3aed; font-size:0.8rem;">@${p.username}</div>
            </div>
        </a>
    `).join('')
}

async function ouvrirListeAbonnements() {
    document.getElementById('modal-abonnes-titre').textContent = '👤 Abonnements'
    document.getElementById('modal-abonnes').style.display = 'flex'

    const { data: abonnements } = await supabaseClient
        .from('abonnements')
        .select('cible_id')
        .eq('abonne_id', profilActuel.user_id)

    if (!abonnements || abonnements.length === 0) {
        document.getElementById('modal-abonnes-liste').innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Aucun abonnement pour le moment</p>'
        return
    }

    const ids = abonnements.map(a => a.cible_id)
    const { data: profils } = await supabaseClient
        .from('profils')
        .select('user_id, pseudo, username, photo_profil')
        .in('user_id', ids)

    document.getElementById('modal-abonnes-liste').innerHTML = (profils || []).map(p => `
        <a href="profil.html?u=${p.username}" onclick="fermerModalAbonnes()" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0; border-bottom:1px solid #252840; text-decoration:none;">
            <div style="width:40px; height:40px; border-radius:50%; background:#7c3aed; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                ${p.photo_profil ? `<img src="${p.photo_profil}" style="width:100%;height:100%;object-fit:cover;">` : (p.pseudo || p.username).charAt(0).toUpperCase()}
            </div>
            <div>
                <div style="color:#ffffff; font-weight:500; font-size:0.9rem;">${p.pseudo}</div>
                <div style="color:#7c3aed; font-size:0.8rem;">@${p.username}</div>
            </div>
        </a>
    `).join('')
}

function fermerModalAbonnes() {
    document.getElementById('modal-abonnes').style.display = 'none'
}