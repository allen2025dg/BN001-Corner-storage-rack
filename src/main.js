import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc); // 浅灰背景

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 开启阴影映射
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6; // 降低曝光，平衡 HDR 亮度
document.body.appendChild(renderer.domElement);

// --- 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.target.set(0, 0, 0);

// ================= 灯光系统 =================
// 环境光强度调低，避免过曝
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// 主光源：方向光，开启阴影
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(3, 5, 3);
mainLight.castShadow = true;
mainLight.receiveShadow = false;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 8;
mainLight.shadow.camera.left = -5;
mainLight.shadow.camera.right = 5;
mainLight.shadow.camera.top = 5;
mainLight.shadow.camera.bottom = -5;
scene.add(mainLight);

// 辅助光：左侧暖色
const fillLightLeft = new THREE.DirectionalLight(0xffeedd, 0.6);
fillLightLeft.position.set(-3, 2, 2);
scene.add(fillLightLeft);

// 背光：冷色，增强轮廓
const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
backLight.position.set(0, 2, -4);
scene.add(backLight);

// 底部补光
const bottomLight = new THREE.PointLight(0xffffff, 0.3);
bottomLight.position.set(0, -2, 0);
scene.add(bottomLight);

// 半球光：模拟环境反射
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 5, 0);
scene.add(hemiLight);
// ===========================================

// ================= 环境贴图（HDRI）=================
new RGBELoader()
    .setPath('assets/hdr/')
    .load('studio_small_03_1k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularRefractionMapping;
        scene.environment = texture;
        // scene.background = texture; // 若需背景也换为 HDR，取消注释
    });
// ===========================================

// --- 动态创建加载元素（所有样式由CSS控制）---
const logoContainer = document.createElement('div');
logoContainer.id = 'logo-container';
logoContainer.className = 'loading-logo';
logoContainer.innerHTML = `
    <div>榫卯·家</div>
    <div style="font-size: 14px; margin-top: 10px;">加载中...</div>
`;
document.body.appendChild(logoContainer);

const progressContainer = document.createElement('div');
progressContainer.id = 'progress-container';
progressContainer.className = 'progress-container';
progressContainer.innerHTML = `
    <div style="margin-bottom: 10px;">加载模型中...</div>
    <div style="width:100%; height:20px; background:#444; border-radius:10px;">
        <div id="progress-bar"></div>
    </div>
    <div id="progress-text">0%</div>
`;
document.body.appendChild(progressContainer);
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// --- 中英文文案映射 ---
const i18n = {
    zh: {
        productTitle: window.PRODUCT_NAME_ZH || '转角收纳架',
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
        productTitle: window.PRODUCT_NAME_EN || 'Corner Shelf',
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

// --- 加载模型 ---
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

const modelFileName = window.MODEL_URL || 'assets/models/p1.glb';
let currentModel = null;
let groundPlane = null; // 用于存储地面对象

if (progressContainer) progressContainer.style.display = 'block';

loader.load(
    modelFileName,
    (gltf) => {
        currentModel = gltf.scene;
        console.log('✅ 模型加载成功！');

        // 自动缩放和居中
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

        // 开启模型阴影投射
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });

        scene.add(currentModel);

        // 添加平面地面（根据模型大小动态调整）
        const finalBox = new THREE.Box3().setFromObject(currentModel);
        const finalMin = finalBox.min;
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const groundRadius = Math.max(finalSize.x, finalSize.z) * 0.8 + 0.5; // 半径略大于模型底部范围

        // 创建圆形平面，半透明材质，接收阴影
        const groundGeometry = new THREE.CircleGeometry(groundRadius, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6
        });
        groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2; // 平躺
        groundPlane.position.y = finalMin.y - 0.05; // 略微低于模型底部
        groundPlane.receiveShadow = true;
        groundPlane.castShadow = false;
        scene.add(groundPlane);

        // 调整相机位置
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
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

// --- 款式切换（颜色）---
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