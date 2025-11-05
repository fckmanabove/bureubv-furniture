document.addEventListener('DOMContentLoaded', () => {

    
    function initOverlayMenu() {
        const burgerBtn = document.querySelector('.burger-menu');
        const menuOverlay = document.querySelector('.menu-overlay');
        if (!burgerBtn || !menuOverlay) return;
        
        function toggleMenu() { document.body.classList.toggle('menu-is-open'); }
        burgerBtn.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', (event) => {
            if (event.target === menuOverlay) { toggleMenu(); }
        });
    }

    
    function initEscapeKeyClose() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && document.body.classList.contains('menu-is-open')) {
                document.body.classList.remove('menu-is-open');
            }
        });
    }
    
    
    function initEmailCopy() {
        const copyBtn = document.querySelector('#email-copy-btn');
        const notification = document.querySelector('#copy-notification');
        if (!copyBtn || !notification) return;
        
        const emailToCopy = 'a.basov@bureaubv.ru';
        copyBtn.addEventListener('click', (event) => {
            event.preventDefault();
            navigator.clipboard.writeText(emailToCopy).then(() => {
                notification.classList.add('show');
                setTimeout(() => { notification.classList.remove('show'); }, 2500);
            }).catch(err => {
                console.error('Не удалось скопировать email: ', err);
            });
        });
    }

    
    function initProjectsSlider() {
        const sliderElement = document.querySelector('#projects-slider');
        if (!sliderElement || typeof Splide === 'undefined') return;

        const splide = new Splide(sliderElement, {
            type: 'slide', perPage: 4, perMove: 1, gap: '30px', pagination: false, arrows: false,
            breakpoints: {
                1400: { perPage: 3 },
                1024: { perPage: 2 },
                768: { perPage: 1, gap: '30px', padding: '12%' }
            }
        });

        const prevArrow = document.querySelector('.splide-arrow--prev');
        const nextArrow = document.querySelector('.splide-arrow--next');
        const currentPageEl = document.querySelector('.splide-pagination-custom__page');
        const totalPagesEl = document.querySelector('.splide-pagination-custom__total');
        const progressBar = document.querySelector('.splide-pagination-custom__bar');

        function updateControls(splideInstance) {
            if (!currentPageEl || !totalPagesEl || !progressBar || !prevArrow || !nextArrow) return;
            const perPage = splideInstance.options.perPage;
            const totalSlides = splideInstance.length;
            const totalPages = totalSlides > perPage ? totalSlides - perPage + 1 : 1;
            const currentPageIndex = splideInstance.index;
            currentPageEl.textContent = currentPageIndex + 1;
            totalPagesEl.textContent = totalPages;
            const progress = totalPages > 1 ? (currentPageIndex / (totalPages - 1)) * 100 : 100;
            progressBar.style.width = `${progress}%`;
            prevArrow.disabled = currentPageIndex === 0;
            nextArrow.disabled = currentPageIndex >= totalPages - 1;
        }

        splide.on('mounted move', () => updateControls(splide));
        if (prevArrow) prevArrow.addEventListener('click', () => splide.go('<'));
        if (nextArrow) nextArrow.addEventListener('click', () => splide.go('>'));
        splide.mount();
    }

    
    function initSmoothScroll() {
        if (typeof Lenis === 'undefined' || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('Lenis или GSAP/ScrollTrigger не найдены.');
            return;
        }

        const lenis = new Lenis();

        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                if (arguments.length) {
                    lenis.scrollTo(value, { duration: 0, immediate: true });
                }
                return lenis.scroll;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            }
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    
    function initGsapAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);
        const animatedElements = gsap.utils.toArray('.fade-in-up');
        
        gsap.set(animatedElements, { y: 50, opacity: 0 });

        ScrollTrigger.batch(animatedElements, {
            start: "top 85%",
            onEnter: batch => {
                gsap.to(batch, {
                    opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.15
                });
            },
            once: true
        });
    }





                    // --- НАЧАЛО БЛОКА ДЛЯ КОПИРОВАНИЯ: ЛОГИКА ФОРМЫ ---

                    // --- Вспомогательные функции для работы с Cookies ---
                    function setCookie(name, value, days) {
                        let expires = "";
                        if (days) {
                            const date = new Date();
                            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                            expires = "; expires=" + date.toUTCString();
                        }
                        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
                    }

                    function getCookie(name) {
                        const nameEQ = name + "=";
                        const ca = document.cookie.split(';');
                        for (let i = 0; i < ca.length; i++) {
                            let c = ca[i];
                            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                        }
                        return null;
                    }

                    // --- Основная логика формы ---
                    function initEditableContactForm() {
                        const form = document.querySelector('#contact-form');
                        if (!form) return;

                        const webhookUrl = 'https://main.devpixelka.ru/webhook/13b79543-e17d-4f51-83ee-4fed3299999c';
                        const submitButton = form.querySelector('#form-submit-btn');
                        const statusMessage = form.querySelector('#form-status');
                        const contactInput = form.querySelector('#contact-info');
                        const messageInput = form.querySelector('#contact-message');
                        
                        const methodSelector = form.querySelector('.contact-method-selector');
                        const methodButtons = form.querySelectorAll('.contact-method-selector button');
                        const hiddenMethodInput = form.querySelector('#contact-method-hidden');
                        const activePill = form.querySelector('.active-method-pill');

                        const COOKIE_NAME = 'last_submission_data';
                        let existingSubmission = null;

                        function movePill(targetButton) {
                            if (!targetButton || !activePill) return;
                            const targetWidth = targetButton.offsetWidth;
                            const targetOffsetLeft = targetButton.offsetLeft;
                            activePill.style.width = `${targetWidth}px`;
                            activePill.style.transform = `translateX(${targetOffsetLeft}px)`;
                        }

                        if (methodSelector) {
                            methodSelector.addEventListener('click', (event) => {
                                const clickedButton = event.target.closest('button');
                                if (!clickedButton) return;
                                methodButtons.forEach(button => button.classList.remove('active'));
                                clickedButton.classList.add('active');
                                hiddenMethodInput.value = clickedButton.dataset.method;
                                movePill(clickedButton);
                            });
                        }

                        const savedDataCookie = getCookie(COOKIE_NAME);
                        if (savedDataCookie) {
                            try {
                                existingSubmission = JSON.parse(savedDataCookie);
                                contactInput.value = existingSubmission.contact;
                                messageInput.value = existingSubmission.message;
                                if (existingSubmission.contact_method) {
                                    hiddenMethodInput.value = existingSubmission.contact_method;
                                    methodButtons.forEach(btn => {
                                        btn.classList.toggle('active', btn.dataset.method === existingSubmission.contact_method);
                                    });
                                }
                                submitButton.textContent = 'Обновить заявку';
                                const title = document.querySelector('.contact-form-section .section-title');
                                if(title) title.textContent = 'Хотите изменить свою заявку?';
                            } catch (e) {
                                console.error("Ошибка парсинга cookie:", e);
                                existingSubmission = null;
                            }
                        }

                        setTimeout(() => {
                            const initialActiveButton = methodSelector.querySelector('button.active');
                            if (initialActiveButton) {
                                activePill.style.transition = 'none';
                                movePill(initialActiveButton);
                                setTimeout(() => { activePill.style.transition = ''; }, 50);
                            }
                        }, 100);

                        form.addEventListener('submit', (event) => {
                            event.preventDefault();
                            const submissionId = existingSubmission ? existingSubmission.submissionId : new Date().getTime();
                            const dataToSend = {
                                contact: contactInput.value,
                                message: messageInput.value,
                                contact_method: hiddenMethodInput.value,
                                submissionId: submissionId,
                                isUpdate: !!existingSubmission,
                                source: 'BUREAUV Furniture Site'
                            };
                            submitButton.disabled = true;
                            submitButton.textContent = 'Отправка...';
                            statusMessage.textContent = '';
                            statusMessage.className = '';

                            fetch(webhookUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(dataToSend)
                            })
                            .then(response => {
                                if (!response.ok) throw new Error('Сервер вернул ошибку.');
                                return response.text();
                            })
                            .then(data => {
                                statusMessage.classList.add('success');
                                if (existingSubmission) {
                                    statusMessage.textContent = 'Ваша заявка успешно обновлена.';
                                    submitButton.textContent = 'Успешно обновлено!';
                                } else {
                                    statusMessage.textContent = 'Заявка отправлена!';
                                    submitButton.textContent = 'Успешно отправлено!';
                                }
                                const dataToSaveInCookie = {
                                    contact: contactInput.value,
                                    message: messageInput.value,
                                    contact_method: hiddenMethodInput.value,
                                    submissionId: submissionId
                                };
                                setCookie(COOKIE_NAME, JSON.stringify(dataToSaveInCookie), 1);
                                existingSubmission = dataToSaveInCookie;
                            })
                            .catch(error => {
                                console.error('Ошибка при отправке формы:', error);
                                statusMessage.textContent = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
                                statusMessage.classList.add('error');
                                submitButton.disabled = false;
                                submitButton.textContent = existingSubmission ? 'Попробовать обновить снова' : 'Попробовать отправить снова';
                            });
                        });
                    }
                    // --- КОНЕЦ БЛОКА ДЛЯ КОПИРОВАНИЯ ---



                                        
                    // ... здесь идут твои функции initSmoothScroll, initGsapAnimations и т.д. ...
                    /**
                     * НОВАЯ ФУНКЦИЯ: Устанавливает случайный фон для страниц, где это необходимо.
                     */
                    function initRandomBackground() {
                        // 1. Ищем на странице специальный элемент для фона
                        const backgroundElement = document.querySelector('.page-background');

                        // 2. Если такого элемента нет - ничего не делаем, выходим из функции
                        if (!backgroundElement) {
                            return;
                        }

                        // 3. Список доступных фоновых изображений
                        const pathPrefix = '../img/'; // Убедись, что путь к папке img правильный
                        const imageFiles = [
                            'gallery_flavi1.png', 
                            'gallery_flavi2.png', 
                            'gallery_lsr1.png', 
                            'gallery_lsr2.png', 
                            'gallery_lsr3.png', 
                            'gallery_flavi3.png', 
                            'gallery_flavi5.png', 
                            'gallery_lsr4.png'
                        ];
                        const images = imageFiles.map(file => pathPrefix + file);

                        // 4. Выбираем случайное изображение из списка
                        const randomImage = images[Math.floor(Math.random() * images.length)];

                        // 5. Устанавливаем его как фон с помощью GSAP
                        gsap.set(backgroundElement, {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: -1, // Помещаем фон позади всего контента
                            backgroundImage: `url(${randomImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 1 // Убедимся, что фон видим
                        });
                    }


    // --- ЗАПУСК ВСЕХ ФУНКЦИЙ ---
    initOverlayMenu();
    initEscapeKeyClose();
    initEmailCopy();
    initProjectsSlider();
    initSmoothScroll();
    initGsapAnimations();
    initEditableContactForm();
    initRandomBackground();

});