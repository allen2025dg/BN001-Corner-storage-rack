import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();

// ================= 渐变背景 =================
const canvas = document.createElement('canvas');
canvas.width = 2;
canvas.height = 256;
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, '#666666');   // 顶部中灰
gradient.addColorStop(1, '#ffffff');   // 底部白色
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);
const backgroundTexture = new THREE.CanvasTexture(canvas);
scene.background = backgroundTexture;
// ===========================================

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.target.set(0, 0, 0);

// ================= 灯光系统 =================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(3, 5, 3);
scene.add(mainLight);

const fillLightLeft = new THREE.DirectionalLight(0xffeedd, 0.8);
fillLightLeft.position.set(-3, 2, 2);
scene.add(fillLightLeft);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(0, 2, -4);
scene.add(backLight);

const bottomLight = new THREE.PointLight(0xffffff, 0.4);
bottomLight.position.set(0, -2, 0);
scene.add(bottomLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.position.set(0, 5, 0);
scene.add(hemiLight);
// ===========================================

// --- 网格已移除 ---

// --- DOM 元素引用 ---
const logoContainer = document.getElementById('logo-container');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// --- 中英文文案映射 ---
const i18n = {
    zh: {
        productTitle: '转角收纳架',
        styleLabel: '款式',
        style1: '原木色',
        style2: '黑色',
        style3: '胡桃木',
        rotateLabel: '自动旋转',
        rotateOn: '开启',
        rotateOff: '关闭',
        speedLabel: '速度',
        shareLabel: '分享',
        copyBtn: '复制',
    },
    en: {
        productTitle: 'Corner Shelf',
        styleLabel: 'Style',
        style1: 'Natural Wood',
        style2: 'Black',
        style3: 'Walnut',
        rotateLabel: 'Auto Rotate',
        rotateOn: 'On',
        rotateOff: 'Off',
        speedLabel: 'Speed',
        shareLabel: 'Share',
        copyBtn: 'Copy',
    }
};
let currentLang = 'zh';

function updateLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang];
    document.getElementById('product-title').textContent = t.productTitle;
    document.getElementById('style-label').textContent = t.styleLabel;
    document.getElementById('style1').textContent = t.style1;
    document.getElementById('style2').textContent = t.style2;
    document.getElementById('style3').textContent = t.style3;
    document.getElementById('rotate-label').textContent = t.rotateLabel;
    document.getElementById('rotate-on').textContent = t.rotateOn;
    document.getElementById('rotate-off').textContent = t.rotateOff;
    document.getElementById('speed-label').textContent = t.speedLabel;
    document.getElementById('share-label').textContent = t.shareLabel;
    document.getElementById('copy-url').textContent = t.copyBtn;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
}

// --- 加载模型（支持 Draco 压缩）---
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

const modelFileName = window.MODEL_URL || 'assets/models/p1.glb';

let currentModel = null;

if (progressContainer) progressContainer.style.display = 'block';

loader.load(
    modelFileName,
    (gltf) => {
        currentModel = gltf.scene;
        console.log('✅ 模型加载成功！');

        const box = new THREE.Box3().setFromObject(currentModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim;
            currentModel.scale.set(scale, scale, scale);
        }

        box.setFromObject(currentModel);
        const min = box.min;
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.set(-center.x, -min.y, -center.z);

        scene.add(currentModel);

        const finalBox = new THREE.Box3().setFromObject(currentModel);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const maxDim2 = Math.max(finalSize.x, finalSize.y, finalSize.z);
        camera.position.copy(finalCenter);
        camera.position.x += maxDim2 * 1.5;
        camera.position.y += maxDim2 * 0.5;
        camera.position.z += maxDim2 * 1.5;
        controls.target.copy(finalCenter);
        controls.update();

        if (logoContainer) logoContainer.classList.add('hidden');
        if (progressContainer) progressContainer.style.display = 'none';
    },
    (xhr) => {
        if (xhr.lengthComputable && progressBar && progressText) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(1);
            progressBar.style.width = percent + '%';
            progressText.innerText = `加载中 ${percent}%`;
        }
    },
    (error) => {
        console.error('❌ 模型加载失败:', error);
        if (progressContainer) progressContainer.style.display = 'none';
        if (logoContainer) logoContainer.classList.add('hidden');
        alert('模型加载失败，请刷新重试。');
    }
);

// --- 款式切换（基于颜色）---
const styleColors = {
    style1: 0x8B5A2B,
    style2: 0x000000,
    style3: 0x4E3B2B,
};

document.getElementById('style1').addEventListener('click', () => setStyle('style1'));
document.getElementById('style2').addEventListener('click', () => setStyle('style2'));
document.getElementById('style3').addEventListener('click', () => setStyle('style3'));

function setStyle(styleId) {
    document.querySelectorAll('.control-item .btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(styleId).classList.add('active');

    if (!currentModel) return;
    const color = styleColors[styleId];
    currentModel.traverse((child) => {
        if (child.isMesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.color.setHex(color));
            } else {
                child.material.color.setHex(color);
            }
        }
    });
}

// --- 自动旋转控制 ---
document.getElementById('rotate-on').addEventListener('click', () => {
    controls.autoRotate = true;
    document.getElementById('rotate-on').classList.add('active');
    document.getElementById('rotate-off').classList.remove('active');
});
document.getElementById('rotate-off').addEventListener('click', () => {
    controls.autoRotate = false;
    document.getElementById('rotate-on').classList.remove('active');
    document.getElementById('rotate-off').classList.add('active');
});

const speedSlider = document.getElementById('rotate-speed');
const speedValue = document.getElementById('speed-value');
speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    controls.autoRotateSpeed = val;
    speedValue.textContent = val.toFixed(1);
});

// --- 中英文切换 ---
document.getElementById('lang-zh').addEventListener('click', () => updateLanguage('zh'));
document.getElementById('lang-en').addEventListener('click', () => updateLanguage('en'));

updateLanguage('zh');

// --- 分享功能 ---
const urlInput = document.getElementById('page-url');
const copyBtn = document.getElementById('copy-url');
const qrContainer = document.getElementById('qr-code');

if (window.QRCode) {
    QRCode.toDataURL(window.location.href, { width: 100, height: 100 }, (err, url) => {
        if (!err) {
            const img = document.createElement('img');
            img.src = url;
            qrContainer.innerHTML = '';
            qrContainer.appendChild(img);
        }
    });
} else {
    qrContainer.textContent = '二维码库未加载';
}

copyBtn.addEventListener('click', () => {
    urlInput.select();
    navigator.clipboard.writeText(urlInput.value).then(() => {
        alert('链接已复制');
    }).catch(() => {
        alert('复制失败，请手动复制');
    });
});

// --- 动画循环 ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- 窗口自适应 ---
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}