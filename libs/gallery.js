const GalleryClassName = 'gallery';
const GalleryLineClassName = 'gallery-line';
const GalleryDraggableClassName = 'gallery-draggable';  // cursor when dragging
const GallerySlideClassName = 'gallery-slide';

class Gallery {
    constructor(element, options = {}) {
        this.containerNode = element;
        // console.log(this.containerNode);
        this.size = element.childElementCount;  // count of slides
        this.currentSlide = 2;  // slide by default
        this.currentSlideWasChanged = false;
        this.settings = {
            margin: options.margin || 0
        }

        this.manageHTML = this.manageHTML.bind(this); // to bind context 'this' to method
        this.setParameters = this.setParameters.bind(this); // to bind context 'this' to method
        this.setEvents = this.setEvents.bind(this); // to bind context 'this' to method
        this.resizeGallery = this.resizeGallery.bind(this); // to bind context 'this' to method
        this.startDrag = this.startDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.dragging = this.dragging.bind(this);
        this.setStylePosition = this.setStylePosition.bind(this);
        this.destroyEvents = this.destroyEvents.bind(this);

        this.manageHTML(); // call the method
        this.setParameters();
        this.setEvents();
    }

    manageHTML() {
        this.containerNode.classList.add(GalleryClassName);
        // set innerHTML for div with class 'gallery' and put there innerHTML from div with class 'gallery'
        this.containerNode.innerHTML = `    
            <div class="${GalleryLineClassName}">
                ${this.containerNode.innerHTML}
            </div>
        `;

        // get the inner element from this.containerNode by selector
        this.lineNode = this.containerNode.querySelector(`.${GalleryLineClassName}`);

        /* get the lineNode children elements and put them into Array, then map them,
         as we can't map  pseudo-array of Nodes - and put them in slideNodes Array 
         children - are divs with class 'slide' inside the created div 'gallery-line'*/
        this.slideNodes = Array.from(this.lineNode.children).map((childNode) => 
            // function call new wrapped Node - deconstruct sended params
            wrapElementByDiv({
                element: childNode,
                className: GallerySlideClassName
            }) 
        );
    }

    setParameters() {
        const coordsContainer = this.containerNode.getBoundingClientRect();
        // this.containerNode width set to this.width prop
        this.width = coordsContainer.width; 

        // maximum offset(coords change) on X axis
        this.maximumX = -(this.size -1) * (this.width + this.settings.margin);
        
        // set the X axis shift - default value
        this.x = -this.currentSlide * (this.width + this.settings.margin);

        this.resetStyleTransition();   // reset parameters
        // lineNode width equal child elements count * this.width
        this.lineNode.style.width = `${this.size * (this.width + this.settings.margin)}px`;
        this.setStylePosition();

        //set the width for each slide
        Array.from(this.slideNodes).forEach((slideNode) => {
            slideNode.style.width = `${this.width}px`
            slideNode.style.marginRight = `${this.settings.margin}px`
        });
    }

    setEvents() {
        this.debounceResizedGallery = debounce(this.resizeGallery);
        /* if user resize browser window, send event into debounce and 
        resizeGallery functions */
        window.addEventListener('resize', this.debounceResizedGallery);
        // drag-n-drop listeners
        this.lineNode.addEventListener('pointerdown', this.startDrag);
        window.addEventListener('pointerup', this.stopDrag);

        window.addEventListener('pointercancel', this.stopDrag)
    }
    
    // destroy eventListener method - after closing slider(in modal window for example) - FUTURE USE
    destroyEvents() {
        window.removeEventListener('resize', this.debounceResizedGallery);
        this.lineNode.removeEventListener('pointerdown', this.startDrag);
        window.removeEventListener('pointerup', this.stopDrag);
        window.removeEventListener('pointercancel', this.stopDrag)
    }

    // call recalculation of slides width when resizing
    // get 'event' from debounce
    resizeGallery() {
        this.setParameters();
    }

    startDrag(event) { 
        this.currentSlideWasChanged = false;
        // get the pointer coords on X axis when start dragging - where clicked
        this.clickX = event.pageX;
        // console.log(this.clickX);
        this.start = this.x;
        this.resetStyleTransition(); // reset before new drag event

        this.containerNode.classList.add(GalleryDraggableClassName);
        window.addEventListener('pointermove', this.dragging);
    }

    stopDrag() {
        window.removeEventListener('pointermove', this.dragging);

        // console.log(this.currentSlide);
        this.x = -this.currentSlide * (this.width + this.settings.margin);

        this.containerNode.classList.remove(GalleryDraggableClassName);

        this.setStylePosition();
        this.setStyleTransition();
    }

    dragging(event) {
        // get the pointer coords on X axis during dragging and set the 'dragShift' - new position after dragging
        this.dragX = event.pageX;
        // console.log(this.dragX);
        const dragShift = this.dragX - this.clickX;
        console.log(dragShift);
        // delay when dragging edge slides (оттяжка(задержка) при драге крайних слайдов)
        const easing = dragShift / 5;  // 5 times fewer
        // get the 
        this.x = Math.max(Math.min(this.start + dragShift, easing), this.maximumX + easing);
        this.setStylePosition();
        

        //Change active slide
        // to the left
        if(
            dragShift > 20 &&
            // dragShift > 0 &&
            !this.currentSlideWasChanged &&   // check if current slide was changed already, false by default
            this.currentSlide > 0
        ) {
            this.currentSlideWasChanged = true;
            this.currentSlide =  this.currentSlide - 1;
        }
        // to the right
        if(
            dragShift < -20 &&
            // dragShift < 0 &&
            !this.currentSlideWasChanged &&   // check if current slide was changed already, false by default
            this.currentSlide < this.size - 1
        ) {
            this.currentSlideWasChanged = true;
            this.currentSlide =  this.currentSlide + 1;
        }
    }
    
    // change 'lineNode' shift on X axis
    setStylePosition() {
        this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
    }

    setStyleTransition() {
        this.lineNode.style.transition = `all 0.25s ease 0s`;
    }

    resetStyleTransition() {
        this.lineNode.style.transition = `all 0s ease 0s`
    }
}

//HELPERS

// Wrappers for slides
function wrapElementByDiv({element, className}) {
    const wrapperNode = document.createElement('div');  // create new wrapper for each 'element' == slide
    wrapperNode.classList.add(className);  // add class to wrapper - 'gallery-slide'
    // put into the DOM
    element.parentNode.insertBefore(wrapperNode, element); // put the wrapper before 'element'
    wrapperNode.appendChild(element);  // put the 'element' inside and append to the end of wrapperNode
    return wrapperNode;
}

// Delay in eventListener calling  - 
// 'debounce' gets event from listener and send it down
function debounce(func, time = 100) {
    let timer;
    return ((event) => {   // send event to the 'func'
        clearTimeout(timer);
        timer = setTimeout(func, time, event); // 'event' pass to the 'func'
    })
}