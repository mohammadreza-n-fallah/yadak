document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("wpls-modal");
    if (!modal) return;

    const storiesData = JSON.parse(modal.getAttribute("data-stories"));
    const circles = document.querySelectorAll(".wpls-circle");
    const mediaEl = document.getElementById("wpls-media");
    const linkEl = document.getElementById("wpls-link");
    const progressContainer = document.querySelector(".wpls-progress-container");
    const closeBtn = document.querySelector(".wpls-close");
    
    let currentIndex = 0;
    let timer;
    let progressAnim;

    // Create Progress Bars
    storiesData.forEach(() => {
        const bar = document.createElement('div');
        bar.className = 'wpls-progress-bar';
        bar.innerHTML = '<div class="wpls-progress-fill"></div>';
        progressContainer.appendChild(bar);
    });
    const progressFills = document.querySelectorAll(".wpls-progress-fill");

    function openStory(index) {
        if (index >= storiesData.length) {
            closeStory();
            return;
        }
        if (index < 0) index = 0;
        
        currentIndex = index;
        const story = storiesData[currentIndex];
        
                // بررسی فرمت لینک برای تشخیص ویدئو
        const isVideo = story.media.match(/\.(mp4|webm|ogg)$/i);
        
        // حذف ویدیوی استوری قبلی (اگر وجود داشت)
        let existingVideo = mediaEl.parentNode.querySelector('video.wpls-video-tag');
        if (existingVideo) existingVideo.remove();

        if (isVideo) {
            mediaEl.style.display = "none"; // مخفی کردن تگ img
            const videoEl = document.createElement("video");
            videoEl.className = "wpls-video-tag";
            videoEl.src = story.media;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.style.width = "100%";
            videoEl.style.height = "100%";
            videoEl.style.objectFit = "cover";
            // اضافه کردن ویدئو به کنار تگ عکس
            mediaEl.parentNode.insertBefore(videoEl, mediaEl);
        } else {
            mediaEl.style.display = "block"; // نمایش تگ img
            mediaEl.src = story.media;
        }

        
        if (story.link) {
            linkEl.href = story.link;
            linkEl.innerText = story.btnText;
            linkEl.style.display = "block";
        } else {
            linkEl.style.display = "none";
        }

        modal.classList.add("active");
        updateProgressBars();
        startTimer(story.duration); // ارسال زمان اختصاصی هر استوری
    }

    function updateProgressBars() {
        progressFills.forEach((fill, i) => {
            fill.style.transition = "none";
            if (i < currentIndex) fill.style.width = "100%";
            else if (i > currentIndex) fill.style.width = "0%";
            else fill.style.width = "0%";
        });
    }

    function startTimer(duration) {
        clearTimeout(timer);
        cancelAnimationFrame(progressAnim);
        
        let start = null;
        const fill = progressFills[currentIndex];
        
        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            fill.style.width = Math.min((progress / duration) * 100, 100) + "%";
            
            if (progress < duration) {
                progressAnim = requestAnimationFrame(step);
            }
        }
        progressAnim = requestAnimationFrame(step);
        
        timer = setTimeout(() => {
            openStory(currentIndex + 1);
        }, duration);
    }

        function closeStory() {
        modal.classList.remove("active");
        clearTimeout(timer);
        cancelAnimationFrame(progressAnim);
        mediaEl.src = "";
        
        // توقف و حذف ویدئو هنگام بستن استوری
        let existingVideo = mediaEl.parentNode.querySelector('video.wpls-video-tag');
        if (existingVideo) {
            existingVideo.pause();
            existingVideo.remove();
        }
    }


    circles.forEach(circle => {
        circle.addEventListener("click", function() {
            openStory(parseInt(this.getAttribute("data-index")));
        });
    });

    closeBtn.addEventListener("click", closeStory);
    document.querySelector(".wpls-nav-left").addEventListener("click", () => { openStory(currentIndex - 1); });
    document.querySelector(".wpls-nav-right").addEventListener("click", () => { openStory(currentIndex + 1); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStory(); });
});
window.addEventListener('load', function() {
    // پیدا کردن کانتینر لودینگ و استوری‌ها
    const skeletonWrapper = document.querySelector('.wpls-skeleton-wrapper');
    const mainWrapper = document.querySelector('.wpls-wrapper');

    // اگر هر دو عنصر وجود داشتند، لودینگ را مخفی کن و استوری‌ها را نمایش بده
    if (skeletonWrapper && mainWrapper) {
        skeletonWrapper.style.display = 'none';
        
        mainWrapper.style.display = 'flex';
        mainWrapper.style.visibility = 'visible';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.wpls-circles-container');
    if(!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // سرعت اسکرول (می‌توانید تغییر دهید)
        slider.scrollLeft = scrollLeft - walk;
    });
});
