import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// --- 1. 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5); // 初始位置

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.target.set(0, 0, 0);

// --- 3. 灯光（增强版，确保照亮各个方向）---
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

// --- 4. 辅助元素：坐标轴、网格、红色参照立方体 ---
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.set(0, 0, 0);
scene.add(cube);

// --- 5. 加载模型（OBJ格式）---
const objLoader = new OBJLoader();

// ⚠️ 请修改为你的实际模型文件名（放在 public 文件夹内）
const modelFileName = 'tea.obj';

objLoader.load(
    modelFileName,
    (object) => {
        console.log('✅ 模型加载成功！', object);

        // 将模型添加到场景
        scene.add(object);

        // ---------- 核心调试：居中、缩放、强制材质、包围盒 ----------
        // 计算包围盒
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log('📐 原始中心:', center, '原始尺寸:', size);

        // 将模型移到原点
        object.position.sub(center);

        // 统一缩放，使最大边长变为 2（便于观察）
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim;
            object.scale.set(scale, scale, scale);
            console.log(`🔍 缩放因子: ${scale}`);
        }

        // 重新计算包围盒
        box.setFromObject(object);
        const newCenter = box.getCenter(new THREE.Vector3());
        const newSize = box.getSize(new THREE.Vector3());
        console.log('📏 新中心:', newCenter, '新尺寸:', newSize);

        // 强制所有网格为绿色双面材质（彻底解决材质/法线问题）
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x00ff00,
                    side: THREE.DoubleSide,   // 双面渲染，法线问题也不怕
                    emissive: 0x004400,       // 微弱的自发光，避免全黑
                    flatShading: false
                });
                // 如果材质原本有纹理，现在也被覆盖了，所以一定能看见
            }
        });
        console.log('🎨 已强制覆盖材质为绿色双面材质');

        // 添加一个红色的包围盒线框，用来可视化模型的实际范围
        const boxHelper = new THREE.BoxHelper(object, 0xff0000);
        scene.add(boxHelper);
        console.log('📦 已添加红色包围盒线框');

        // 调整相机位置到合适距离
        camera.position.set(3, 2, 3);
        controls.target.set(0, 0, 0);
        controls.update();

        console.log('🎉 所有调试步骤完成，请观察场景中的绿色模型和红色线框。');
    },
    (xhr) => {
        // 加载进度
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