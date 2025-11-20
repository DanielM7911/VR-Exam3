import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, stats, controls;
let object;

const clock = new THREE.Clock();

init();

function init() {

    const container = document.getElementById('three-container');

    // 📷 CÁMARA
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );

    // Posición inicial para modo normal (no VR)
    camera.position.set(0, 1.6, 2);
    camera.lookAt(0, 1.6, 0);

    // 🌄 ESCENA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 💡 ILUMINACIÓN
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 📦 CARGAR MODELO FBX
    const loader = new FBXLoader();
    loader.load("models/exa.fbx", (group) => {

        // ORIENTACIÓN (ajústala si tu salón sale girado)
        group.rotation.x = Math.PI / 2;
        group.rotation.y = Math.PI;
        group.rotation.z = 0;

        // 1) OBTENER TAMAÑO REAL DEL MODELO
        let box = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        box.getSize(size);

        // 2) ESCALAR PARA QUE LA ALTURA DEL SALÓN SEA ≈ 3 m
        const alturaDeseada = 3.0;        // altura de techo (~3 m)
        const factorEscala = alturaDeseada / size.y;
        group.scale.setScalar(factorEscala);

        // 3) VOLVER A CALCULAR CAJA DESPUÉS DE ESCALAR
        box.setFromObject(group);

        // 4) CENTRAR EL MODELO EN EL ORIGEN (X,Z)
        const center = box.getCenter(new THREE.Vector3());
        group.position.x -= center.x;
        group.position.z -= center.z;

        // 5) BAJAR EL MODELO PARA QUE EL PISO QUEDE EXACTAMENTE EN Y = 0
        box.setFromObject(group);
        const minY = box.min.y;
        group.position.y -= minY;

        // 6) PAREDES DOBLE CARA
        group.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.side = THREE.DoubleSide;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Agregar modelo final corregido
        scene.add(group);
        object = group;

        // 7) POSICIONAR AL USUARIO DENTRO DEL SALÓN
        //    En el centro, a 1.6 m de altura, un poco hacia atrás
        camera.position.set(0, 1.6, 0.5);
        controls.target.set(0, 1.6, -2);
        controls.update();
    });

    // 🖥 RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // VR
    renderer.xr.enabled = true;
    // "local-floor" hace que la cabeza esté a 1.6 m sobre Y=0
    renderer.xr.setReferenceSpaceType('local-floor');
    document.body.appendChild(VRButton.createButton(renderer));

    container.appendChild(renderer.domElement);

    // 🎮 CONTROLES
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();

    // 🧪 STATS
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
    const delta = clock.getDelta();
    renderer.render(scene, camera);
    stats.update();
}
