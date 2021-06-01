import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import { NumberConstruct } from './class_NumberConstruct.js';

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader()
const normalTexture = textureLoader.load('/textures/seamless_brick_rock_wall_normal_map.png', function (tex) {
    // tex and normalTexture are the same here, but that might not always be the case
    //console.log("normalTexture", tex.image.width, tex.image.height);
});

// Objects
const geometry = new THREE.BoxGeometry(1, 1, 1);

// Materials
const materialTile = new THREE.MeshStandardMaterial()
materialTile.metalness = 0.0
materialTile.roughness = 0.7

materialTile.normalMap = normalTexture;
materialTile.color = new THREE.Color(0x808080);

const materialEmpty = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialEmpty.transparent = true;
materialEmpty.opacity = 0.2;

const materialSelected = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
materialSelected.transparent = true;
materialSelected.opacity = 0.2;

// Meshes
const mesh0 = new THREE.Mesh(geometry, materialEmpty);
mesh0.position.set(0, 0, 0);
scene.add(mesh0);

const mesh1 = new THREE.Mesh(geometry, materialEmpty);
mesh1.position.set(0, 0, 1);
scene.add(mesh1);

const mesh2 = new THREE.Mesh(geometry, materialEmpty);
mesh2.position.set(1, 0, 0);
scene.add(mesh2);

const mesh3 = new THREE.Mesh(geometry, materialEmpty);
mesh3.position.set(1, 0, 1);
scene.add(mesh3);

const mesh4 = new THREE.Mesh(geometry, materialEmpty);
mesh4.position.set(0, 1, 0);
scene.add(mesh4);

const mesh5 = new THREE.Mesh(geometry, materialEmpty);
mesh5.position.set(0, 1, 1);
scene.add(mesh5);

const mesh6 = new THREE.Mesh(geometry, materialEmpty);
mesh6.position.set(1, 1, 0);
scene.add(mesh6);

const mesh7 = new THREE.Mesh(geometry, materialEmpty);
mesh7.position.set(1, 1, 1);
scene.add(mesh7);

const meshes = [mesh0, mesh1, mesh2, mesh3, mesh4, mesh5, mesh6, mesh7];

//FRONT view
let newNumber = new NumberConstruct(10004567.89, "European", "Crash Numbering Serif");
newNumber.addNumberGeometry(scene, materialEmpty, new THREE.Vector3(-10, -10, -10));

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const directionalLightControl = gui.addFolder("Directional Light");
directionalLightControl.add(directionalLight.position, 'x').min(5).max(10).step(0.01);
directionalLightControl.add(directionalLight.position, 'y').min(5).max(10).step(0.01);
directionalLightControl.add(directionalLight.position, 'z').min(5).max(10).step(0.01);
directionalLightControl.add(directionalLight, 'intensity').min(0).max(2).step(0.01);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
scene.add(directionalLightHelper);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 4);
scene.add(camera);

// Controls
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.toneMapping = THREE.ReinhardToneMapping;
// renderer.toneMappingExposure = 1.5;

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


/**
 * Interaction
 */
window.addEventListener('mousemove', onMouseMove, false);

// Raycasting for mouse picking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // *** Update Controls ***
    orbitControls.update();

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        //Closest intersection
        intersects[0].object.material = materialSelected;

        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].id != intersects[0].object.id) {
                meshes[i].material = materialEmpty;
            }
        }
    }
    else {
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].material = materialEmpty;
        }
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()