/**
 * CaptionCraft - Interactive Scripts
 * Darkroom aesthetic with smooth interactions
 */

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const demoPreview = document.getElementById('demoPreview');
const previewImage = document.getElementById('previewImage');
const previewCaption = document.getElementById('previewCaption');
const changeImageBtn = document.getElementById('changeImage');
const regenerateBtn = document.getElementById('regenerateCaption');
const captionText = document.querySelector('.caption-text');
const heroCaptionText = document.querySelector('.photo-caption .caption-text');

// Sample captions for the typing animation
const sampleCaptions = [
    "在群山的怀抱中，我找到了内心的平静...",
    "日落时分的金色光芒，是大自然最温柔的告别...",
    "每一次旅行，都是与自己的一次重逢...",
    "山川湖海，不及此刻心中的澎湃...",
    "站在世界之巅，感受风的自由..."
];

// Sample captions for demo
const demoCaptions = [
    "在这片壮丽的风景中，时光仿佛静止了...",
    "大自然的画笔，勾勒出最动人的画卷...",
    "每一步攀登，都是为了更好的风景...",
    "远山的呼唤，是心灵最深处的向往...",
    "云海翻涌间，看见生命的辽阔..."
];

// Typing animation function
function typeWriter(element, text, speed = 80) {
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed + Math.random() * 40);
            } else {
                resolve();
            }
        }

        type();
    });
}

// Start hero caption animation
async function animateHeroCaption() {
    if (!heroCaptionText) return;

    const captions = [
        "远山呼唤，心灵归处...",
        "群山之中，遇见宁静...",
        "登高望远，心随云动..."
    ];

    let index = 0;

    while (true) {
        await typeWriter(heroCaptionText, captions[index], 100);
        await new Promise(r => setTimeout(r, 3000));

        // Clear effect
        for (let i = captions[index].length; i >= 0; i--) {
            heroCaptionText.textContent = captions[index].substring(0, i);
            await new Promise(r => setTimeout(r, 30));
        }

        await new Promise(r => setTimeout(r, 500));
        index = (index + 1) % captions.length;
    }
}

// Initialize hero animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateHeroCaption, 1000);
});

// File Upload Handling
if (uploadArea && fileInput) {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.parentElement.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.parentElement.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.parentElement.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// Handle file upload
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件（JPG、PNG、WebP）');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        showPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Show preview with caption generation
function showPreview(imageSrc) {
    if (!previewImage || !demoPreview || !uploadArea) return;

    previewImage.src = imageSrc;
    uploadArea.parentElement.style.display = 'none';
    demoPreview.style.display = 'block';

    // Reset caption
    previewCaption.innerHTML = '正在分析图片<span class="loading-dots">...</span>';

    // Simulate AI processing
    setTimeout(() => {
        previewCaption.innerHTML = '正在生成字幕<span class="loading-dots">...</span>';
    }, 1500);

    // Generate random caption
    setTimeout(() => {
        const randomCaption = demoCaptions[Math.floor(Math.random() * demoCaptions.length)];
        typeWriterEffect(previewCaption, randomCaption);
    }, 3000);
}

// Type writer effect for preview caption
function typeWriterEffect(element, text) {
    element.innerHTML = '';
    element.style.fontFamily = 'var(--font-mono)';

    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, 60);
        }
    }
    type();
}

// Change image button
if (changeImageBtn && fileInput) {
    changeImageBtn.addEventListener('click', () => {
        fileInput.click();
    });
}

// Regenerate caption button
if (regenerateBtn && previewCaption) {
    regenerateBtn.addEventListener('click', () => {
        previewCaption.innerHTML = '正在重新生成<span class="loading-dots">...</span>';

        setTimeout(() => {
            const randomCaption = demoCaptions[Math.floor(Math.random() * demoCaptions.length)];
            typeWriterEffect(previewCaption, randomCaption);
        }, 1500);
    });
}

// Handle new file selection when preview is shown
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0 && demoPreview.style.display !== 'none') {
            handleFile(e.target.files[0]);
        }
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.style.background = 'rgba(13, 12, 11, 0.95)';
        nav.style.backdropFilter = 'blur(20px)';
    } else {
        nav.style.background = 'linear-gradient(to bottom, var(--color-bg-primary) 0%, transparent 100%)';
        nav.style.backdropFilter = 'blur(10px)';
    }

    lastScroll = currentScroll;
});

// Intersection Observer for scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards and steps
document.querySelectorAll('.feature-card, .step').forEach(el => {
    observer.observe(el);
});

// Parallax effect for hero visual
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && !window.matchMedia('(pointer: coarse)').matches) {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        heroVisual.style.transform = `translate(${x}px, ${y}px)`;
    });
}

// Button click feedback
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(212, 165, 116, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + U to focus upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        uploadArea?.click();
    }
});

// Prefers reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.feature-card, .step').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.animation = 'none';
    });
}

// Console greeting
console.log('%c CaptionCraft ', 'background: #d4a574; color: #0d0c0b; font-size: 20px; font-weight: bold; padding: 8px 16px; border-radius: 8px;');
console.log('%c 让每一张照片都有故事 ', 'color: #a8a39a; font-size: 14px;');
