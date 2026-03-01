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
renderer.shadowMap.enabled = true; // 保留阴影支持（但当前光源未开启投射，需要时可开启）
document.body.appendChild(renderer.domElement);

// --- 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.target.set(0, 0, 0);

// ================= 优化后的灯光系统 =================
// 目标：均匀照亮整个模型，保留立体感，无环境贴图

// 1. 环境光：基础照明，避免死黑
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 中性色，强度0.6
scene.add(ambientLight);

// 2. 主方向光：产生主要阴影和立体感（从右前上方向下）
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(3, 5, 3);
// 如需阴影，可取消下面注释并调整参数
// mainLight.castShadow = true;
// mainLight.shadow.mapSize.width = 1024;
// mainLight.shadow.mapSize.height = 1024;
// const d = 5;
// mainLight.shadow.camera.left = -d;
// mainLight.shadow.camera.right = d;
// mainLight.shadow.camera.top = d;
// mainLight.shadow.camera.bottom = -d;
// mainLight.shadow.camera.near = 1;
// mainLight.shadow.camera.far = 10;
scene.add(mainLight);

// 3. 左侧补光：暖色，照亮左侧面
const fillLightLeft = new THREE.DirectionalLight(0xffeedd, 0.8);
fillLightLeft.position.set(-3, 2, 2);
scene.add(fillLightLeft);

// 4. 背光：从后方打亮轮廓
const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(0, 2, -4);
scene.add(backLight);

// 5. 底部补光：轻微照亮底部（如果你的模型有底部细节）
const bottomLight = new THREE.PointLight(0xffffff, 0.4);
bottomLight.position.set(0, -2, 0);
scene.add(bottomLight);

// 6. 半球光（可选）：模拟天空和地面的环境反射，让过渡更柔和
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.position.set(0, 5, 0);
scene.add(hemiLight);
// ==================================================

// --- 辅助网格 ---
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = 0;
scene.add(gridHelper);

// --- 获取进度条元素 ---
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// --- 加载模型（支持 Draco 压缩）---
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); // 公共CDN
loader.setDRACOLoader(dracoLoader);

// 本地模型文件（请确保文件在部署时与页面同域，例如放在 public 目录）
const modelFileName = 't3-10M.glb';

// 开始加载时显示进度条
progressContainer.style.display = 'block';
progressText.style.display = 'block';

loader.load(
    modelFileName,
    (gltf) => {
        const model = gltf.scene;
        console.log('✅ 模型加载成功！');

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

        scene.add(model);

        // 调整相机
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

        console.log('🎉 模型已就位');

        // 加载完成，隐藏进度条
        progressContainer.style.display = 'none';
        progressText.style.display = 'none';
    },
    (xhr) => {
        // 更新进度条
        if (xhr.lengthComputable) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(1);
            progressBar.style.width = percent + '%';
            progressText.innerText = `加载中 ${percent}%`;
            console.log(`⏳ 加载中... ${percent}%`);
        }
    },
    (error) => {
        console.error('❌ 模型加载失败:', error);
        // 加载失败也隐藏进度条，并提示错误
        progressContainer.style.display = 'none';
        progressText.style.display = 'none';
        alert('模型加载失败，请检查网络或刷新重试。');
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