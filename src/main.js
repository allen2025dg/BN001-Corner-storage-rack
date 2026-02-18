import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// --- 初始化场景、相机、渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 控制器 ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false; // 若需自动旋转设为 true
controls.autoRotateSpeed = 2.0;

// --- 灯光 ---
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(1, 2, 1);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(-1, 0.5, -1);
scene.add(backLight);

// --- 辅助网格（可选，根据模型位置调整 y 值）---
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// --- 加载模型（请将文件名替换为你的实际文件名）---
const mtlLoader = new MTLLoader();
mtlLoader.load('public/corner_rack.mtl', (materials) => {
    materials.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('public/corner_rack.obj', (object) => {
        // 可选：手动调整模型大小/位置
        // object.scale.set(0.1, 0.1, 0.1);
        // object.position.y = 0;

        scene.add(object);

        // 自动适配相机至模型大小（如不需要可注释掉）
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            camera.position.copy(center);
            camera.position.x += maxDim * 1.5;
            camera.position.y += maxDim * 0.5;
            camera.position.z += maxDim * 1.5;
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();
        }
    }, undefined, (error) => {
        console.error('OBJ加载错误:', error);
    });
}, undefined, (error) => {
    console.error('MTL加载错误:', error);
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