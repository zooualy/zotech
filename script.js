// ===== CRÉER UNE CARTE ARTICLE =====
function creerCarte(article) {
    let imageHtml = ''
    if (article.type_contenu === 'video' && article.url_video) {
        let videoId = ''
        if (article.url_video.includes('embed/')) {
            videoId = article.url_video.split('embed/')[1].split('?')[0]
        } else if (article.url_video.includes('watch?v=')) {
            videoId = article.url_video.split('watch?v=')[1].split('&')[0]
        } else if (article.url_video.includes('youtu.be/')) {
            videoId = article.url_video.split('youtu.be/')[1].split('?')[0]
        }
        const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
        imageHtml = thumbnail
            ? `<div class="card-image" style="background-image:url(${thumbnail}); background-size:cover; background-position:center;"></div>`
            : `<div class="card-image">🎥</div>`
    } else if (article.type_contenu === 'photo' && article.url_image) {
        const premierePhoto = article.url_image.split(',')[0]
        imageHtml = `<div class="card-image" style="background-image:url(${premierePhoto}); background-size:cover; background-position:center;"></div>`
    } else if (article.url_couverture) {
        imageHtml = `<div class="card-image" style="background-image:url(${article.url_couverture}); background-size:cover; background-position:center;"></div>`
    } else {
        imageHtml = `<div class="card-image">${article.emoji || '📝'}</div>`
    }

    const photoAuteur = article.photo_auteur
        ? `<img src="${article.photo_auteur}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : (article.auteur || '?').charAt(0).toUpperCase()

    const bgAuteur = article.photo_auteur ? 'background:none;' : ''
    const lienAuteur = article.username_auteur ? `profil.html?u=${article.username_auteur}` : '#'
    const src = article.source || 'supabase'

    return `
        <div class="card" onclick="ouvrirArticle(${article.id}, '${src}')" style="cursor:pointer">
            ${imageHtml}
            <div class="card-content">
                <span class="card-tag">${article.tag}</span>
                <h3 class="card-title">${article.titre}</h3>
                <p class="card-desc">${article.description}</p>
                <div class="card-footer">
                    <a href="${lienAuteur}" onclick="event.stopPropagation()" class="card-auteur-link">
                        <div class="card-auteur-avatar" style="${bgAuteur}">
                            ${photoAuteur}
                        </div>
                        <div>
                            <div style="font-size:0.85rem; font-weight:500; color:#ffffff;">${article.auteur}</div>
                            <div style="font-size:0.75rem; color:#7c3aed;">@${article.username_auteur || ''}</div>
                        </div>
                    </a>
                    <span style="font-size:0.8rem;">📅 ${article.date || new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" onclick="event.stopPropagation(); partagerArticle(${article.id}, '${article.titre.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <button class="card-action-btn" onclick="event.stopPropagation(); ouvrirArticle(${article.id}, '${src}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="card-action-btn" onclick="event.stopPropagation(); signalerContenu('article', ${article.id})" style="color:#e24b4a;">
                        <i class="fa-solid fa-flag"></i>
                    </button>
                </div>
            </div>
        </div>
    `
}

// ===== AFFICHER LES ARTICLES =====
async function afficherArticles() {
    const featured = document.getElementById('featured-posts')
    const latest = document.getElementById('latest-posts')
    if (!featured || !latest) return

    try {
        const { data: articlesSupabase } = await supabaseClient
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        const userIds = [...new Set((articlesSupabase || []).filter(a => a.user_id).map(a => a.user_id))]
        let profilsAuteurs = {}

        if (userIds.length > 0) {
            const { data: profils } = await supabaseClient
                .from('profils')
                .select('user_id, photo_profil, username')
                .in('user_id', userIds)
            if (profils) profils.forEach(p => profilsAuteurs[p.user_id] = p)
        }

        const articlesFormates = (articlesSupabase || []).map(a => ({
            id: a.id,
            titre: a.titre,
            description: a.description,
            tag: a.tag,
            emoji: a.emoji,
            auteur: a.auteur,
            date: new Date(a.created_at).toLocaleDateString('fr-FR'),
            created_at: a.created_at,
            featured: a.featured,
            url_couverture: a.url_couverture,
            url_video: a.url_video,
            url_image: a.url_image,
            type_contenu: a.type_contenu,
            username_auteur: a.username_auteur || profilsAuteurs[a.user_id]?.username || '',
            photo_auteur: profilsAuteurs[a.user_id]?.photo_profil || '',
            source: 'supabase'
        }))

        const articlesUne = articlesFormates.filter(a => a.featured)
        const autresArticles = articlesFormates.filter(a => !a.est_pub)

        window._autresArticles = autresArticles

        if (articlesUne.length > 0) {
            featured.innerHTML = articlesUne.map(creerCarte).join('')
            initialiserCarousel()
        } else {
            featured.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">Aucun article à la une pour le moment</div>'
        }

        if (autresArticles.length > 0) {
            latest.innerHTML = autresArticles.map(creerCarte).join('')
        } else {
            latest.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">Aucun article pour le moment</div>'
        }

    } catch(e) {
        console.log('Erreur Supabase:', e)
    }
}

// ===== OUVRIR UN ARTICLE =====
function ouvrirArticle(id, source) {
    if (source === 'supabase') {
        window.location.href = `article.html?id=${id}&src=supabase`
    } else {
        window.location.href = `article.html?id=${id}&src=local`
    }
}

// ===== TRIER ARTICLES =====
function trierArticles(tri) {
    const latest = document.getElementById('latest-posts')
    if (!latest || !window._autresArticles) return

    let articlesTries = [...window._autresArticles]

    if (tri === 'recent') {
        articlesTries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (tri === 'ancien') {
        articlesTries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (tri === 'tag') {
        articlesTries.sort((a, b) => (a.tag || '').localeCompare(b.tag || ''))
    }

    latest.innerHTML = articlesTries.map(creerCarte).join('')
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
        sessionStorage.setItem('zotech_page', window.location.pathname)
    }
})

window.addEventListener('load', () => {
    const savedPage = sessionStorage.getItem('zotech_page')
    const savedScroll = sessionStorage.getItem('zotech_scroll')
    if (savedScroll && savedPage === window.location.pathname) {
        setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' })
            sessionStorage.removeItem('zotech_scroll')
            sessionStorage.removeItem('zotech_page')
        }, 800)
    }
})

// ===== LANCER =====
document.addEventListener('DOMContentLoaded', async function() {
    await afficherArticles()

    // Newsletter
    const btnNewsletter = document.querySelector('.newsletter-form .btn-primary')
    const emailInput = document.getElementById('email-input')
    if (btnNewsletter && emailInput) {
        btnNewsletter.addEventListener('click', function() {
            const email = emailInput.value
            if (email && email.includes('@')) {
                afficherToast('Merci ! Tu es abonné avec : ' + email, 'succes')
                emailInput.value = ''
            } else {
                afficherToast('Entre une adresse email valide !', 'erreur')
            }
        })
    }
})

// ===== CAROUSEL =====
let carouselIndex = 0
let carouselTotal = 0
let carouselInterval = null

function initialiserCarousel() {
    const track = document.getElementById('featured-posts')
    const dots = document.getElementById('carousel-dots')
    if (!track || !dots) return

    carouselTotal = track.children.length
    if (carouselTotal === 0) return

    carouselIndex = 0

    dots.innerHTML = Array.from({ length: carouselTotal }, (_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="allerCarousel(${i})"></button>
    `).join('')

    if (carouselInterval) {
        clearInterval(carouselInterval)
        carouselInterval = null
    }

    carouselInterval = setInterval(() => {
        carouselNext()
    }, 6000)

    const wrapper = track.parentElement
    wrapper.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval)
        carouselInterval = null
    })
    wrapper.addEventListener('mouseleave', () => {
        if (!carouselInterval) {
            carouselInterval = setInterval(() => carouselNext(), 6000)
        }
    })
}

function allerCarousel(index) {
    const track = document.getElementById('featured-posts')
    const dots = document.getElementById('carousel-dots')
    if (!track) return

    carouselIndex = index
    track.style.transform = `translateX(-${carouselIndex * 100}%)`

    if (dots) {
        dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
            d.classList.toggle('active', i === carouselIndex)
        })
    }
}

function carouselNext() {
    if (carouselTotal === 0) return
    allerCarousel((carouselIndex + 1) % carouselTotal)
}

function carouselPrev() {
    if (carouselTotal === 0) return
    allerCarousel((carouselIndex - 1 + carouselTotal) % carouselTotal)
}