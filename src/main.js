import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x666666);

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
controls.autoRotate = false;
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

// --- 辅助网格 ---
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = 0;
scene.add(gridHelper);

// --- 获取进度条元素（假设已存在于 HTML 中）---
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// --- 加载模型（支持 Draco 压缩）---
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

// 从全局变量获取模型路径，默认使用 assets/models/p1.glb
const modelFileName = window.MODEL_URL || 'assets/models/p1.glb';

if (progressContainer) {
    progressContainer.style.display = 'block';
    progressText.style.display = 'block';
}

loader.load(
    modelFileName,
    (gltf) => {
        const model = gltf.scene;
        console.log('✅ 模型加载成功！', modelFileName);

        // 自动缩放和居中
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim;
            model.scale.set(scale, scale, scale);
        }

        box.setFromObject(model);
        const min = box.min;
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -min.y, -center.z);

        // 为木板部件命名（如果需要点击交互，保留之前的逻辑）
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const matName = child.material.name || '';
                if (matName.includes('木板')) {
                    child.name = 'wood';
                    console.log('✅ 识别为木板:', child.name);
                }
            }
        });

        scene.add(model);

        // 调整相机适配模型
        const finalBox = new THREE.Box3().setFromObject(model);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const maxDim2 = Math.max(finalSize.x, finalSize.y, finalSize.z);
        camera.position.copy(finalCenter);
        camera.position.x += maxDim2 * 1.5;
        camera.position.y += maxDim2 * 0.5;
        camera.position.z += maxDim2 * 1.5;
        controls.target.copy(finalCenter);
        controls.update();

        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressText.style.display = 'none';
        }
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
        if (progressText) progressText.style.display = 'none';
        alert('模型加载失败，请刷新重试。');
    }
);

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