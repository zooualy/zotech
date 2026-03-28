// ===== CONFIGURATION DES CATÉGORIES =====
const categories = {
    'TutorielAstuce': {
        emoji: '📚',
        titre: 'Tutoriels & Astuces',
        desc: 'Tutoriels pratiques et astuces pour gagner du temps au quotidien',
        couleur: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&q=80'
    },
    'IA': {
        emoji: '🤖',
        titre: 'IA & Tech',
        desc: 'Tout sur l\'intelligence artificielle et les nouvelles technologies',
        couleur: '#1D9E75',
        image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80'
    },
    'Tech': {
        emoji: '💻',
        titre: 'Tech',
        desc: 'Les dernières actualités tech du moment',
        couleur: '#378ADD',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80'
    },
    'News': {
        emoji: '📰',
        titre: 'News',
        desc: 'Les dernières nouvelles de l\'IA et de la tech',
        couleur: '#e24b4a',
        image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'
    },
    'Tutoriel': {
        emoji: '📚',
        titre: 'Tutoriels',
        desc: 'Apprends pas à pas avec nos tutoriels simples et pratiques',
        couleur: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&q=80'
    },
    'Astuce': {
        emoji: '⚡',
        titre: 'Astuces',
        desc: 'Des astuces pratiques pour gagner du temps au quotidien',
        couleur: '#EF9F27',
        image: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1200&q=80'
    }
}

// ===== DONNÉES ARTICLES =====
let tousLesArticles = []
let filtreActuel = 'tous'
let categorieActuelle = ''

// ===== INITIALISER LA PAGE =====
async function initialiserCategorie() {
    const params = new URLSearchParams(window.location.search)
    categorieActuelle = params.get('cat') || 'Tutoriel'

    const config = categories[categorieActuelle] || {
        emoji: '📁',
        titre: categorieActuelle,
        desc: 'Tous les contenus de cette catégorie'
    }

    document.getElementById('categorie-emoji').textContent = config.emoji
    document.getElementById('categorie-titre').textContent = config.titre
    document.getElementById('categorie-desc').textContent = config.desc
    document.title = config.titre + ' - ZoTech'

    if (config.image) {
        const hero = document.getElementById('categorie-hero')
        hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${config.image})`
        hero.style.backgroundSize = 'cover'
        hero.style.backgroundPosition = 'center'
        hero.style.backgroundRepeat = 'no-repeat'
    }

    document.querySelectorAll('.nav-links a').forEach(a => {
        if (a.href.includes(categorieActuelle)) {
            a.style.color = '#ffffff'
            a.style.fontWeight = '600'
        }
    })

    await chargerArticles()
}

// ===== CHARGER LES ARTICLES =====
async function chargerArticles() {
    document.getElementById('categorie-grid').innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#a0a0b0;">
            <div style="font-size:2rem;">⏳</div>
            <p>Chargement...</p>
        </div>
    `

    const articlesLocaux = typeof articles !== 'undefined'
        ? articles.filter(a =>
            a.tag === categorieActuelle ||
            (categorieActuelle === 'IA' && (a.tag === 'IA' || a.tag === 'Tech')) ||
            (categorieActuelle === 'TutorielAstuce' && (a.tag === 'Tutoriel' || a.tag === 'Astuce'))
        )
        : []

   let query = supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (categorieActuelle === 'IA') {
        query = query.in('tag', ['IA', 'Tech'])
    } else if (categorieActuelle === 'TutorielAstuce') {
        query = query.in('tag', ['Tutoriel', 'Astuce'])
    } else {
        query = query.eq('tag', categorieActuelle)
    }

    const { data: articlesSupabase } = await query

    const userIds = [...new Set((articlesSupabase || []).filter(a => a.user_id).map(a => a.user_id))]
    let profilsAuteurs = {}

    if (userIds.length > 0) {
        const { data: profils } = await supabaseClient
            .from('profils')
            .select('user_id, photo_profil, username')
            .in('user_id', userIds)
        if (profils) profils.forEach(p => profilsAuteurs[p.user_id] = p)
    }

    const articlesLocauxAvecDate = articlesLocaux.map((a, i) => ({
        ...a,
        source: 'local',
        created_at: a.created_at || new Date(2026, 2, 10 - i).toISOString()
    }))

    const articlesSupabaseFormates = (articlesSupabase || []).map(a => ({
        ...a,
        source: 'supabase',
        username_auteur: a.username_auteur || profilsAuteurs[a.user_id]?.username || '',
        photo_auteur: profilsAuteurs[a.user_id]?.photo_profil || ''
    }))

    // Combiner et trier par date décroissante
    tousLesArticles = [...articlesSupabaseFormates, ...articlesLocauxAvecDate]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    afficherArticlesFiltres()
}

// ===== FILTRER =====
function filtrer(type) {
    filtreActuel = type
    document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'))
    event.target.classList.add('active')
    afficherArticlesFiltres()
}

// ===== TRIER CATÉGORIE =====
function trierCategorie(tri) {
    let articlesTries = [...tousLesArticles]

    if (tri === 'recent') {
        articlesTries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (tri === 'ancien') {
        articlesTries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (tri === 'tag') {
        articlesTries.sort((a, b) => (a.tag || '').localeCompare(b.tag || ''))
    }

    tousLesArticles = articlesTries
    afficherArticlesFiltres()
}

// ===== AFFICHER ARTICLES FILTRÉS =====
function afficherArticlesFiltres() {
    let articlesFiltres = tousLesArticles

    if (filtreActuel !== 'tous') {
        articlesFiltres = tousLesArticles.filter(a => a.type_contenu === filtreActuel)
    }

    const grid = document.getElementById('categorie-grid')
    const nombre = document.getElementById('nombre-resultats')

    nombre.textContent = `${articlesFiltres.length} contenu(s) trouvé(s)`

    if (articlesFiltres.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:4rem; color:#a0a0b0;">
                <div style="font-size:3rem;">😕</div>
                <p>Aucun contenu dans cette catégorie pour le moment</p>
                <a href="publier.html" class="btn-primary" style="display:inline-block; margin-top:1rem;">
                    ✍️ Sois le premier à publier !
                </a>
            </div>
        `
        return
    }

    grid.innerHTML = articlesFiltres.map(a => {
      let imageHtml = ''
        if (a.type_contenu === 'video' && a.url_video) {
           let videoId = ''
            if (a.url_video.includes('embed/')) {
                videoId = a.url_video.split('embed/')[1].split('?')[0]
            } else if (a.url_video.includes('watch?v=')) {
                videoId = a.url_video.split('watch?v=')[1].split('&')[0]
            } else if (a.url_video.includes('youtu.be/')) {
                videoId = a.url_video.split('youtu.be/')[1].split('?')[0]
            }
            const thumbnail = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : ''
            imageHtml = thumbnail
                ? `<div class="card-image" style="background-image:url(${thumbnail}); background-size:cover; background-position:center;"></div>`
                : `<div class="card-image">🎥</div>`
        } else if (a.type_contenu === 'photo' && a.url_image) {
            const premierePhoto = a.url_image.split(',')[0]
            imageHtml = `<div class="card-image" style="background-image:url(${premierePhoto}); background-size:cover; background-position:center;"></div>`
        } else if (a.url_couverture) {
            imageHtml = `<div class="card-image" style="background-image:url(${a.url_couverture}); background-size:cover; background-position:center;"></div>`
        } else {
            imageHtml = `<div class="card-image">${a.emoji || '📝'}</div>`
        } 

        const photoAuteur = a.photo_auteur
            ? `<img src="${a.photo_auteur}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : (a.auteur || '?').charAt(0).toUpperCase()

        const bgAuteur = a.photo_auteur ? 'background:none;' : ''
        const lienAuteur = a.username_auteur ? `profil.html?u=${a.username_auteur}` : '#'
        const src = a.source || 'local'

        return `
            <div class="card" onclick="ouvrirArticle(${a.id}, '${src}')" style="cursor:pointer">
                ${imageHtml}
                <div class="card-content">
                    <span class="card-tag">${a.tag}</span>
                    <h3 class="card-title">${a.titre}</h3>
                    <p class="card-desc">${a.description}</p>
                    <div class="card-footer">
                        <a href="${lienAuteur}" onclick="event.stopPropagation()" class="card-auteur-link">
                            <div class="card-auteur-avatar" style="${bgAuteur}">
                                ${photoAuteur}
                            </div>
                            <div>
                                <div style="font-size:0.85rem; font-weight:500; color:#ffffff;">${a.auteur}</div>
                                <div style="font-size:0.75rem; color:#7c3aed;">@${a.username_auteur || ''}</div>
                            </div>
                        </a>
                        <span style="font-size:0.8rem;">📅 ${new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                   <button class="card-action-btn" onclick="event.stopPropagation(); partagerArticle(${a.id}, '${(a.titre || '').replace(/'/g, "\\'")}')">
    <i class="fa-solid fa-link"></i>
</button>
<button class="card-action-btn" onclick="event.stopPropagation(); ouvrirArticle(${a.id}, '${src}')">
    <i class="fa-solid fa-eye"></i>
</button>

                    </div>
                </div>
            </div>
        `
    }).join('')
}

// ===== OUVRIR ARTICLE =====
function ouvrirArticle(id, source) {
    if (source === 'supabase') {
        window.location.href = `article.html?id=${id}&src=supabase`
    } else {
        window.location.href = `article.html?id=${id}&src=local`
    }
}

// ===== PARTAGER ARTICLE =====
function partagerArticle(id, titre) {
    const url = `${window.location.origin}/article.html?id=${id}`
    if (navigator.share) {
        navigator.share({
            title: titre + ' — ZoTech',
            text: 'Découvre cet article sur ZoTech !',
            url: url
        })
    } else {
        navigator.clipboard.writeText(url)
        afficherToast('Lien copié !', 'succes')
    }
}

// ===== SCROLL =====
document.addEventListener('click', (e) => {
    const card = e.target.closest('.card')
    if (card) {
        sessionStorage.setItem('zotech_scroll', window.scrollY)
        sessionStorage.setItem('zotech_page', window.location.pathname + window.location.search)
    }
})

async function restaurerScrollCategorie() {
    const savedPage = sessionStorage.getItem('zotech_page')
    const savedScroll = sessionStorage.getItem('zotech_scroll')
    if (savedScroll && savedPage === window.location.pathname + window.location.search) {
        await new Promise(resolve => setTimeout(resolve, 1200))
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' })
        sessionStorage.removeItem('zotech_scroll')
        sessionStorage.removeItem('zotech_page')
    }
}

window.addEventListener('load', restaurerScrollCategorie)
window.addEventListener('load', initialiserCategorie)