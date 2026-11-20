import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ==========================================
// NEBULA — ORGANIZED CINEMATIC 3D EXPERIENCE
// ==========================================

// DOM / SCENE
const container = document.getElementById('scene-container');

if (!container) {
    throw new Error('NEBULA: #scene-container was not found in index.html');
}

const scene = new THREE.Scene();

// ==========================================
// CAMERA & CAMERA VARIABLES
// ==========================================

const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.z = 9;

let scrollProgress = 0;
let cameraZoomOffset = 0;

let planetFocusActive = false;
let planetFocusProgress = 0;
let planetFocusTarget = 0;

const planetFocusDistance = 3.8;


// ==========================================
// RENDERER — PERFORMANCE OPTIMIZED
// ==========================================

const renderer = new THREE.WebGLRenderer({

    alpha: true,
    antialias: false,
    powerPreference: "high-performance"

});

// Pixel ratio limit for better performance
renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.25)
);

// Initial canvas size
renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

// Color settings
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.25;

// Performance settings
renderer.info.autoReset = true;

// Add renderer to scene
container.appendChild(renderer.domElement);


// ==========================================
// MAIN PLANET GROUP
// ==========================================

const planetGroup = new THREE.Group();
scene.add(planetGroup);

// ==========================================
// PLANET SURFACE SHADER
// ==========================================

const planetGeometry = new THREE.SphereGeometry(1.65, 128, 128);


const planetMaterial = new THREE.ShaderMaterial({

    uniforms: {
        uTime: { value: 0 },
        uLight: {
            value: new THREE.Vector3(-1.0, 1.0, 2.0)
        }
    },

    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {

            vNormal = normalize(normalMatrix * normal);

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

            vPosition = position;
            vViewPosition = -mvPosition.xyz;

            gl_Position = projectionMatrix * mvPosition;

        }
    `,

    fragmentShader: `
        uniform float uTime;
        uniform vec3 uLight;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        float hash(vec3 p) {

            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;

            return fract(
                p.x * p.y * p.z *
                (p.x + p.y + p.z)
            );

        }

        float noise(vec3 p) {

            vec3 i = floor(p);
            vec3 f = fract(p);

            f = f * f * (3.0 - 2.0 * f);

            return mix(
                mix(
                    mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                    mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
                    f.y
                ),

                mix(
                    mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                    mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
                    f.y
                ),

                f.z
            );

        }

        void main() {

            vec3 normal = normalize(vNormal);
            vec3 viewDirection = normalize(vViewPosition);

            // PROCEDURAL SURFACE
            float n1 = noise(vPosition * 3.0 + uTime * 0.04);
            float n2 = noise(vPosition * 6.0 - uTime * 0.03);
            float n3 = noise(vPosition * 12.0);

            float surface = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;

            // COLOR PALETTE
            vec3 deepPurple = vec3(0.07, 0.015, 0.16);
            vec3 midPurple = vec3(0.25, 0.06, 0.52);
            vec3 brightPurple = vec3(0.58, 0.28, 0.95);
            vec3 lavender = vec3(0.85, 0.68, 1.0);

            vec3 color = mix(
                deepPurple,
                midPurple,
                smoothstep(0.25, 0.65, surface)
            );

            color = mix(
                color,
                brightPurple,
                smoothstep(0.52, 0.78, surface)
            );

            color = mix(
                color,
                lavender,
                smoothstep(0.77, 0.92, surface)
            );

            // CINEMATIC LIGHT
            vec3 lightDirection = normalize(uLight);

            float diffuse = max(dot(normal, lightDirection), 0.0);

            float softLight = smoothstep(-0.35, 0.65, dot(normal, lightDirection));

            float nightSide = 1.0 - diffuse;

            float lighting = mix(0.12, 1.15, softLight);

            // SOFT SHADOW TRANSITION
            float terminator = smoothstep(
                -0.18,
                0.32,
                dot(normal, lightDirection)
            );

            vec3 shadowColor = vec3(0.025, 0.008, 0.07);
            vec3 lightColor = vec3(0.72, 0.48, 1.0);

            color = mix(
                shadowColor,
                color * lightColor,
                terminator
            );

            color *= lighting;

            // ATMOSPHERIC RIM
            float fresnel = 1.0 - max(
                dot(normal, viewDirection),
                0.0
            );

            fresnel = pow(fresnel, 3.2);

            vec3 rimColor = vec3(0.55, 0.20, 1.0);

            color += rimColor * fresnel * 0.75;

            // NIGHT SIDE VIOLET GLOW
            color += vec3(0.18, 0.04, 0.42) * nightSide * 0.22;

            // SURFACE ENERGY
            float energy = sin(vPosition.y * 16.0 + uTime * 1.2);
            energy *= sin(vPosition.x * 12.0 - uTime);
            energy = smoothstep(0.65, 1.0, energy);

            color += vec3(0.42, 0.12, 0.8) * energy * 0.12;

            // FINAL COLOR
            gl_FragColor = vec4(color, 1.0);

        }
    `
});


const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planetGroup.add(planet);

// ==========================================
// ATMOSPHERE
// ==========================================

const atmosphereGeometry = new THREE.SphereGeometry(1.76, 64, 64);

const atmosphereMaterial = new THREE.ShaderMaterial({

    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,

    uniforms: {
        uPulse: { value: 0.65 }
    },

    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {

            vNormal = normalize(normalMatrix * normal);

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

            vViewPosition = -mvPosition.xyz;

            gl_Position = projectionMatrix * mvPosition;

        }
    `,

    fragmentShader: `
        uniform float uPulse;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {

            float fresnel = dot(
                normalize(vNormal),
                normalize(vViewPosition)
            );

            fresnel = 1.0 - abs(fresnel);
            fresnel = pow(fresnel, 3.0);

            vec3 atmosphereColor = vec3(0.55, 0.20, 1.0);

            gl_FragColor = vec4(
                atmosphereColor,
                fresnel * uPulse
            );

        }
    `
});

const atmosphere = new THREE.Mesh(
    atmosphereGeometry,
    atmosphereMaterial
);

planetGroup.add(atmosphere);

// ==========================================
// OUTER GLOW
// ==========================================

const glowGeometry = new THREE.SphereGeometry(2.15, 48, 48);

const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x6419d8,
    transparent: true,
    opacity: 0.055,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const glow = new THREE.Mesh(glowGeometry, glowMaterial);
planetGroup.add(glow);

// ==========================================
// ORBIT RINGS
// ==========================================

function createRing(radius, thickness, color, opacity, rx, ry) {

    const geometry = new THREE.TorusGeometry(
        radius,
        thickness,
        8,
        180
    );

    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);

    ring.rotation.x = rx;
    ring.rotation.y = ry;

    planetGroup.add(ring);

    return ring;

}

const ringOne = createRing(
    2.2, 0.009, 0xb77aff, 0.45, 1.05, 0.4
);

const ringTwo = createRing(
    2.65, 0.006, 0x7040c9, 0.28, 1.4, -0.55
);

// ==========================================
// PLANET ENERGY ARCS
// ==========================================

const energyArcGroup = new THREE.Group();

function createEnergyArc(radius, color, opacity, startAngle, arcLength) {

    const geometry = new THREE.TorusGeometry(
        radius,
        0.012,
        8,
        120,
        startAngle,
        arcLength
    );

    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const arc = new THREE.Mesh(geometry, material);

    return arc;
}

// Arc 1
const energyArcOne = createEnergyArc(
    2.35, 0x9b55ff, 0.85, 0.2, 1.5
);

// Arc 2
const energyArcTwo = createEnergyArc(
    2.48, 0x5c9dff, 0.65, 3.2, 1.2
);

// Arc 3
const energyArcThree = createEnergyArc(
    2.55, 0xc78aff, 0.45, 4.8, 0.9
);

energyArcGroup.add(
    energyArcOne,
    energyArcTwo,
    energyArcThree
);

energyArcGroup.rotation.x = 1.15;
energyArcGroup.rotation.y = 0.35;

planetGroup.add(energyArcGroup);

// ==========================================
// COSMIC ENERGY PARTICLES
// ==========================================

const energyParticleGroup = new THREE.Group();

const energyParticleCount = 350;

const energyParticlePositions = new Float32Array(
    energyParticleCount * 3
);

for (let i = 0; i < energyParticleCount; i++) {

    const radius = 2.1 + Math.random() * 1.2;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    energyParticlePositions[i * 3] =
        radius * Math.sin(phi) * Math.cos(theta);

    energyParticlePositions[i * 3 + 1] =
        radius * Math.sin(phi) * Math.sin(theta);

    energyParticlePositions[i * 3 + 2] =
        radius * Math.cos(phi);

}

const energyParticleGeometry = new THREE.BufferGeometry();

energyParticleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(energyParticlePositions, 3)
);

const energyParticleMaterial = new THREE.PointsMaterial({

    color: 0xb98aff,
    size: 0.035,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false

});

const cosmicParticles = new THREE.Points(
    energyParticleGeometry,
    energyParticleMaterial
);

energyParticleGroup.add(cosmicParticles);

planetGroup.add(energyParticleGroup);

// ==========================================
// ORBITING OBJECTS
// ==========================================

const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 32, 32),
    new THREE.MeshStandardMaterial({
        color: 0xe2caff,
        emissive: 0x9c50ff,
        emissiveIntensity: 2.5
    })
);

planetGroup.add(moon);

const satellite = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 24, 24),
    new THREE.MeshBasicMaterial({
        color: 0xffffff
    })
);

planetGroup.add(satellite);

// ==========================================
// LIGHTING
// ==========================================

scene.add(new THREE.AmbientLight(0xffffff, 1.1));

const mainLight = new THREE.PointLight(
    0xb77aff,
    55,
    30
);

mainLight.position.set(3, 4, 5);
scene.add(mainLight);

const secondaryLight = new THREE.PointLight(
    0x4714c9,
    40,
    25
);

secondaryLight.position.set(-4, -3, -2);
scene.add(secondaryLight);

// ==========================================
// SPACE PARTICLES
// ==========================================

const particleCount = 1100;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {

    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

}

const particleGeometry = new THREE.BufferGeometry();

particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
    color: 0xc5a3ff,
    size: 0.022,
    transparent: true,
    opacity: 0.7
});

const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
);

scene.add(particles);

// ==========================================
// MOUSE INTERACTION
// ==========================================

let mouseX = 0;
let mouseY = 0;

let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (event) => {

    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;

    targetX = mouseX * 0.35;
    targetY = mouseY * 0.25;

});

// ==========================================
// SHARED CLOCK & MAIN ANIMATION
// ==========================================

const clock = new THREE.Clock();


// ==========================================
// NEBULA — OPTIMIZED ANIMATION LOOP
// ==========================================

function animate() {

    requestAnimationFrame(animate);

    // TIME
    const elapsed = clock.getElapsedTime();

    // ATMOSPHERE PULSE
    const pulse =
        0.48 + Math.sin(elapsed * 1.2) * 0.20;

    atmosphereMaterial.uniforms.uPulse.value = pulse;

    // PLANET SHADER
    planetMaterial.uniforms.uTime.value = elapsed;

    // ENERGY ARC MOTION
    energyArcGroup.rotation.y = elapsed * 0.15;
    energyArcGroup.rotation.z = elapsed * 0.05;

    // CAMERA FOCUS
    planetFocusProgress +=
        (planetFocusTarget - planetFocusProgress) * 0.045;

    const focusZoom =
        planetFocusProgress * planetFocusDistance;

    camera.position.z =
        9 - scrollProgress * 1.1 + cameraZoomOffset - focusZoom;

    // PLANET ROTATION
    planet.rotation.y = elapsed * 0.12;
    planet.rotation.x = Math.sin(elapsed * 0.2) * 0.08;

    // FLOATING MOVEMENT
    planetGroup.position.y =
        Math.sin(elapsed * 0.7) * 0.13;

    // MOUSE REACTION
    planetGroup.rotation.y +=
        (targetX - planetGroup.rotation.y) * 0.018;

    planetGroup.rotation.x +=
        (-targetY - planetGroup.rotation.x) * 0.018;

    // RING ROTATION
    ringOne.rotation.z = elapsed * 0.1;
    ringTwo.rotation.z = -elapsed * 0.07;

    // MOON ORBIT
    moon.position.x =
        Math.cos(elapsed * 0.65) * 2.35;

    moon.position.z =
        Math.sin(elapsed * 0.65) * 2.35;

    moon.position.y =
        Math.sin(elapsed * 0.8) * 0.55;

    // SATELLITE ORBIT
    satellite.position.x =
        Math.cos(elapsed * -0.45) * 2.8;

    satellite.position.z =
        Math.sin(elapsed * -0.45) * 2.8;

    satellite.position.y =
        Math.cos(elapsed * 0.5) * 0.7;

    // PARTICLE MOVEMENT
    particles.rotation.y = elapsed * 0.012;

    particles.rotation.x =
        Math.sin(elapsed * 0.1) * 0.025;

    // RENDER
    renderer.render(scene, camera);

}

animate();

// ==========================================
// RESPONSIVE — OPTIMIZED
// ==========================================

window.addEventListener('resize', () => {

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Prevent invalid canvas dimensions
    if (width <= 0 || height <= 0) return;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(width, height);

    // Maintain optimized pixel ratio
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.25)
    );

});


// ==========================================
// LOADER
// ==========================================

window.addEventListener('load', () => {

    setTimeout(() => {

        const loader = document.getElementById('loader');

        if (loader) {
            loader.classList.add('hide');
        }

    }, 1600);

});

// ==========================================
// SCROLL PROGRESS BAR
// ==========================================

const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

function updateScrollProgress() {

    const scrollTop = window.scrollY;

    const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;

    const progress =
        scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    progressBar.style.width = progress + '%';

}

window.addEventListener('scroll', updateScrollProgress);
updateScrollProgress();

// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================

const navbar = document.querySelector('.navbar');

function updateNavbar() {

    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

}

window.addEventListener('scroll', updateNavbar);
updateNavbar();

// ==========================================
// SCROLL REVEAL
// ==========================================

const revealElements = document.querySelectorAll(
    '.section-heading, .universe-card, .about-content, .about-visual, .final-content'
);

revealElements.forEach((element, index) => {

    element.classList.add('reveal');

    if (element.classList.contains('universe-card')) {

        element.style.setProperty(
            '--delay',
            (index % 3) * 0.15 + 's'
        );

    }

});

const revealObserver = new IntersectionObserver((entries) => {

    entries.forEach((entry) => {

        if (entry.isIntersecting) {

            entry.target.classList.add('show');
            revealObserver.unobserve(entry.target);

        }

    });

}, {
    threshold: 0.15
});

revealElements.forEach((element) => {
    revealObserver.observe(element);
});

// ==========================================
// 3D CARD TILT
// ==========================================

const cards = document.querySelectorAll('.universe-card');

cards.forEach((card) => {

    card.addEventListener('mousemove', (event) => {

        if (window.innerWidth <= 600) return;

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform =
            `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;

    });

    card.addEventListener('mouseleave', () => {

        card.style.transform =
            'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';

    });

});

// ==========================================
// ABOUT SECTION PARALLAX
// ==========================================

const aboutVisual = document.querySelector('.about-visual');
const aboutCore = document.querySelector('.about-core');
const aboutOrbits = document.querySelectorAll('.about-orbit');

if (aboutVisual) {

    aboutVisual.addEventListener('mousemove', (event) => {

        if (window.innerWidth <= 600) return;

        const rect = aboutVisual.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        if (aboutCore) {

            aboutCore.style.transform =
                `translate(${x * 30}px, ${y * 30}px)`;

        }

        aboutOrbits.forEach((orbit, index) => {

            orbit.style.transform =
                `translate(${x * (index + 1) * 10}px, ${y * (index + 1) * 10}px)`;

        });

    });

    aboutVisual.addEventListener('mouseleave', () => {

        if (aboutCore) {
            aboutCore.style.transform = '';
        }

        aboutOrbits.forEach((orbit) => {
            orbit.style.transform = '';
        });

    });

}

// ==========================================
// FINAL HEADING MOVEMENT
// ==========================================

const finalSection = document.querySelector('.final-section');
const finalContent = document.querySelector('.final-content');

if (finalSection && finalContent) {

    finalSection.addEventListener('mousemove', (event) => {

        const rect = finalSection.getBoundingClientRect();

        const x = (event.clientX - rect.left - rect.width / 2) * 0.012;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.012;

        finalContent.style.transform =
            `translate(${x}px, ${y}px)`;

    });

    finalSection.addEventListener('mouseleave', () => {

        finalContent.style.transform = '';

    });

}

// ==========================================
// CINEMATIC SCROLL EXPERIENCE
// ==========================================

function handleCinematicScroll() {

    const maxScroll = 900;

    scrollProgress = Math.min(window.scrollY / maxScroll, 1);

    // Planet shift
    planetGroup.position.x = scrollProgress * 0.65;

    // Planet scale
    const scale = 1 + scrollProgress * 0.18;
    planetGroup.scale.set(scale, scale, scale);

    // Glow
    glow.material.opacity = 0.055 + scrollProgress * 0.035;

    // Light intensity
    mainLight.intensity = 55 + scrollProgress * 12;

}

window.addEventListener('scroll', handleCinematicScroll);
handleCinematicScroll();

// ==========================================
// UPGRADE 04 — FLOATING ASTEROID FIELD
// ==========================================

const asteroidField = new THREE.Group();
scene.add(asteroidField);

const asteroidData = [];

const asteroidColors = [
    0x38205f,
    0x52327c,
    0x211536,
    0x7650a8,
    0x302447
];

for (let i = 0; i < 22; i++) {

    const geometry = new THREE.IcosahedronGeometry(
        Math.random() * 0.22 + 0.12,
        1
    );

    const vertices = geometry.attributes.position;

    for (let j = 0; j < vertices.count; j++) {

        const randomShape = 0.82 + Math.random() * 0.38;

        vertices.setXYZ(
            j,
            vertices.getX(j) * randomShape,
            vertices.getY(j) * randomShape,
            vertices.getZ(j) * randomShape
        );

    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: asteroidColors[
            Math.floor(Math.random() * asteroidColors.length)
        ],
        roughness: 0.92,
        metalness: 0.18,
        emissive: 0x24103e,
        emissiveIntensity: 0.18
    });

    const asteroid = new THREE.Mesh(geometry, material);

    const angle = Math.random() * Math.PI * 2;
    const radius = 4.2 + Math.random() * 3.4;

    asteroid.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 5,
        Math.sin(angle) * radius
    );

    asteroid.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    asteroidField.add(asteroid);

    asteroidData.push({
        object: asteroid,

        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.008,
            y: (Math.random() - 0.5) * 0.012,
            z: (Math.random() - 0.5) * 0.008
        },

        floatSpeed: Math.random() * 0.6 + 0.3,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: asteroid.position.y
    });

}

// Asteroid animation
function animateAsteroidField() {

    requestAnimationFrame(animateAsteroidField);

    const time = clock.getElapsedTime();

    asteroidData.forEach((data) => {

        const asteroid = data.object;

        asteroid.rotation.x += data.rotationSpeed.x;
        asteroid.rotation.y += data.rotationSpeed.y;
        asteroid.rotation.z += data.rotationSpeed.z;

        asteroid.position.y =
            data.originalY +
            Math.sin(time * data.floatSpeed + data.floatOffset) * 0.18;

    });

    asteroidField.rotation.y = time * 0.025;

    asteroidField.position.copy(planetGroup.position);
    asteroidField.scale.copy(planetGroup.scale);

}

animateAsteroidField();

// ==========================================
// UPGRADE 05 — CINEMATIC STAR DEPTH
// ==========================================

const starLayers = [];

function createStarLayer(count, spread, size, opacity) {

    const geometry = new THREE.BufferGeometry();
    const starPositions = [];

    for (let i = 0; i < count; i++) {

        starPositions.push(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );

    }

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starPositions, 3)
    );

    const material = new THREE.PointsMaterial({
        color: 0xcbb5ff,
        size: size,
        transparent: true,
        opacity: opacity,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(geometry, material);

    scene.add(stars);

    starLayers.push({
        object: stars,
        speed: Math.random() * 0.0008 + 0.0003
    });

}

createStarLayer(350, 90, 0.045, 0.65);
createStarLayer(180, 65, 0.075, 0.85);
createStarLayer(80, 45, 0.11, 1);

// Star movement
function animateStarLayers() {

    requestAnimationFrame(animateStarLayers);

    starLayers.forEach((layer, index) => {

        layer.object.rotation.y += layer.speed;
        layer.object.rotation.x += layer.speed * 0.3;

        layer.object.position.y =
            Math.sin(clock.getElapsedTime() * 0.12 + index) * 0.12;

    });

}

animateStarLayers();

// ==========================================
// UPGRADE 06 — SMOOTH MOUSE PARALLAX
// ==========================================

let mouseTargetX = 0;
let mouseTargetY = 0;

let smoothMouseX = 0;
let smoothMouseY = 0;

window.addEventListener('mousemove', (event) => {

    mouseTargetX = (event.clientX / window.innerWidth - 0.5) * 1.2;
    mouseTargetY = (event.clientY / window.innerHeight - 0.5) * 0.8;

});

window.addEventListener('mouseleave', () => {

    mouseTargetX = 0;
    mouseTargetY = 0;

});

function nebulaMouseExperience() {

    requestAnimationFrame(nebulaMouseExperience);

    smoothMouseX += (mouseTargetX - smoothMouseX) * 0.025;
    smoothMouseY += (mouseTargetY - smoothMouseY) * 0.025;

    camera.position.x = smoothMouseX;
    camera.position.y = -smoothMouseY;

    camera.lookAt(0, 0, 0);

}

nebulaMouseExperience();

// ==========================================
// UPGRADE 08 — CINEMATIC LOADER
// ==========================================

const nebulaLoader = document.createElement('div');
nebulaLoader.id = 'nebula-cinematic-loader';

nebulaLoader.innerHTML = `
    <div class="loader-core">
        <div class="loader-ring"></div>
        <div class="loader-ring-two"></div>
        <div class="loader-center"></div>
    </div>

    <div class="loader-brand">NEBULA</div>

    <div class="loader-caption">
        EXPLORING THE UNIVERSE
    </div>

    <div class="loader-track">
        <div class="loader-progress"></div>
    </div>

    <div class="loader-percent">0%</div>
`;

document.body.appendChild(nebulaLoader);

const loaderProgress = nebulaLoader.querySelector('.loader-progress');
const loaderPercent = nebulaLoader.querySelector('.loader-percent');

let loaderStart = null;
const loaderDuration = 2400;

function animateNebulaLoader(timestamp) {

    if (!loaderStart) {
        loaderStart = timestamp;
    }

    const elapsed = timestamp - loaderStart;
    const progress = Math.min(elapsed / loaderDuration, 1);
    const percentage = Math.floor(progress * 100);

    loaderProgress.style.width = percentage + '%';
    loaderPercent.textContent = percentage + '%';

    if (progress < 1) {

        requestAnimationFrame(animateNebulaLoader);

    } else {

        setTimeout(() => {

            nebulaLoader.classList.add('loader-hidden');

            setTimeout(() => {
                nebulaLoader.remove();
            }, 900);

        }, 350);

    }

}

requestAnimationFrame(animateNebulaLoader);

// ==========================================
// UPGRADE 09 — CURSOR INTERACTION
// ==========================================

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {

    const cursorDot = document.createElement('div');
    const cursorRing = document.createElement('div');

    cursorDot.className = 'nebula-cursor-dot';
    cursorRing.className = 'nebula-cursor-ring';

    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    document.body.classList.add('nebula-cursor-active');

    let cursorX = 0;
    let cursorY = 0;

    let ringX = 0;
    let ringY = 0;

    window.addEventListener('mousemove', (e) => {

        cursorX = e.clientX;
        cursorY = e.clientY;

        cursorDot.style.transform =
            `translate(${cursorX - 3}px, ${cursorY - 3}px)`;

    });

    function animateCursorRing() {

        ringX += (cursorX - ringX) * 0.14;
        ringY += (cursorY - ringY) * 0.14;

        cursorRing.style.transform =
            `translate(${ringX - 17}px, ${ringY - 17}px)`;

        requestAnimationFrame(animateCursorRing);

    }

    animateCursorRing();

    const interactiveElements = document.querySelectorAll(
        'a, button, .universe-card, .glass-card'
    );

    interactiveElements.forEach((element) => {

        element.addEventListener('mouseenter', () => {
            cursorRing.classList.add('cursor-hover');
        });

        element.addEventListener('mouseleave', () => {
            cursorRing.classList.remove('cursor-hover');
        });

    });

    document.addEventListener('mouseleave', () => {

        cursorDot.style.opacity = '0';
        cursorRing.style.opacity = '0';

    });

    document.addEventListener('mouseenter', () => {

        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';

    });

}

// ==========================================
// UPGRADE 10 — SPACE CONTROL PANEL
// ==========================================

const spaceControls = document.createElement('div');
spaceControls.className = 'nebula-controls';

spaceControls.innerHTML = `
    <button id="nebula-zoom-out" title="Zoom Out">−</button>
    <button id="nebula-zoom-in" title="Zoom In">+</button>
    <button id="nebula-reset-view" class="control-reset">
        RESET
    </button>
`;

document.body.appendChild(spaceControls);

// Zoom In
document.getElementById('nebula-zoom-in').addEventListener('click', () => {

    cameraZoomOffset = Math.max(-3, cameraZoomOffset - 0.5);

});

// Zoom Out
document.getElementById('nebula-zoom-out').addEventListener('click', () => {

    cameraZoomOffset = Math.min(3, cameraZoomOffset + 0.5);

});

// Reset
document.getElementById('nebula-reset-view').addEventListener('click', () => {

    cameraZoomOffset = 0;

    mouseTargetX = 0;
    mouseTargetY = 0;

    smoothMouseX = 0;
    smoothMouseY = 0;

    planetFocusActive = false;
    planetFocusTarget = 0;

    planetGroup.rotation.set(0, 0, 0);

});

// ==========================================
// UPGRADE 12 — INTERACTIVE PLANET DISCOVERY
// ==========================================

const discoveryPanel = document.createElement('div');
discoveryPanel.className = 'nebula-discovery';

discoveryPanel.innerHTML = `
    <div class="discovery-top">
        <span class="discovery-label">COSMIC DATABASE / 001</span>
        <button class="discovery-close" aria-label="Close">×</button>
    </div>

    <div class="discovery-icon">✦</div>

    <h2 class="discovery-title">The Violet Sphere</h2>

    <p class="discovery-description">
        A mysterious world surrounded by luminous energy.
        Its shifting surface represents the endless evolution
        of creativity, technology and imagination.
    </p>

    <div class="discovery-stats">
        <div class="discovery-stat">
            <small>CLASSIFICATION</small>
            <strong>Unknown World</strong>
        </div>

        <div class="discovery-stat">
            <small>ENERGY STATUS</small>
            <strong>Active</strong>
        </div>

        <div class="discovery-stat">
            <small>ATMOSPHERE</small>
            <strong>Violet Plasma</strong>
        </div>

        <div class="discovery-stat">
            <small>MISSION</small>
            <strong>Discovery</strong>
        </div>
    </div>

    <div class="discovery-hint">
        SIGNAL RECEIVED · EXPLORATION LOG
    </div>
`;

document.body.appendChild(discoveryPanel);

// Close discovery panel
const discoveryClose = discoveryPanel.querySelector('.discovery-close');

discoveryClose.addEventListener('click', () => {
    discoveryPanel.classList.remove('active');
});

// Planet raycaster
const discoveryRaycaster = new THREE.Raycaster();
const discoveryMouse = new THREE.Vector2();

function getPlanetHit(event) {

    const rect = renderer.domElement.getBoundingClientRect();

    discoveryMouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    discoveryMouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    discoveryRaycaster.setFromCamera(discoveryMouse, camera);

    return discoveryRaycaster.intersectObject(planet, false).length > 0;

}

// Planet click opens discovery panel
renderer.domElement.addEventListener('click', (event) => {

    if (getPlanetHit(event)) {
        discoveryPanel.classList.add('active');
    }

});

// Escape key closes panel
document.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {
        discoveryPanel.classList.remove('active');
    }

});

// ==========================================
// UPGRADE 13 — PLANET CLICK CAMERA FOCUS
// ==========================================

renderer.domElement.addEventListener('click', (event) => {

    if (!getPlanetHit(event)) return;

    planetFocusActive = !planetFocusActive;
    planetFocusTarget = planetFocusActive ? 1 : 0;

});