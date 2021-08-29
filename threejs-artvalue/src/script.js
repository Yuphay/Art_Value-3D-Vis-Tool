import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import Stats from 'stats.js/src/Stats.js';

import { NumberConstruct } from './class_NumberConstruct.js';

/**
 * Base
 */

// Render

let renderRequested = false;

// Debug
const gui = new dat.GUI();

let GUIOptions = {
    lightHelperFlag: false,
    lightHelperEnabled: false,
    numberValue: '1234',
    numberStyle: 'European',
    numberFont: 'Avenir Black',

    devMode: true
};

let devMode = true;

const testingControl = gui.addFolder('Testing');
testingControl.add(GUIOptions, 'devMode').name('Dev Mode').onChange(devModeCallback);
testingControl.open();

function devModeCallback() {
    devMode = GUIOptions.devMode;
    if (devMode === true) {
        document.body.appendChild(stats.domElement);
    }
    else {
        document.body.removeChild(stats.domElement);
    }
    requestRenderIfNotRequested('devModeCallback');
}

let stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0';
stats.domElement.style.top = '0';

document.body.appendChild(stats.domElement);

// State Control
const states = ['None', 'Room 1', 'Room 2', 'Room 3', 'Room 4'];
const roomPositions = [new THREE.Vector3(-20, 8, -50), new THREE.Vector3(-20, 10.5, -130)];

let previousState = states[0];
let currentState = states[1];

let activeButtons = [];
let environmentObjects = [];


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

const materialCube = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialCube.transparent = true;
materialCube.opacity = 0.4;

const materialEmpty = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialEmpty.transparent = true;
materialEmpty.opacity = 0;

const materialUnselected = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
materialUnselected.transparent = true;
materialUnselected.opacity = 0.7;

const materialSelected = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialSelected.transparent = true;
materialSelected.opacity = 0.7;


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5.0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.5, 50);

directionalLight.shadow.normalBias = 0.01;
directionalLight.shadow.bias = 0.0002;

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
    requestRenderIfNotRequested('lightHelperCallback');
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

    requestRenderIfNotRequested('resize event');
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 500);
//const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 1000 );


// Camera controls
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = false;
orbitControls.target = new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z);
orbitControls.update();

orbitControls.addEventListener('change', requestRenderIfNotRequested);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance"
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
rendererControl.add(renderer, 'toneMappingExposure').min(0).max(2).step(0.01).onChange(requestRenderIfNotRequested);

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
 * Setting up the scene
 */
function init() {

    console.assert(previousState === states[0]);

    camera.position.set(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z + 20);
    scene.add(camera);

    // TODO: loading progress bar animation
    gltfLoader.load(
        '/models/NumberGallery/NumberGallery.gltf',
        (gltf) => {
            console.log("Gallery models loaded!");
            gltf.scene.scale.set(5, 5, 5);
            gltf.scene.position.set(0, 0, 0);
            environmentObjects.push(gltf.scene);
            scene.add(gltf.scene);
            updateAllMaterials();

            newNumber.addNumberMesh(renderer, scene, camera, materialNumber);
            previousState = currentState;
        }
    )
}


// FRONT view
// TODO: Customization UI
const numberControl = gui.addFolder("Number Control");
numberControl.add(GUIOptions, 'numberValue').name('Value').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberStyle', ['European', 'European No Separator', 'US', 'US No Separator']).name('Style').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberFont', ['Avenir Black', 'Crash Numbering Serif', 'Nexa Rust Handmade', 'Pecita',
    'Press Start 2P', 'Roboto Bold']).name('Font').onFinishChange(numberMeshCallback);

const newNumber = new NumberConstruct(parseFloat(GUIOptions.numberValue), GUIOptions.numberStyle, GUIOptions.numberFont,
    new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z));

function numberMeshCallback() {
    if (currentState === states[1]) {
        newNumber.addNumberMesh(renderer, scene, camera, materialNumber, GUIOptions.numberValue, GUIOptions.numberStyle, GUIOptions.numberFont);
    }
}


/**
 * Interactions
 */

function enterNewState() {

    scene.remove(directionalLight);

    console.log("New state: " + currentState);

    if (currentState === states[1] && previousState !== states[0]) {
        if (previousState === states[2]) {
            newNumber.removePreviousCubes(scene);

            let matrixScaling = new THREE.Matrix4();
            matrixScaling.makeScale(1, 1, 1 / newNumber.numberDepthScalingFactor);
            newNumber.currentMesh.geometry.applyMatrix4(matrixScaling);
        }
        newNumber.currentMesh.material.side = THREE.FrontSide;

        newNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z));
        camera.position.set(newNumber.getNumberMeshPos().x, newNumber.getNumberMeshPos().y, newNumber.getNumberMeshPos().z + 20);
        orbitControls.target = newNumber.getNumberMeshPos();
    }
    else if (currentState === states[2]) {
        newNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[1].x, roomPositions[1].y, roomPositions[1].z));

        newNumber.generateCubeConstraint(renderer, scene, camera, 100, materialCube);

        camera.position.set(
            newNumber.getNumberMeshPos().x,
            newNumber.getNumberMeshPos().y,
            newNumber.getNumberMeshPos().z + newNumber.getCubeSideLength() / 2 + 20);

        orbitControls.target = newNumber.getNumberMeshPos();

        // Update Lighting
        const targetObject = new THREE.Object3D();
        targetObject.position.set(newNumber.currentMesh.position.x, newNumber.currentMesh.position.y, newNumber.currentMesh.position.z);
        scene.add(targetObject);
        directionalLight.target = targetObject;
        directionalLight.position.set(
            newNumber.getNumberMeshPos().x,
            newNumber.getNumberMeshPos().y,
            newNumber.getNumberMeshPos().z + newNumber.getCubeSideLength() / 2 + 20);

        scene.add(directionalLight);
    }

    //Add Navigation Buttons
    const nextStepButton = new THREE.Mesh(boxGeometry, materialUnselected);
    const previousStepButton = new THREE.Mesh(boxGeometry, materialUnselected);

    nextStepButton.position.set(camera.position.x + 5, camera.position.y - 4, camera.position.z - 15);
    previousStepButton.position.set(camera.position.x - 5, camera.position.y - 4, camera.position.z - 15);

    nextStepButton.name = 'nextStepButton';
    previousStepButton.name = 'previousStepButton';
    activeButtons.push(previousStepButton, nextStepButton);
    scene.add(nextStepButton);
    scene.add(previousStepButton);
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);

// Raycasting for mouse picking
const mouseRayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Raycasting for camera control
const cameraRayCaster = new THREE.Raycaster();

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    if (scene.getObjectByName('nextStepButton').material === materialSelected) {
        if (states.indexOf(currentState) < states.length - 1) {
            currentState = states[states.indexOf(currentState) + 1];
            activeButtons.pop();
            activeButtons.pop();
            scene.remove(scene.getObjectByName('previousStepButton'));
            scene.remove(scene.getObjectByName('nextStepButton'));
        }
    }
    else if (scene.getObjectByName('previousStepButton').material === materialSelected) {
        if (states.indexOf(currentState) > 1) {
            currentState = states[states.indexOf(currentState) - 1];
            activeButtons.pop();
            activeButtons.pop();
            scene.remove(scene.getObjectByName('previousStepButton'));
            scene.remove(scene.getObjectByName('nextStepButton'));
        }
    }
}

/**
 * Animate
 */

//const clock = new THREE.Clock();

const tick = () => {

    //const elapsedTime = clock.getElapsedTime();

    // *** Update Controls ***
    orbitControls.update();

    if (previousState !== currentState) {
        enterNewState();
        previousState = currentState;
    }

    // Update the picking ray with the camera and mouse position
    mouseRayCaster.setFromCamera(mouse, camera);

    // Get objects intersecting the picking ray
    const mousePickIntersects = mouseRayCaster.intersectObjects(activeButtons);

    if (mousePickIntersects.length > 0) {
        //Closest intersection
        if (mousePickIntersects[0].object.material !== materialSelected) {
            mousePickIntersects[0].object.material = materialSelected;
            requestRenderIfNotRequested('mouse pick');
        }

        for (let i = 0; i < activeButtons.length; i++) {
            if (activeButtons[i].id != mousePickIntersects[0].object.id &&
                activeButtons[i].material !== materialUnselected) {
                activeButtons[i].material = materialUnselected;
                requestRenderIfNotRequested('mouse pick');
            }
        }
    }
    else {
        for (let i = 0; i < activeButtons.length; i++) {
            if (activeButtons[i].material !== materialUnselected) {
                activeButtons[i].material = materialUnselected;
                requestRenderIfNotRequested('mouse pick');
            }
        }
    }

    if (!devMode) {
        cameraRayCaster.set(orbitControls.target, new THREE.Vector3(camera.position.x - orbitControls.target.x,
            camera.position.y - orbitControls.target.y, camera.position.z - orbitControls.target.z).normalize());

        const cameraRayIntersects = cameraRayCaster.intersectObjects(environmentObjects, true);

        if (cameraRayIntersects.length > 0) {
            orbitControls.maxDistance = cameraRayIntersects[0].distance - 1;
        }
    }

    // Debug
    stats.update();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

function render() {
    renderRequested = false;
    renderer.render(scene, camera);
}

function requestRenderIfNotRequested(caller) {
    // console.log("Rendering requested by ");
    // console.log(caller);
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
    }
}

init();

tick();