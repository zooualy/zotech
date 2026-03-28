// ===== SYSTÈME TOAST =====
function afficherToast(message, type = 'succes', duree = 3000) {
    // Supprimer toast existant
    const existant = document.querySelector('.toast')
    if (existant) existant.remove()

    const toast = document.createElement('div')
    toast.className = `toast ${type}`

    const icone = type === 'succes' ? '<i class="fa-solid fa-circle-check" style="color:#1D9E75;"></i>' :
                  type === 'erreur' ? '<i class="fa-solid fa-circle-xmark" style="color:#e24b4a;"></i>' :
                  '<i class="fa-solid fa-circle-info" style="color:#7c3aed;"></i>'

    toast.innerHTML = `${icone} ${message}`
    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('visible'), 10)
    setTimeout(() => {
        toast.classList.remove('visible')
        setTimeout(() => toast.remove(), 300)
    }, duree)
}