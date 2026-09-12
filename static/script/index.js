let carouselState = 1;
const carouselWhole = document.getElementById('carousel-wrapper');
const transformer = document.getElementById('transformer');
const buttonsContainer = document.getElementById('carousel-buttons');
const carouselBtns = buttonsContainer.querySelectorAll('button');
let interactFreeze = false;

let carouselIntervalId;
startCarousel();

function startCarousel() {
    carouselIntervalId = setInterval(doCarousel, 5000);
}

function switchCarouselTo(index) {
    // Return if the index is outside the bounds of the array
    if(index < 0 || index > carouselBtns.length)
        return;

    let buttonIdx = index;

    // Special case to handle the very last item
    // Instead of going to the start, switch to the last item (same as the first one), then after the transition happened
    // Immediately switch to the first one, creating an illusion of always going to the right
    if(index == carouselBtns.length) {
        buttonIdx = 0;

        // If we're at the last item, create the illusion by immediately switching to the first item
        setTimeout(() => {
            const original = transformer.style.transition;
            transformer.style.transition = 'none';
            transformer.style.transform = 'translate(0)';
        
            setTimeout(() => transformer.style.transition = original, 20);
            carouselState = 1;
        }, 500);
    }

    carouselBtns.forEach((e, i) => e.classList.toggle('active', i == buttonIdx));
    transformer.style.transform = `translate(calc(${index} * (-100% - 80px)))`;
}

function doCarousel() {
    if(document.hidden)
        return;

    switchCarouselTo(carouselState);
    carouselState++;

    if(carouselState > carouselBtns.length)
        carouselState = 0;
}

function changeCarousel(index) {
    if(interactFreeze)
        return;

    if (carouselState == carouselBtns.length - 1 && index == 0)
        index = carouselBtns.length;

    switchCarouselTo(carouselState = index);

    interactFreeze = true;
    setTimeout(() => interactFreeze = false, 500);
}

function itemClick(element) {
    navigate(`/termek?v=${element.dataset.productId}`)
}

const carouselEnter = () => { clearInterval(carouselIntervalId); console.log('Cleared');};
const carouselExit = () => {startCarousel(); console.log('Restarted');};

carouselWhole.addEventListener('mouseenter', carouselEnter);
carouselWhole.addEventListener('mouseleave', carouselExit);