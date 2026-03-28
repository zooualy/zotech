// ===== SYSTÈME DE CONFIRMATION =====
function ouvrirConfirm(options) {
    const { icone, titre, message, texteBouton, couleur, onConfirm } = options

    document.getElementById('confirm-icone').textContent = icone || '⚠️'
    document.getElementById('confirm-titre').textContent = titre || 'Confirmation'
    document.getElementById('confirm-message').textContent = message || 'Es-tu sûr ?'

    const btnOk = document.getElementById('confirm-btn-ok')
    btnOk.textContent = texteBouton || 'Confirmer'
    btnOk.className = 'confirm-btn-confirmer'
    if (couleur === 'violet') btnOk.classList.add('violet')

    btnOk.onclick = () => {
        fermerConfirm()
        onConfirm()
    }

    document.getElementById('confirm-overlay').classList.add('ouvert')
}

function fermerConfirm() {
    document.getElementById('confirm-overlay').classList.remove('ouvert')
}

// Fermer si on clique dehors
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('confirm-overlay')
    if (e.target === overlay) fermerConfirm()
})