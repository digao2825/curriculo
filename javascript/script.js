/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}
const track = document.getElementById('carouselTrack');
const prevButton = document.getElementById('prevBtn');
const nextButton = document.getElementById('nextBtn');
const originalItems = document.querySelectorAll('.carousel-item');

const gap = 20; // Deve ser idêntico ao 'gap' do CSS
let itemsInView = window.innerWidth <= 768 ? 1 : 3;

// 1. Clonagem dos elementos para criar o efeito infinito estável
originalItems.forEach(item => {
    const cloneAfter = item.cloneNode(true);
    track.appendChild(cloneAfter); // Clona para o final
});

for (let i = originalItems.length - 1; i >= 0; i--) {
    const cloneBefore = originalItems[i].cloneNode(true);
    track.insertBefore(cloneBefore, track.firstChild); // Clona para o início
}

// Atualiza a lista com os clones inclusos
const allItems = document.querySelectorAll('.carousel-item');

// O índice inicial deve começar logo após os primeiros clones inseridos no início
let currentIndex = originalItems.length; 
let isTransitioning = false;

// Função para posicionar instantaneamente o carrossel sem animação
function setPositionWithoutAnimation() {
    track.style.transition = 'none';
    const itemWidth = originalItems[0].getBoundingClientRect().width;
    const amountToMove = currentIndex * (itemWidth + gap);
    track.style.transform = `translateX(-${amountToMove}px)`;
}

// Função para mover com transição suave
function moveCarousel() {
    if (isTransitioning) return;
    track.style.transition = 'transform 0.4s ease-in-out';
    const itemWidth = originalItems[0].getBoundingClientRect().width;
    const amountToMove = currentIndex * (itemWidth + gap);
    track.style.transform = `translateX(-${amountToMove}px)`;
}

// Verifica se atingiu as bordas clonadas para resetar a posição invisivelmente
track.addEventListener('transitionend', () => {
    isTransitioning = false;
    
    // Se chegou nos clones do final, pula de volta para o início real
    if (currentIndex >= originalItems.length * 2) {
        currentIndex = originalItems.length;
        setPositionWithoutAnimation();
    }
    
    // Se chegou nos clones do começo, pula para o fim real
    if (currentIndex < originalItems.length) {
        currentIndex = originalItems.length * 2 - 1;
        setPositionWithoutAnimation();
    }
});

// Botão Avançar
nextButton.addEventListener('click', () => {
    if (isTransitioning) return;
    currentIndex++;
    moveCarousel();
});

// Botão Voltar
prevButton.addEventListener('click', () => {
    if (isTransitioning) return;
    currentIndex--;
    moveCarousel();
});

// Ajusta a exibição inicial e lida com redimensionamento de tela
function init() {
    itemsInView = window.innerWidth <= 768 ? 1 : 3;
    setPositionWithoutAnimation();
}

window.addEventListener('resize', () => {
    setTimeout(init, 100);
});
function getItemsInView() {
    return window.innerWidth <= 768 ? 1 : 2; // Alterado de 3 para 2 para casar com o CSS largo
}
// Inicializa a posição correta na primeira carga
init();