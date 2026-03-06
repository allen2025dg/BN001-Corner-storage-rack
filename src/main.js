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

// ================= 优化后的灯光系统 =================
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
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

const modelFileName = 't3-10M.glb'; // 你的模型文件名

progressContainer.style.display = 'block';
progressText.style.display = 'block';

// 用于存储每个木板的原始颜色的 Map（以 mesh 对象为键）
const originalColorMap = new Map();

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

        // ---------- 为木板部件命名并保存原始颜色 ----------
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                // 检查材质名称是否包含“木板”
                const matName = child.material.name || '';
                if (matName.includes('木板')) {
                    child.name = 'wood'; // 统一命名为 wood
                    console.log('✅ 已识别为木板部件:', child.name, '材质名:', matName);
                    
                    // 保存原始颜色（处理材质数组）
                    if (Array.isArray(child.material)) {
                        // 如果是材质数组，保存每个材质的颜色克隆
                        const colors = child.material.map(mat => mat.color.clone());
                        originalColorMap.set(child, colors);
                    } else {
                        // 单个材质
                        originalColorMap.set(child, child.material.color.clone());
                    }
                }
            }
        });

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
        if (xhr.lengthComputable) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(1);
            progressBar.style.width = percent + '%';
            progressText.innerText = `加载中 ${percent}%`;
            console.log(`⏳ 加载中... ${percent}%`);
        }
    },
    (error) => {
        console.error('❌ 模型加载失败:', error);
        progressContainer.style.display = 'none';
        progressText.style.display = 'none';
        alert('模型加载失败，请检查网络或刷新重试。');
    }
);

// --- 射线检测和交互逻辑（点击木板弹出菜单，可恢复原始颜色）---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 创建自定义菜单
const menu = document.createElement('div');
menu.style.position = 'absolute';
menu.style.display = 'none';
menu.style.backgroundColor = 'white';
menu.style.border = '1px solid #ccc';
menu.style.borderRadius = '8px';
menu.style.padding = '10px';
menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
menu.style.zIndex = '100';
menu.innerHTML = `
  <button id="btn-black" style="margin-right: 8px; padding: 5px 10px;">黑色木板</button>
  <button id="btn-vintage" style="padding: 5px 10px;">复古木板</button>
`;
document.body.appendChild(menu);

let selectedMesh = null; // 当前选中的木板对象

// 监听鼠标点击
window.addEventListener('click', (event) => {
    // 计算鼠标位置归一化坐标
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // 检测场景中所有物体（包括子物体）
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.name === 'wood') {
            selectedMesh = hit;
            // 显示菜单
            menu.style.left = event.clientX + 15 + 'px';
            menu.style.top = event.clientY + 15 + 'px';
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    } else {
        menu.style.display = 'none';
    }
});

// 黑色按钮：将材质颜色改为黑色
document.getElementById('btn-black').addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectedMesh) {
        if (Array.isArray(selectedMesh.material)) {
            selectedMesh.material.forEach(mat => mat.color.setHex(0x000000));
        } else {
            selectedMesh.material.color.setHex(0x000000);
        }
    }
    menu.style.display = 'none';
});

// 复古按钮：恢复原始颜色（从 originalColorMap 中获取）
document.getElementById('btn-vintage').addEventListener('click', (e) => {
    e.stopPropagation();
    if (selectedMesh && originalColorMap.has(selectedMesh)) {
        const original = originalColorMap.get(selectedMesh);
        if (Array.isArray(original)) {
            // 原始颜色是数组，对应材质数组
            if (Array.isArray(selectedMesh.material)) {
                selectedMesh.material.forEach((mat, index) => {
                    if (original[index]) mat.color.copy(original[index]);
                });
            }
        } else {
            // 原始颜色是单个颜色对象
            if (!Array.isArray(selectedMesh.material)) {
                selectedMesh.material.color.copy(original);
            } else {
                // 如果材质是数组但原始颜色不是，则默认恢复第一个材质
                selectedMesh.material[0].color.copy(original);
            }
        }
    }
    menu.style.display = 'none';
});

// 防止菜单按钮点击事件冒泡
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
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