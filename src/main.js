import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- 1. 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222); // 深灰背景

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 如果需要阴影
document.body.appendChild(renderer.domElement);

// --- 2. 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // 启用惯性
controls.dampingFactor = 0.05;
controls.autoRotate = false;        // 是否自动旋转
controls.target.set(0, 0, 0);

// --- 3. 灯光（保证模型被充分照亮）---
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight1.position.set(2, 3, 2);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffeedd, 0.8);
dirLight2.position.set(-2, 1, -2);
scene.add(dirLight2);

const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(0, 3, 0);
scene.add(pointLight);

// --- 4. 辅助网格（放在 y=0 平面）---
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = 0;
scene.add(gridHelper);

// --- 5. 加载 glTF 模型 ---
const loader = new GLTFLoader();

// ⚠️ 请将 '你的模型文件名.glb' 替换为实际的文件名（放在 public 文件夹内）
const modelFileName = 't2.glb';

loader.load(
    modelFileName,
    (gltf) => {
        const model = gltf.scene;
        console.log('✅ 模型加载成功！', model);

        // 可选：自动缩放（如果模型尺寸不合适）
        let box = new THREE.Box3().setFromObject(model);
        let size = box.getSize(new THREE.Vector3());
        let maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim; // 使最大边长变为 2
            model.scale.set(scale, scale, scale);
            console.log(`🔍 自动缩放因子: ${scale}`);
        }

        // 重新计算缩放后的包围盒
        box = new THREE.Box3().setFromObject(model);
        const min = box.min;
        const center = box.getCenter(new THREE.Vector3());

        // 平移模型，使底部对齐 y=0 并水平居中
        const translation = new THREE.Vector3(-center.x, -min.y, -center.z);
        model.position.copy(translation);

        scene.add(model);

        // 调整相机位置以适配模型
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

        console.log('🎉 模型已就位，底部对齐 y=0。');
    },
    (xhr) => {
        console.log(`⏳ 加载中... ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('❌ 模型加载失败:', error);
    }
);

// --- 6. 动画循环 ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- 7. 窗口自适应 ---
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}