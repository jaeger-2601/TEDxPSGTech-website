const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    
    burger.addEventListener('click',()=>{
        nav.classList.toggle('nav-active');

        //animation for links
        navLinks.forEach((link, index) =>{
            if(link.style.animation) {
                link.style.animation = ``;
            }
            else {
            link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.75}s`;
            }
        });

        // Burger animation
        burger.classList.toggle('toggle');
    });
    nav.addEventListener('click',()=>{
        nav.classList.toggle('nav-deactive');
    });
}

navSlide();


// circular carousel

window.addEventListener('load', () => {
	var
		carousels = document.querySelectorAll('.carousel')
	;

	for (var i = 0; i < carousels.length; i++) {
		carousel(carousels[i]);
	}
});

function carousel(root) {
	var
		figure = root.querySelector('figure'),
		nav = root.querySelector('nav'),
		images = figure.children,
		n = images.length,
		gap = root.dataset.gap || 0,
		bfc = 'bfc' in root.dataset,
		
		theta =  2 * Math.PI / n,
		currImage = 0
	;
	
	setupCarousel(n, parseFloat(getComputedStyle(images[0]).width));
	window.addEventListener('resize', () => { 
		setupCarousel(n, parseFloat(getComputedStyle(images[0]).width)) 
	});

	setupNavigation();

	function setupCarousel(n, s) {
		var	
			apothem = s / (2 * Math.tan(Math.PI / n))
		;
		
		figure.style.transformOrigin = `50% 50% ${- apothem}px`;

		for (var i = 0; i < n; i++)
			images[i].style.padding = `${gap}px`;
		for (i = 1; i < n; i++) {
			images[i].style.transformOrigin = `50% 50% ${- apothem}px`;
			images[i].style.transform = `rotateY(${i * theta}rad)`;
		}
		if (bfc)
			for (i = 0; i < n; i++)
				 images[i].style.backfaceVisibility = 'hidden';
		
		rotateCarousel(currImage);
	}

	function setupNavigation() {
		nav.addEventListener('click', onClick, true);
		
		function onClick(e) {
			e.stopPropagation();
			
			var t = e.target;
			if (t.tagName.toUpperCase() != 'BUTTON')
				return;
			
			if (t.classList.contains('next')) {
				currImage++;
			}
			else {
				currImage--;
			}
			
			rotateCarousel(currImage);
		}
			
	}

	function rotateCarousel(imageIndex) {
		figure.style.transform = `rotateY(${imageIndex * -theta}rad)`;
	}
	
}


/* 
window.addEventListener('load', () => {
	var
		carousels = document.querySelectorAll('.carousel')
	;
	for (var i = 0; i < carousels.length; i++) {
		carousel(carousels[i]);
	}
});

function carousel(root) {
	var
		figure = root.querySelector('figure'),
		nav = root.querySelector('nav'),
		images = figure.children,
		n = images.length,
		gap = root.dataset.gap || 0,
		bfc = 'bfc' in root.dataset,
		
		theta = 2 * Math.PI / (n),
		currImage = 0
	;
	for(var i=0; i<n;i++)
		console.log(images[i]);
	
	setupCarousel(n, parseFloat(getComputedStyle(images[1]).width));
	window.addEventListener('resize', () => { 
		setupCarousel(n, parseFloat(getComputedStyle(images[1]).width)) 
	});

	setupNavigation();

	function setupCarousel(n, s) {
		var	
			apothem = s / (2 * Math.tan(Math.PI / (n)))
		;
		
		figure.style.transformOrigin = `50% 50% ${- apothem}px`;

		for (var i = 1; i < n; i+=2)
			images[i].style.padding = `${gap}px`;
		for (i = 1; i < n; i+=2) {
			images[i].style.transformOrigin = `50% 50% ${- apothem}px`;
			images[i].style.transform = `rotateY(${i * theta}rad)`;
		}
		if (bfc)
			for (i = 1; i < n; i+=2)
				 images[i].style.backfaceVisibility = 'hidden';
		
		rotateCarousel(currImage);
	}

	function setupNavigation() {
		nav.addEventListener('click', onClick, true);
		
		function onClick(e) {
			e.stopPropagation();
			
			var t = e.target;
			if (t.tagName.toUpperCase() != 'BUTTON')
				return;
			
			if (t.classList.contains('next')) {
				currImage++;
			}
			else {
				currImage--;
			}
			
			rotateCarousel(currImage);
		}
			
	}

	function rotateCarousel(imageIndex) {
		figure.style.transform = `rotateY(${imageIndex * -theta}rad)`;
	}
	
}

 */