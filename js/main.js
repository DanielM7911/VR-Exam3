import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let camera, scene, renderer, stats, controls;

const clock = new THREE.Clock();
let object;

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
    // LUCES PARA VR
    // ----------------------
    // Luz ambiental fuerte (la que VR respeta)
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambient);

    // Luz hemisférica suave
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 10, 0);
    scene.add(hemi);

    // Luz direccional como "sol"
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Luz interior del salón
    const point = new THREE.PointLight(0xffffff, 1.4, 20);
    point.position.set(0, 2.5, 0);
    scene.add(point);

    // ----------------------
    // CARGA DE MODELO FBX
    // ----------------------
    const loader = new FBXLoader();
    loader.load("models/exa.fbx", (group) => {

        // Quitar rotaciones para evitar errores
        group.rotation.set(0, 0, 0);

        // CALCULAR escala real
        let box = new THREE.Box3().setFromObject(group);
        let size = new THREE.Vector3();
        box.getSize(size);

        const altura = 3.0; // altura real del salón
        const escala = altura / size.y;
        group.scale.setScalar(escala);

        // RE-CALCULAR caja
        box = new THREE.Box3().setFromObject(group);

        // Centrar el salón en X y Z
        const center = box.getCenter(new THREE.Vector3());
        group.position.x -= center.x;
        group.position.z -= center.z;

        // Ajustar piso a Y=0
        box.setFromObject(group);
        group.position.y -= box.min.y;

        // ------------------------
        // REPARACIÓN DE MATERIALES
        // ------------------------
        group.traverse((child) => {
            if (child.isMesh) {

                // Hacer paredes double-side
                child.material.side = THREE.DoubleSide;

                // Reparar materiales completamente negros
                if ((!child.material.map) &&
                    child.material.color.r === 0 &&
                    child.material.color.g === 0 &&
                    child.material.color.b === 0) 
                {
                    child.material.color.set(0xaaaaaa);
                }

                // Reparar normales invertidas
                child.geometry.computeVertexNormals();
            }
        });

        scene.add(group);
        object = group;

        // POSICIÓN inicial del usuario
        camera.position.set(0, 1.6, 0.5);
        controls.target.set(0, 1.6, -1);
        controls.update();
    });

    // ----------------------
    // RENDERER
    // ----------------------
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // Esto hace que la altura del VR sea EXACTA
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

    // ----------------------
    // EVENTOS
    // ----------------------
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
