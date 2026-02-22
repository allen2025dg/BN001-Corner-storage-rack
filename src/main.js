
// 这是线上版本的代码 （main.js-2-22）

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

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

// --- 灯光 ---
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

// --- 辅助网格 ---
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = 0;
scene.add(gridHelper);

// --- 加载模型（支持 Draco 压缩）---
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); // 使用公共 CDN
loader.setDRACOLoader(dracoLoader);

const modelFileName = 't2-10M.glb'; // 请修改为实际文件名

loader.load(
    modelFileName,
    (gltf) => {
        const model = gltf.scene;
        console.log('✅ 模型加载成功！');

        // 自动缩放和居中（与之前相同）
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
    },
    (xhr) => {
        console.log(`⏳ 加载中... ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('❌ 模型加载失败:', error);
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