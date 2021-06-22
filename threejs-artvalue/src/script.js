import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';

import { NumberConstruct } from './class_NumberConstruct.js';
import { Vector3 } from 'three';

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

let GUIOptions = {
    lightHelperFlag: false,
    lightHelperEnabled: false,
    numberValue: '1234.56',
    numberStyle: 'European',
    numberFont: 'Avenir Black',
};

// State Control
const states = ['None', 'Room 1', 'Room 2', 'Room 3', 'Room 4'];

let previousState = states[0];
let currentState = states[1];

let activeButtons = [];

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

const gltfLoader = new GLTFLoader();

// Objects
const boxGeometry = new THREE.BoxGeometry(2, 1, 0.4);

// Materials
const materialTile = new THREE.MeshStandardMaterial()
materialTile.metalness = 0.0
materialTile.roughness = 0.7

normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;
normalTexture.repeat.set(0.5, 0.5); // scale

materialTile.normalMap = normalTexture;
materialTile.color = new THREE.Color(0x808080);

const materialNumber = new THREE.MeshBasicMaterial({ color: 0x0000FF });
materialNumber.transparent = true;
materialNumber.opacity = 0.5;

const materialEmpty = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
materialEmpty.transparent = true;
materialEmpty.opacity = 0.7;

const materialSelected = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialSelected.transparent = true;
materialSelected.opacity = 0.7;


// const mesh1 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh1.position.set(0, 0, 1);
// scene.add(mesh1);

// const mesh2 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh2.position.set(1, 0, 0);
// scene.add(mesh2);

// const mesh3 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh3.position.set(1, 0, 1);
// scene.add(mesh3);

// const mesh4 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh4.position.set(0, 1, 0);
// scene.add(mesh4);

// const mesh5 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh5.position.set(0, 1, 1);
// scene.add(mesh5);

// const mesh6 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh6.position.set(1, 1, 0);
// scene.add(mesh6);

// const mesh7 = new THREE.Mesh(boxGeometry, materialEmpty);
// mesh7.position.set(1, 1, 1);
// scene.add(mesh7);


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5.0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.width = 51200;
directionalLight.shadow.camera.height = 51200;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(20, 50, 20);
scene.add(directionalLight);

const directionalLightControl = gui.addFolder("Directional Light");
directionalLightControl.add(directionalLight.position, 'x').min(0).max(50).step(0.01).listen();
directionalLightControl.add(directionalLight.position, 'y').min(0).max(100).step(0.01).listen();
directionalLightControl.add(directionalLight.position, 'z').min(0).max(50).step(0.01).listen();
directionalLightControl.add(directionalLight, 'intensity').min(0).max(10).step(0.01).listen();
directionalLightControl.add(GUIOptions, 'lightHelperFlag').name('Light Helper').onChange(lightHelperCallback);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 2, new THREE.Color('yellow'));
directionalLightHelper.name = 'lightHelper';

const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(directionalLightCameraHelper);

function lightHelperCallback() {
    if (GUIOptions.lightHelperFlag && !GUIOptions.lightHelperEnabled) {
        scene.add(directionalLightHelper);
        GUIOptions.lightHelperEnabled = true;
    }
    else if (!GUIOptions.lightHelperFlag && GUIOptions.lightHelperEnabled) {
        scene.remove(scene.getObjectByName('lightHelper'));
        GUIOptions.lightHelperEnabled = false;
    }
}

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
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 500);
camera.position.set(-20, 7, -20);
scene.add(camera);

// Camera controls
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = false;
orbitControls.target = new THREE.Vector3(-20, 7, -50);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const rendererControl = gui.addFolder("Renderer Properties");
rendererControl.add(renderer, 'toneMappingExposure').min(0).max(2).step(0.01);

/**
 * Update all materials
 */
const updateAllMaterials = () => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            // add environment map
            child.material.needsUpdate = true
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
}

/**
 * Contents
 */
// Gallery environment
gltfLoader.load(
    '/models/NumberGallery/NumberGallery.gltf',
    (gltf) => {
        console.log("Gallery models loaded!");
        gltf.scene.scale.set(5, 5, 5);
        gltf.scene.position.set(0, 0, 0);
        scene.add(gltf.scene);

        updateAllMaterials();
    }
)

// FRONT view
// TODO: Customization UI
const numberControl = gui.addFolder("Number Control");
numberControl.add(GUIOptions, 'numberValue').name('Value').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberStyle', ['European', 'European No Separator', 'US', 'US No Separator']).name('Style').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberFont', ['Avenir Black', 'Crash Numbering Serif', 'Nexa Rust Handmade', 'Pecita',
    'Press Start 2P', 'Roboto Bold']).name('Font').onFinishChange(numberMeshCallback);

const newNumber = new NumberConstruct(parseFloat(GUIOptions.numberValue), GUIOptions.numberStyle, GUIOptions.numberFont);

function numberMeshCallback() {
    newNumber.addNumberMesh(scene, materialNumber, GUIOptions.numberValue, GUIOptions.numberStyle, GUIOptions.numberFont);
}


/**
 * Interactions
 */

function enterNewState() {
    
    newNumber.addNumberMesh(scene, materialNumber);

    //Add Navigation Buttons
    const nextStepButton = new THREE.Mesh(boxGeometry, materialEmpty);
    const newPos = newNumber.getNumberMeshPos();
    
    nextStepButton.position.set(newPos.x + 5, newPos.y - 4, newPos.z + 10);
    
    activeButtons.push(nextStepButton);
    scene.add(nextStepButton);
}

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

    //const elapsedTime = clock.getElapsedTime();

    // *** Update Controls ***
    orbitControls.update();

    if (previousState !== currentState){
        enterNewState();
        previousState = currentState;
    }

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(activeButtons);

    if (intersects.length > 0) {
        //Closest intersection
        intersects[0].object.material = materialSelected;

        for (let i = 0; i < activeButtons.length; i++) {
            if (activeButtons[i].id != intersects[0].object.id) {
                activeButtons[i].material = materialEmpty;
            }
        }
    }
    else {
        for (let i = 0; i < activeButtons.length; i++) {
            activeButtons[i].material = materialEmpty;
        }
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()