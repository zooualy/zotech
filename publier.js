// ===== TYPE DE CONTENU SÉLECTIONNÉ =====
let typeActuel = 'article'

function selectionnerType(type) {
    typeActuel = type
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'))
    document.getElementById(`type-${type}`).classList.add('active')
    document.getElementById('champ-contenu').style.display = 'none'
    document.getElementById('champ-video').style.display = 'none'
    document.getElementById('champ-photo').style.display = 'none'

    // Champ couverture
    const champCouverture = document.getElementById('upload-zone-couverture')?.closest('.form-group')
    if (champCouverture) {
        if (type === 'article') {
            champCouverture.style.display = 'block'
        } else {
            champCouverture.style.display = 'none'
        }
    }

    if (type === 'article') {
        document.getElementById('champ-contenu').style.display = 'block'
  } else if (type === 'video') {
        document.getElementById('champ-video').style.display = 'block'
        
        // Écouter le lien pour afficher/cacher miniature TikTok
        document.getElementById('pub-video').addEventListener('input', function() {
            const estTikTok = this.value.includes('tiktok.com')
            document.getElementById('champ-miniature-tiktok').style.display = estTikTok ? 'block' : 'none'
        })
    } else if (type === 'photo') {
        document.getElementById('champ-photo').style.display = 'block'
    }
}

// ===== CONVERTIR LIEN YOUTUBE EN EMBED =====
function convertirYoutube(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`
    }
    return url
}

// ===== CONVERTIR TEXTE EN HTML =====
function convertirTexteEnHTML(texte) {
    return texte
        .split('\n\n')
        .map(bloc => {
            bloc = bloc.trim()
            if (!bloc) return ''

            if (bloc.startsWith('### ')) {
                return `<h3>${bloc.replace('### ', '')}</h3>`
            } else if (bloc.startsWith('## ')) {
                return `<h2>${bloc.replace('## ', '')}</h2>`
            } else if (bloc.startsWith('# ')) {
                return `<h2>${bloc.replace('# ', '')}</h2>`
            }

            const lignes = bloc.split('\n').filter(l => l.trim())
            if (lignes.length > 1 && lignes.every(l => l.trim().startsWith('-'))) {
                const items = lignes.map(l => `<li>${l.replace(/^-\s*/, '')}</li>`).join('')
                return `<ul>${items}</ul>`
            }

            const texteFormate = bloc
                .split('\n')
                .join('<br>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')

            return `<p>${texteFormate}</p>`
        })
        .filter(bloc => bloc)
        .join('\n')
}

// ===== PUBLIER LE CONTENU =====
async function publierContenu() {
    const { data: sessionData } = await supabaseClient.auth.getSession()

    if (!sessionData.session) {
        afficherMessagePub('erreur', '❌ Tu dois être connecté pour publier !')
        return
    }

    const user = sessionData.session.user
    const titre = document.getElementById('pub-titre').value.trim()
    const description = document.getElementById('pub-description').value.trim()
    const tag = document.getElementById('pub-tag').value
    const emoji = document.getElementById('pub-emoji').value.trim() || '✨'

    if (!titre || !description) {
        afficherMessagePub('erreur', '❌ Le titre et la description sont obligatoires !')
        return
    }

   let contenu = ''
let url_video = ''
let url_image = ''
let urlMiniatureTikTok = ''

    if (typeActuel === 'article') {
        const texteContenu = document.getElementById('pub-contenu').value.trim()
        if (!texteContenu) {
            afficherMessagePub('erreur', '❌ Le contenu de l\'article est obligatoire !')
            return
        }
        contenu = convertirTexteEnHTML(texteContenu)
    } else if (typeActuel === 'video') {
        const lienVideo = document.getElementById('pub-video').value.trim()
        if (!lienVideo) {
            afficherMessagePub('erreur', '❌ Le lien de la vidéo est obligatoire !')
            return
        }
        const estTikTok = lienVideo.includes('tiktok.com')

if (estTikTok) {
    const fichierMiniature = document.getElementById('pub-miniature-tiktok').files[0]
    console.log('Fichier miniature:', fichierMiniature)
    console.log('Est TikTok:', estTikTok)
    if (fichierMiniature) {
        const nomMiniature = `miniature_${user.id}_${Date.now()}`
        const { error: errMiniature } = await supabaseClient.storage
            .from('photo')
            .upload(nomMiniature, fichierMiniature, { upsert: true })

        if (!errMiniature) {
            const { data: urlMini } = supabaseClient.storage
                .from('photo')
                .getPublicUrl(nomMiniature)
            urlMiniatureTikTok = urlMini.publicUrl
        }
    }
}
   

        url_video = convertirYoutube(lienVideo)
    } else if (typeActuel === 'photo') {
        const fichiers = document.getElementById('pub-image').files
        if (fichiers.length === 0) {
            afficherMessagePub('erreur', '❌ Choisis au moins une photo !')
            return
        }

        for (let fichier of fichiers) {
            if (fichier.size > 5 * 1024 * 1024) {
                afficherMessagePub('erreur', `❌ ${fichier.name} est trop lourd (max 5MB) !`)
                return
            }
        }

        afficherMessagePub('succes', '⏳ Upload des photos en cours...')
        const urls = []

        for (let fichier of fichiers) {
            const nomFichier = `${user.id}_${Date.now()}_${fichier.name}`
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('photo')
                .upload(nomFichier, fichier)

            if (uploadError) {
                afficherMessagePub('erreur', '❌ Erreur upload : ' + uploadError.message)
                return
            }

            const { data: urlData } = supabaseClient
                .storage
                .from('photo')
                .getPublicUrl(nomFichier)

            urls.push(urlData.publicUrl)
        }

        url_image = urls.join(',')
    }

    const btnPublier = document.querySelector('.btn-publier')
    btnPublier.textContent = '⏳ Publication en cours...'
    btnPublier.disabled = true

    let url_couverture = ''
    const fichierCouverture = document.getElementById('pub-couverture').files[0]
    if (fichierCouverture) {
        const nomCouverture = `couverture_${user.id}_${Date.now()}`
        const { error: errCouverture } = await supabaseClient.storage
            .from('photo')
            .upload(nomCouverture, fichierCouverture, { upsert: true })

        if (!errCouverture) {
            const { data: urlCouv } = supabaseClient.storage
                .from('photo')
                .getPublicUrl(nomCouverture)
            url_couverture = urlCouv.publicUrl
        }
    }

    const { data, error } = await supabaseClient
        .from('articles')
    .insert([{
    titre: titre,
    description: description,
    contenu: contenu,
    tag: tag,
    emoji: emoji,
    auteur: user.user_metadata.pseudo || user.email,
    username_auteur: user.user_metadata.username || '',
    user_id: user.id,
    type_contenu: typeActuel,
    url_video: url_video,
    url_image: url_image,
    url_couverture: url_couverture,
    url_miniature_tiktok: urlMiniatureTikTok || '',
    featured: false,
    tags_personnes: tagsPersonnes.join(','),
    hashtags: tagsHashtags.join(',')
}])    
.select() 
    if (error) {
        afficherMessagePub('erreur', '❌ Erreur : ' + error.message)
        btnPublier.textContent = '🚀 Publier maintenant'
        btnPublier.disabled = false
        return
    }
// Notifier les personnes taguées
    console.log('Tags personnes:', tagsPersonnes)
    if (tagsPersonnes.length > 0) {
        for (const tag of tagsPersonnes) {
            const username = tag.replace('@', '').toLowerCase()
            console.log('Cherche username:', username)
            const { data: profilTagué } = await supabaseClient
                .from('profils')
                .select('user_id, username')
                .eq('username', username)
                .single()

            console.log('Profil trouvé:', profilTagué)

            if (profilTagué && profilTagué.user_id !== user.id) {
                await creerNotification(
                    profilTagué.user_id,
                    'tag',
                    `🏷️ ${user.user_metadata.pseudo || 'Quelqu\'un'} t'a tagué dans "${titre}"`,
                    `article.html?id=${data?.[0]?.id || ''}&src=supabase`
                )
                console.log('Notification envoyée !')
            }
        }
    }

    // Envoyer notifications push aux abonnés
    try {
        const { data: abonnes } = await supabaseClient
            .from('abonnements')
            .select('cible_id')
            .eq('abonne_id', user.id)

        if (abonnes && abonnes.length > 0) {
            const cibleIds = abonnes.map(a => a.cible_id)
            const { data: profils } = await supabaseClient
                .from('profils')
                .select('fcm_token')
                .in('user_id', cibleIds)
                .not('fcm_token', 'is', null)

            const tokens = profils?.map(p => p.fcm_token).filter(Boolean) || []

            if (tokens.length > 0) {
                await fetch('/api/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tokens: tokens,
                        titre: `${user.user_metadata.pseudo || 'Quelqu\'un'} a publié`,
                        corps: titre,
                        lien: `https://zotech.technology/article.html?id=${data?.[0]?.id}&src=supabase`
                    })
                })
            }
        }
    } catch (e) {
        console.log('Erreur notifications:', e)
    }

    afficherMessagePub('succes', '✅ Contenu publié avec succès !')
    setTimeout(() => {
        window.location.href = 'index.html'
    }, 2000)
}

// ===== AFFICHER MESSAGE =====
function afficherMessagePub(type, texte) {
    const msg = document.getElementById('pub-message')
    msg.textContent = texte
    msg.style.color = type === 'succes' ? '#1D9E75' : '#e24b4a'
    msg.style.display = 'block'
}
// ===== VÉRIFIER CONNEXION AU CHARGEMENT =====
window.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabaseClient.auth.getSession()
    
    if (!data.session) {
        document.getElementById('form-publier').style.display = 'none'
        document.getElementById('non-connecte').style.display = 'block'
        return
    }

    document.getElementById('form-publier').style.display = 'block'
    document.getElementById('non-connecte').style.display = 'none'

    const { data: profil } = await supabaseClient
        .from('profils')
        .select('est_admin')
        .eq('user_id', data.session.user.id)
        .single()

    if (profil?.est_admin) {
        const champPub = document.getElementById('champ-pub')
        if (champPub) champPub.style.display = 'block'
    }
})


// ===== PRÉVISUALISATION MULTI-PHOTOS =====
let photosSelectionnees = []

document.addEventListener('DOMContentLoaded', () => {
    const inputPhoto = document.getElementById('pub-image')
    if (inputPhoto) {
        inputPhoto.addEventListener('change', function() {
            for (let fichier of this.files) {
                if (!photosSelectionnees.find(p => p.name === fichier.name)) {
                    photosSelectionnees.push(fichier)
                }
            }
            afficherPrevisualisations()
            this.value = ''
        })
    }
})

function afficherPrevisualisations() {
    const container = document.getElementById('photos-preview')
    if (photosSelectionnees.length === 0) {
        container.innerHTML = ''
        return
    }

    container.innerHTML = `
        <p style="font-size: 0.85rem; color: #a0a0b0; margin-bottom: 0.75rem;">
            ${photosSelectionnees.length} photo(s) sélectionnée(s)
        </p>
        <div class="photos-grid">
            ${photosSelectionnees.map((fichier, index) => `
                <div class="photo-item" id="photo-${index}">
                    <img src="${URL.createObjectURL(fichier)}" alt="${fichier.name}">
                    <button class="photo-supprimer" onclick="supprimerPhoto(${index})">✕</button>
                    <span class="photo-nom">${fichier.name}</span>
                </div>
            `).join('')}
        </div>
    `
}

function supprimerPhoto(index) {
    photosSelectionnees.splice(index, 1)
    afficherPrevisualisations()
}

// ===== TAGS & HASHTAGS =====
let tagsPersonnes = []
let tagsHashtags = []

document.addEventListener('DOMContentLoaded', () => {
    const inputPersonne = document.getElementById('input-personne')
    if (inputPersonne) {
        inputPersonne.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault()
                let valeur = this.value.trim()
                if (valeur && !tagsPersonnes.includes(valeur)) {
                    if (!valeur.startsWith('@')) valeur = '@' + valeur
                    tagsPersonnes.push(valeur)
                    afficherTags('personnes')
                    this.value = ''
                }
            }
        })
    }

    const inputHashtag = document.getElementById('input-hashtag')
    if (inputHashtag) {
        inputHashtag.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault()
                let valeur = this.value.trim()
                if (valeur && !tagsHashtags.includes(valeur)) {
                    if (!valeur.startsWith('#')) valeur = '#' + valeur
                    tagsHashtags.push(valeur)
                    afficherTags('hashtags')
                    this.value = ''
                }
            }
        })
    }
})

function afficherTags(type) {
    if (type === 'personnes') {
        const liste = document.getElementById('tags-personnes-liste')
        liste.innerHTML = tagsPersonnes.map((tag, i) => `
            <span class="tag-item tag-personne">
                ${tag}
                <button onclick="supprimerTag('personnes', ${i})">✕</button>
            </span>
        `).join('')
    } else {
        const liste = document.getElementById('tags-hashtags-liste')
        liste.innerHTML = tagsHashtags.map((tag, i) => `
            <span class="tag-item tag-hashtag">
                ${tag}
                <button onclick="supprimerTag('hashtags', ${i})">✕</button>
            </span>
        `).join('')
    }
}

function supprimerTag(type, index) {
    if (type === 'personnes') {
        tagsPersonnes.splice(index, 1)
        afficherTags('personnes')
    } else {
        tagsHashtags.splice(index, 1)
        afficherTags('hashtags')
    }
}

// ===== VARIABLES ÉDITEUR =====
let formatActuel = 'paysage'
let zoomActuel = 100
let posX = 0, posY = 0
let isDragging = false
let startX, startY

const formats = {
    paysage: { width: '100%', paddingTop: '56.25%', label: '16:9' },
    carre: { width: '100%', paddingTop: '100%', label: '1:1' },
    portrait: { width: '56.25%', paddingTop: '100%', label: '9:16' }
}

// ===== CHOISIR FORMAT =====
function choisirFormat(format, btn) {
    formatActuel = format
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    appliquerFormat()
}

function appliquerFormat() {
    const wrapper = document.getElementById('editeur-canvas-wrapper')
    if (!wrapper) return
    const f = formats[formatActuel]
    wrapper.style.width = f.width
    wrapper.style.paddingTop = f.paddingTop
    if (formatActuel === 'portrait') {
        wrapper.style.margin = '0 auto'
    } else {
        wrapper.style.margin = '0'
    }
}

// ===== PRÉVISUALISER COUVERTURE =====
function previsualiserCouverture(input) {
    const fichier = input.files[0]
    if (!fichier) return

    const reader = new FileReader()
    reader.onload = function(e) {
        const preview = document.getElementById('couverture-preview')
        const container = document.getElementById('couverture-preview-container')
        const editeur = document.getElementById('editeur-image')

        preview.src = e.target.result
        preview.onload = function() {
            container.style.display = 'none'
            editeur.style.display = 'block'
            document.getElementById('upload-zone-couverture').style.cursor = 'default'
            posX = 0
            posY = 0
            zoomActuel = 100
            document.getElementById('zoom-slider').value = 100
            document.getElementById('zoom-value').textContent = '100%'
            appliquerFormat()
            appliquerTransform()
            initialiserDrag()
        }
    }
    reader.readAsDataURL(fichier)
}

// ===== ZOOM =====
function appliquerZoom(valeur) {
    zoomActuel = parseInt(valeur)
    document.getElementById('zoom-value').textContent = zoomActuel + '%'
    appliquerTransform()
}

function appliquerTransform() {
    const preview = document.getElementById('couverture-preview')
    preview.style.transform = `translate(${posX}px, ${posY}px) scale(${zoomActuel / 100})`
    preview.style.transformOrigin = 'center center'
    preview.style.width = '100%'
    preview.style.height = '100%'
    preview.style.objectFit = 'cover'
    preview.style.top = '0'
    preview.style.left = '0'
}

// ===== DRAG =====
function initialiserDrag() {
    const preview = document.getElementById('couverture-preview')

    preview.addEventListener('mousedown', (e) => {
        isDragging = true
        startX = e.clientX - posX
        startY = e.clientY - posY
        preview.style.cursor = 'grabbing'
        e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        posX = e.clientX - startX
        posY = e.clientY - startY
        appliquerTransform()
    })

    document.addEventListener('mouseup', () => {
        isDragging = false
        const preview = document.getElementById('couverture-preview')
        if (preview) preview.style.cursor = 'grab'
    })

    preview.addEventListener('touchstart', (e) => {
        isDragging = true
        startX = e.touches[0].clientX - posX
        startY = e.touches[0].clientY - posY
        e.preventDefault()
    }, { passive: false })

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return
        posX = e.touches[0].clientX - startX
        posY = e.touches[0].clientY - startY
        appliquerTransform()
    }, { passive: false })

    document.addEventListener('touchend', () => {
        isDragging = false
    })
}

// ===== RESET =====
function resetImage() {
    posX = 0
    posY = 0
    zoomActuel = 100
    document.getElementById('zoom-slider').value = 100
    document.getElementById('zoom-value').textContent = '100%'
    appliquerTransform()
}

// ===== CHARGER ARTICLE POUR MODIFICATION =====
async function chargerArticleAModifier() {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (!editId) return

    document.querySelector('.publier-container h1').textContent = '✏️ Modifier la publication'
    document.querySelector('.publier-subtitle').textContent = 'Modifie ton contenu et sauvegarde'
    document.querySelector('.btn-publier').textContent = '💾 Sauvegarder les modifications'

    const { data: article, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('id', editId)
        .single()

    if (error || !article) {
        alert('❌ Article introuvable !')
        window.location.href = 'profil.html'
        return
    }

    document.getElementById('pub-titre').value = article.titre || ''
    document.getElementById('pub-description').value = article.description || ''
    document.getElementById('pub-emoji').value = article.emoji || '✨'
    document.getElementById('pub-tag').value = article.tag || 'IA'

    if (article.type_contenu) {
        selectionnerType(article.type_contenu)
        const btnType = document.getElementById(`type-${article.type_contenu}`)
        if (btnType) {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'))
            btnType.classList.add('active')
        }
    }

    if (article.contenu) {
        document.getElementById('pub-contenu').value = article.contenu
    }

    if (article.url_video) {
        document.getElementById('pub-video').value = article.url_video
    }

    if (article.tags_personnes) {
        tagsPersonnes = article.tags_personnes.split(',').filter(t => t)
        afficherTags('personnes')
    }

    if (article.hashtags) {
        tagsHashtags = article.hashtags.split(',').filter(t => t)
        afficherTags('hashtags')
    }

    if (article.url_couverture) {
        const preview = document.getElementById('couverture-preview')
        const container = document.getElementById('couverture-preview-container')
        const editeur = document.getElementById('editeur-image')
        preview.src = article.url_couverture
        preview.style.display = 'block'
        container.style.display = 'none'
        editeur.style.display = 'block'
    }

    document.querySelector('.btn-publier').onclick = () => sauvegarderModification(editId)
}

// ===== SAUVEGARDER MODIFICATION =====
async function sauvegarderModification(editId) {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) {
        afficherMessagePub('erreur', '❌ Tu dois être connecté !')
        return
    }

    const user = sessionData.session.user
    const titre = document.getElementById('pub-titre').value.trim()
    const description = document.getElementById('pub-description').value.trim()
    const tag = document.getElementById('pub-tag').value
    const emoji = document.getElementById('pub-emoji').value.trim() || '✨'
    const texteContenu = document.getElementById('pub-contenu').value.trim()
    const contenu = convertirTexteEnHTML(texteContenu)

    if (!titre || !description) {
        afficherMessagePub('erreur', '❌ Le titre et la description sont obligatoires !')
        return
    }

    const btnPublier = document.querySelector('.btn-publier')
    btnPublier.textContent = '⏳ Sauvegarde en cours...'
    btnPublier.disabled = true

    let url_couverture = null
    const fichierCouverture = document.getElementById('pub-couverture').files[0]
    if (fichierCouverture) {
        const nomCouverture = `couverture_${user.id}_${Date.now()}`
        const { error: errCouverture } = await supabaseClient.storage
            .from('photo')
            .upload(nomCouverture, fichierCouverture, { upsert: true })

        if (!errCouverture) {
            const { data: urlCouv } = supabaseClient.storage
                .from('photo')
                .getPublicUrl(nomCouverture)
            url_couverture = urlCouv.publicUrl
        }
    }

    const updates = {
        titre,
        description,
        tag,
        emoji,
        contenu,
        tags_personnes: tagsPersonnes.join(','),
        hashtags: tagsHashtags.join(',')
    }

    if (url_couverture) updates.url_couverture = url_couverture

    const { error } = await supabaseClient
        .from('articles')
        .update(updates)
        .eq('id', editId)
        .eq('user_id', user.id)

    if (error) {
        afficherMessagePub('erreur', '❌ Erreur : ' + error.message)
        btnPublier.textContent = '💾 Sauvegarder les modifications'
        btnPublier.disabled = false
        return
    }

    afficherMessagePub('succes', '✅ Publication modifiée avec succès !')
    setTimeout(() => {
        window.location.href = 'profil.html'
    }, 1500)
}

// ===== LANCER AU CHARGEMENT =====
window.addEventListener('load', chargerArticleAModifier)



// ===== CONVERTIR TEXTE EN HTML =====
function convertirTexteEnHTML(texte) {
    const motsCles = ['introduction', 'conclusion', 'résumé', 'resume', 'résultat', 
                      'contexte', 'objectif', 'analyse', 'recommandation', 'synthèse']

    return texte
        .split('\n')
        .map(ligne => {
            ligne = ligne.trim()
            if (!ligne) return ''

            // Titres markdown
            if (ligne.startsWith('### ')) return `<h3>${ligne.replace('### ', '')}</h3>`
            if (ligne.startsWith('## ')) return `<h2>${ligne.replace('## ', '')}</h2>`
            if (ligne.startsWith('# ')) return `<h2>${ligne.replace('# ', '')}</h2>`

            // Liste
            if (ligne.startsWith('- ')) return `<li>${ligne.replace('- ', '')}</li>`

            // Détecter titres automatiquement
            const ligneLower = ligne.toLowerCase()
            const estTitre = motsCles.some(mot => ligneLower.startsWith(mot)) ||
                (ligne.length < 50 && !ligne.includes('.') && !ligne.includes(',') && ligne === ligne.trim())

            if (estTitre) return `<h2>${ligne}</h2>`

            // Texte normal → paragraphe
            return `<p>${ligne}</p>`
        })
        .join('\n')
        .replace(/<\/li>\n<li>/g, '</li><li>')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>/g, '</li></ul>')
        .replace(/<\/ul>\n<ul>/g, '')
}

function previewMiniature(input) {
    const file = input.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        const preview = document.getElementById('preview-miniature')
        preview.src = e.target.result
        preview.style.display = 'block'
        document.getElementById('upload-zone-miniature').style.display = 'none'
    }
    reader.readAsDataURL(file)
}