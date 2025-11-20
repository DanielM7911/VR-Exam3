import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, stats, controls;
let model;

const clock = new THREE.Clock();

init();

function init() {

    const container = document.getElementById('three-container');

    // ----------------------
    // CÁMARA
    // ----------------------
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 2);

    // ----------------------
    // ESCENA
    // ----------------------
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // ----------------------
    // LUCES ESPECIALES PARA VR
    // ----------------------
    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 10, 0);
    scene.add(hemi);

    const directional = new THREE.DirectionalLight(0xffffff, 1.3);
    directional.position.set(5, 10, 5);
    scene.add(directional);

    // Luz interior del salón
    const point = new THREE.PointLight(0xffffff, 1.2, 20);
    point.position.set(0, 2.5, 0);
    scene.add(point);

    // ----------------------
    // CARGAR MODELO GLB
    // ----------------------
    const loader = new GLTFLoader();
    loader.load("models/exa.glb", (gltf) => {

        const group = gltf.scene;
        model = group;

        // Escala automática del salón (opcional)
        let box = new THREE.Box3().setFromObject(group);
        let size = new THREE.Vector3();
        box.getSize(size);

        const altura = 3.0; // altura real del salón en metros
        const escala = altura / size.y;
        group.scale.setScalar(escala);

        // Ajustar piso a Y=0
        box = new THREE.Box3().setFromObject(group);
        group.position.y -= box.min.y;

        // Centrar en X/Z
        const center = box.getCenter(new THREE.Vector3());
        group.position.x -= center.x;
        group.position.z -= center.z;

        // Asegurar materiales visibles en VR
        group.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(group);

        // Cámara dentro del salón
        camera.position.set(0, 1.6, 0.5);
        controls.target.set(0, 1.6, -1);
        controls.update();
    });

    // ----------------------
    // RENDERER + VR
    // ----------------------
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');

    container.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    // ----------------------
    // CONTROLES
    // ----------------------
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();

    // ----------------------
    // STATS
    // ----------------------
    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(animate);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.render(scene, camera);
    stats.update();
}
