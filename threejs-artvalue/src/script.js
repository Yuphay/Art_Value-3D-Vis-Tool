import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as dat from 'dat.gui';
import Stats from 'stats.js/src/Stats.js';

import { NumberConstruct } from './class_NumberConstruct.js';

/**
 * Base
 */

// Render
let renderRequested = false;
let sceneLoaded = false;
let UILoaded = false;

// Debug
const gui = new dat.GUI();

let GUIOptions = {
    lightHelperFlag: false,
    lightHelperEnabled: false,
    numberValue: '1234',
    numberStyle: 'European',
    numberFont: 'Avenir Black',

    devMode: false
};

let devMode;

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
const roomPositions = [new THREE.Vector3(-20, 8, -58.6), new THREE.Vector3(-20, 10.5, -130)];
const ceilingLightPositions = [new THREE.Vector3(-40, 35, -40), new THREE.Vector3(-40, 35, -110), new THREE.Vector3(-110, 35, -110), new THREE.Vector3(-110, 35, -40)];

const zFramePositions = [new THREE.Vector3(-1, 8, -50), new THREE.Vector3(-1, 8, -40), new THREE.Vector3(-1, 8, -30), new THREE.Vector3(-1, 8, -20),
new THREE.Vector3(-1, 8, -10), new THREE.Vector3(-39.219, 8, -10), new THREE.Vector3(-39.221, 8, -20), new THREE.Vector3(-39.223, 8, -30),
new THREE.Vector3(-39.225, 8, -40), new THREE.Vector3(-39.23, 8, -50)];

const xFramePositions = [new THREE.Vector3(-10, 8, -1), new THREE.Vector3(-20, 8, -1), new THREE.Vector3(-30, 8, -1)];

let previousState = states[0];
let currentState = states[1];

let activeButtons = [];
let environmentObjects = [];
let cameraOffset = 30;
let room1TargetOffset = 5;

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
const fontLoader = new THREE.FontLoader();
let fontUITitle;
let fontUIContent;

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

// Geometry
const buttonGeometry = new THREE.BoxGeometry(4.5, 0.6, 0.4);
const smallTriangleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.45, 3);
const UIBackgroundGeometry = new THREE.BoxGeometry(5.2, 4, 0.2);

const smallFrameGeometry = new THREE.BoxGeometry(4, 3, 0.5);
const largeFrameGeometry = new THREE.BoxGeometry(16, 9, 1);

let UITitleGeometry1;
let UITitleGeometry2;
let UITitleGeometry3;
let UITitleGeometry4;
let UITitleGeometry5;

let UIContentGeometry1;
let UIContentGeometry2;

// Meshes
let fontButton;
let styleButton;
let UIBackground;
let smallTriangle1;
let smallTriangle2;

let UIInstructionMesh1;
let UIInstructionMesh2;
let UIInstructionMesh3;
let UIInstructionMesh4;
let UIInstructionMesh5;

let UIContentMesh1;
let UIContentMesh2;

// Materials
const materialTile = new THREE.MeshStandardMaterial();
materialTile.metalness = 0.0;
materialTile.roughness = 0.7;

normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;
normalTexture.repeat.set(0.5, 0.5); // scale

materialTile.normalMap = normalTexture;
materialTile.color = new THREE.Color(0x808080);

const materialFrame = new THREE.MeshStandardMaterial();
materialFrame.color = new THREE.Color(0x020202);
materialFrame.metalness = 0.0;
materialFrame.roughness = 0.8;

// const materialNumber = new THREE.MeshStandardMaterial();
// materialNumber.color = new THREE.Color(0xFFFFFF);
const materialNumber = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });
materialNumber.transparent = true;
materialNumber.opacity = 1.0;

const materialCube = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
materialCube.transparent = true;
materialCube.opacity = 0.4;

const materialUI = new THREE.MeshBasicMaterial({ color: 0x080808 });
materialUI.transparent = true;
materialUI.opacity = 0.4;

const materialUnselected = new THREE.MeshBasicMaterial({ color: 0x444444 });
// materialUnselected.transparent = true;
// materialUnselected.opacity = 0.7;

const materialSelected = new THREE.MeshBasicMaterial({ color: 0x888888 });
// materialSelected.transparent = true;
// materialSelected.opacity = 0.7;

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5.0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.5, 50);

directionalLight.shadow.normalBias = 0.1;
directionalLight.shadow.bias = 0.0001;

const directionalLightControl = gui.addFolder("Directional Light");
directionalLightControl.add(directionalLight.position, 'x').min(0).max(50).step(0.01).listen();
directionalLightControl.add(directionalLight.position, 'y').min(0).max(100).step(0.01).listen();
directionalLightControl.add(directionalLight.position, 'z').min(0).max(50).step(0.01).listen();
directionalLightControl.add(directionalLight, 'intensity').min(0).max(10).step(0.01).listen();
directionalLightControl.add(GUIOptions, 'lightHelperFlag').name('Light Helper').onChange(directionalLightHelperCallback);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 2, new THREE.Color('yellow'));
directionalLightHelper.name = 'lightHelper';

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(directionalLightCameraHelper);

function directionalLightHelperCallback() {
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

const ceilingLight0 = new THREE.PointLight(0xFFFFFF, 50, 150);
ceilingLight0.position.set(ceilingLightPositions[0].x, ceilingLightPositions[0].y - 1.5, ceilingLightPositions[0].z);
ceilingLight0.castShadow = true;
ceilingLight0.shadow.mapSize.width = 2048;
ceilingLight0.shadow.mapSize.height = 2048;
ceilingLight0.shadow.normalBias = 0.1;
ceilingLight0.shadow.bias = 0.0001;
scene.add(ceilingLight0);

const ceilingLight1 = new THREE.PointLight(0xFFFFFF, 50, 150);
ceilingLight1.position.set(ceilingLightPositions[1].x, ceilingLightPositions[1].y - 1.5, ceilingLightPositions[1].z);
ceilingLight1.castShadow = true;
ceilingLight1.shadow.mapSize.width = 2048;
ceilingLight1.shadow.mapSize.height = 2048;
ceilingLight1.shadow.normalBias = 0.1;
ceilingLight1.shadow.bias = 0.0001;
scene.add(ceilingLight1);

const ceilingLight2 = new THREE.PointLight(0xFFFFFF, 50, 150);
ceilingLight2.position.set(ceilingLightPositions[2].x, ceilingLightPositions[2].y - 1.5, ceilingLightPositions[2].z);
ceilingLight2.castShadow = true;
ceilingLight2.shadow.mapSize.width = 2048;
ceilingLight2.shadow.mapSize.height = 2048;
ceilingLight2.shadow.normalBias = 0.1;
ceilingLight2.shadow.bias = 0.0001;
scene.add(ceilingLight2);

const ceilingLight3 = new THREE.PointLight(0xFFFFFF, 50, 150);
ceilingLight3.position.set(ceilingLightPositions[3].x, ceilingLightPositions[3].y - 1.5, ceilingLightPositions[3].z);
ceilingLight3.castShadow = true;
ceilingLight3.shadow.mapSize.width = 2048;
ceilingLight3.shadow.mapSize.height = 2048;
ceilingLight3.shadow.normalBias = 0.1;
ceilingLight3.shadow.bias = 0.0001;
scene.add(ceilingLight3);


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
orbitControls.rotateSpeed = 0.4;
orbitControls.panSpeed = 0.5;
orbitControls.zoomSpeed = 1;
//orbitControls.target = new THREE.Vector3(roomPositions[0].x + room1TargetOffset, roomPositions[0].y, roomPositions[0].z);
orbitControls.update();

orbitControls.enabled = false;

// initial value
let initialCamPos = new THREE.Vector3(roomPositions[0].x + room1TargetOffset, roomPositions[0].y + 10, roomPositions[0].z + 50);
let initialCamOrientation = new THREE.Euler();
initialCamOrientation.setFromVector3(new THREE.Vector3(degreesToRadians(-30), 0, 0));
let savedCamPos = new THREE.Vector3(roomPositions[0].x + room1TargetOffset, roomPositions[0].y, roomPositions[0].z + cameraOffset);

// animation
let cameraAnimation = false;
let targetCamPosition = new THREE.Vector3(0, 0, 0);
let targetCamOrientation = new THREE.Quaternion();

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
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
}

/**
 * Setting up the main scene
 */
async function init() {

    console.assert(previousState === states[0]);

    camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
    camera.setRotationFromEuler(initialCamOrientation);
    scene.add(camera);

    const galleryAsyncLoading = gltfLoader.loadAsync('/models/NumberGallery/glb/NumberGallery.glb');

    const ceilingLightAsyncLoading = objLoader.loadAsync('/models/Lights/CeilingLight.obj');

    Promise.all([galleryAsyncLoading, ceilingLightAsyncLoading]).then(async models => {
        console.log("Models loaded!");
        const gallery = models[0];
        gallery.scene.scale.set(5, 5, 5);
        gallery.scene.position.set(0, 0, 0);
        environmentObjects.push(gallery.scene);
        scene.add(gallery.scene);

        const ceilingLight0 = models[1].clone();
        ceilingLight0.scale.set(0.1, 0.1, 0.1);
        ceilingLight0.position.set(ceilingLightPositions[0].x, ceilingLightPositions[0].y, ceilingLightPositions[0].z);
        environmentObjects.push(ceilingLight0);
        scene.add(ceilingLight0);

        const ceilingLight1 = models[1].clone();
        ceilingLight1.scale.set(0.1, 0.1, 0.1);
        ceilingLight1.position.set(ceilingLightPositions[1].x, ceilingLightPositions[1].y, ceilingLightPositions[1].z);
        environmentObjects.push(ceilingLight1);
        scene.add(ceilingLight1);

        const ceilingLight2 = models[1].clone();
        ceilingLight2.scale.set(0.1, 0.1, 0.1);
        ceilingLight2.position.set(ceilingLightPositions[2].x, ceilingLightPositions[2].y, ceilingLightPositions[2].z);
        environmentObjects.push(ceilingLight2);
        scene.add(ceilingLight2);

        const ceilingLight3 = models[1].clone();
        ceilingLight3.scale.set(0.1, 0.1, 0.1);
        ceilingLight3.position.set(ceilingLightPositions[3].x, ceilingLightPositions[3].y, ceilingLightPositions[3].z);
        environmentObjects.push(ceilingLight3);
        scene.add(ceilingLight3);

        const largeFrame = new THREE.Mesh(largeFrameGeometry, materialFrame);
        largeFrame.position.set(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z - 0.02);
        environmentObjects.push(largeFrame);
        scene.add(largeFrame);

        updateAllMaterials();

        Promise.all([mainNumber.addNumberMesh(renderer, scene, camera, materialNumber, false), loadingUIInit()]).then(loadingResults => {
            sceneLoaded = loadingResults[0];
            if (sceneLoaded) console.log("Scene loaded!");
            UILoaded = loadingResults[1];
            if (UILoaded) console.log("UI loaded!");
            renderer.compile(scene, camera);

            cameraAnimationDispatcher(savedCamPos, new THREE.Euler(0, 0, 0, 'XYZ'));
            orbitControls.target = new THREE.Vector3(mainNumber.getNumberMeshPos().x + room1TargetOffset, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z + cameraOffset / 2);
        });
    });

    let rotationAngle;
    let xFrameOffset;
    for (let i = 0; i < zFramePositions.length; i++) {

        if (i <= 4) {
            rotationAngle = 3 * Math.PI / 2;
            xFrameOffset = -0.24;
        }
        else {
            rotationAngle = Math.PI / 2;
            xFrameOffset = 0.24;
        }

        const frame = new THREE.Mesh(smallFrameGeometry, materialFrame);
        frame.position.set(zFramePositions[i].x + xFrameOffset, zFramePositions[i].y, zFramePositions[i].z);
        frame.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
        frame.castShadow = true;
        frame.receiveShadow = true;
        environmentObjects.push(frame);
        scene.add(frame);

        const smallNumber = new NumberConstruct(parseFloat(GUIOptions.numberValue), GUIOptions.numberStyle, GUIOptions.numberFont,
            new THREE.Vector3(zFramePositions[i].x, zFramePositions[i].y, zFramePositions[i].z));

        smallNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, THREE.MathUtils.randFloat(0, Math.pow(10, THREE.MathUtils.randInt(0, 5))),
            GUIOptions.numberStyle, GUIOptions.numberFont, 0.5, rotationAngle);
    }

    for (let i = 0; i < xFramePositions.length; i++) {
        const frame = new THREE.Mesh(smallFrameGeometry, materialFrame);
        frame.position.set(xFramePositions[i].x, xFramePositions[i].y, xFramePositions[i].z - 0.24);
        frame.castShadow = true;
        frame.receiveShadow = true;
        environmentObjects.push(frame);
        scene.add(frame);

        const smallNumber = new NumberConstruct(parseFloat(GUIOptions.numberValue), GUIOptions.numberStyle, GUIOptions.numberFont,
            new THREE.Vector3(xFramePositions[i].x, xFramePositions[i].y, xFramePositions[i].z));
        smallNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, THREE.MathUtils.randFloat(0, Math.pow(10, THREE.MathUtils.randInt(0, 5))),
            GUIOptions.numberStyle, GUIOptions.numberFont, 0.5, Math.PI);
    }
}

// FRONT view
const numberControl = gui.addFolder("Number Control");
numberControl.add(GUIOptions, 'numberValue').name('Value').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberStyle', ['European', 'European No Separator', 'US', 'US No Separator']).name('Style').onFinishChange(numberMeshCallback);
numberControl.add(GUIOptions, 'numberFont', ['Avenir Black', 'Crash Numbering Serif', 'Nexa Rust Handmade', 'Pecita',
    'Press Start 2P', 'Roboto Bold']).name('Font').onFinishChange(numberMeshCallback);

const mainNumber = new NumberConstruct(parseFloat(GUIOptions.numberValue), GUIOptions.numberStyle, GUIOptions.numberFont,
    new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z));

function numberMeshCallback() {
    if (currentState === states[1]) {
        mainNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, GUIOptions.numberValue, GUIOptions.numberStyle, GUIOptions.numberFont);
        requestRenderIfNotRequested('numberMeshCallback');
    }
}


/**
 * Interactions
 */

function enterNewState() {

    scene.remove(directionalLight);

    console.log("New state: " + currentState);

    if (currentState === states[1]) {
        if (previousState === states[2]) {
            mainNumber.removePreviousCubes(scene);

            let matrixScaling = new THREE.Matrix4();
            matrixScaling.makeScale(1, 1, 1 / mainNumber.numberDepthScalingFactor);
            mainNumber.currentMesh.geometry.applyMatrix4(matrixScaling);
            mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z));
            mainNumber.currentMesh.material.side = THREE.FrontSide;
        }

        if (previousState !== states[0]) {
            loadingUI();
            orbitControls.target = new THREE.Vector3(mainNumber.getNumberMeshPos().x + room1TargetOffset, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z + cameraOffset / 2);
        }
    }
    else if (currentState === states[2]) {
        mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[1].x, roomPositions[1].y, roomPositions[1].z));

        mainNumber.generateCubeConstraint(renderer, scene, camera, 128, materialCube);

        camera.position.set(
            mainNumber.getNumberMeshPos().x,
            mainNumber.getNumberMeshPos().y,
            mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset);

        orbitControls.target = mainNumber.getNumberMeshPos();

        // Update Lighting
        const targetObject = new THREE.Object3D();
        targetObject.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);
        scene.add(targetObject);
        directionalLight.target = targetObject;
        directionalLight.position.set(
            mainNumber.getNumberMeshPos().x,
            mainNumber.getNumberMeshPos().y,
            mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset);

        scene.add(directionalLight);
    }

    orbitControls.saveState();
    savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
    console.log("Camera control state saved");
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
    if (styleButton.material === materialSelected) {
        if (states.indexOf(currentState) < states.length - 1) {
            currentState = states[states.indexOf(currentState) + 1];
            activeButtons.pop();
            activeButtons.pop();
            scene.remove(scene.getObjectByName('previousStepButton'));
            scene.remove(scene.getObjectByName('nextStepButton'));
        }
    }
    else if (fontButton.material === materialSelected) {
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

let cameraCollisionDetectionVector;

const tick = () => {

    // *** Update Controls ***
    if (sceneLoaded && UILoaded) {
        orbitControls.update();

        if (!orbitControls.enabled && !cameraAnimation) {
            console.log('orbitControls enabled');
            orbitControls.enabled = true;
            orbitControls.addEventListener('change', requestRenderIfNotRequested);
        }

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
            cameraCollisionDetectionVector = new THREE.Vector3(camera.position.x - orbitControls.target.x,
                camera.position.y - orbitControls.target.y, camera.position.z - orbitControls.target.z);

            cameraRayCaster.far = cameraCollisionDetectionVector.length() + 2;

            cameraRayCaster.set(orbitControls.target, cameraCollisionDetectionVector.normalize());

            const cameraRayIntersects = cameraRayCaster.intersectObjects(environmentObjects, true);

            if (cameraRayIntersects.length > 0) {
                orbitControls.enableZoom = false;
                let newDistance = cameraRayIntersects[0].distance - 2.1;
                if (newDistance > 2) {
                    orbitControls.maxDistance = newDistance;
                }
                else {
                    orbitControls.reset();
                    camera.position.set(savedCamPos.x, savedCamPos.y, savedCamPos.z);
                    orbitControls.minDistance = currentState === states[1] ? cameraOffset / 2 : cameraOffset;
                }
            }
            else {
                orbitControls.maxDistance = 200;
                orbitControls.enableZoom = true;
                orbitControls.minDistance = 0;
            }
        }
    }

    // Debug
    stats.update();

    // Camera animation
    if (cameraAnimation) {
        orbitControls.enabled = false;
        camera.position.lerp(targetCamPosition, 0.02);
        camera.quaternion.slerp(targetCamOrientation, 0.02);
        if (new THREE.Vector3(targetCamPosition.x - camera.position.x, targetCamPosition.y - camera.position.y, targetCamPosition.z - camera.position.z).lengthSq() < 0.01) {
            cameraAnimation = false;
            targetCamPosition.set(camera.position.x, camera.position.y, camera.position.z);
            //targetCamOrientation.copy(camera.quaternion);
        }
        requestRenderIfNotRequested('cameraAnimation');
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

function render() {
    renderRequested = false;
    renderer.render(scene, camera);
}

function requestRenderIfNotRequested(caller) {

    // if (caller != 'cameraAnimation') {
    // console.log("Rendering requested by ");
    // console.log(caller);
    // }

    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
    }
}

function cameraAnimationDispatcher(targetPos, targetOrientation) {
    targetCamPosition = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    targetCamOrientation.setFromEuler(targetOrientation);
    cameraAnimation = true;
}

function loadingUIInit() {
    return new Promise(resolve => {
        fontUITitle = fontLoader.load('/fonts/Avenir Black_Regular.json', function (font) {
            UITitleGeometry1 = new THREE.TextGeometry('Customization Panel', {
                font: font,
                size: 0.32,
                height: 0.01,
                curveSegments: 16,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            UIInstructionMesh1 = new THREE.Mesh(UITitleGeometry1, materialNumber);
            UIInstructionMesh1.position.set(mainNumber.getNumberMeshPos().x + 9.8, mainNumber.getNumberMeshPos().y + 2.2, mainNumber.getNumberMeshPos().z + 0.1);
            //scene.add(UIInstructionMesh1);

            UITitleGeometry2 = new THREE.TextGeometry('Style', {
                font: font,
                size: 0.24,
                height: 0.01,
                curveSegments: 16,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            UIInstructionMesh2 = new THREE.Mesh(UITitleGeometry2, materialNumber);
            UIInstructionMesh2.position.set(mainNumber.getNumberMeshPos().x + 9.8, mainNumber.getNumberMeshPos().y + 1.45, mainNumber.getNumberMeshPos().z + 0.1);
            //scene.add(UIInstructionMesh2);

            UITitleGeometry3 = new THREE.TextGeometry('Font', {
                font: font,
                size: 0.24,
                height: 0.01,
                curveSegments: 16,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            UIInstructionMesh3 = new THREE.Mesh(UITitleGeometry3, materialNumber);
            UIInstructionMesh3.position.set(mainNumber.getNumberMeshPos().x + 9.8, mainNumber.getNumberMeshPos().y + 0.1, mainNumber.getNumberMeshPos().z + 0.1);
            //scene.add(UIInstructionMesh3);

            UITitleGeometry4 = new THREE.TextGeometry('Welcome to the', {
                font: font,
                size: 0.8,
                height: 1,
                curveSegments: 24,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            UITitleGeometry4.center();
            UIInstructionMesh4 = new THREE.Mesh(UITitleGeometry4, materialNumber);
            UIInstructionMesh4.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y + 0.8, mainNumber.getNumberMeshPos().z);
            scene.add(UIInstructionMesh4);

            UITitleGeometry5 = new THREE.TextGeometry('Art_Value Gallery!', {
                font: font,
                size: 0.8,
                height: 1,
                curveSegments: 24,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            UITitleGeometry5.center();
            UIInstructionMesh5 = new THREE.Mesh(UITitleGeometry5, materialNumber);
            UIInstructionMesh5.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y - 0.8, mainNumber.getNumberMeshPos().z);
            scene.add(UIInstructionMesh5);


            fontUIContent = fontLoader.load('/fonts/Avenir Book_Regular.json', function (font) {
                UIContentGeometry1 = new THREE.TextGeometry(GUIOptions.numberStyle, {
                    font: font,
                    size: 0.24,
                    height: 0.12,
                    curveSegments: 16,
                    bevelEnabled: false,
                    bevelThickness: 10,
                    bevelSize: 8,
                    bevelOffset: 0,
                    bevelSegments: 5
                });
                UIContentMesh1 = new THREE.Mesh(UIContentGeometry1, materialNumber);
                UIContentMesh1.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y + 0.9, mainNumber.getNumberMeshPos().z + 0.1);
                //scene.add(UIContentMesh1);

                UIContentGeometry2 = new THREE.TextGeometry(GUIOptions.numberFont, {
                    font: font,
                    size: 0.24,
                    height: 0.12,
                    curveSegments: 16,
                    bevelEnabled: false,
                    bevelThickness: 10,
                    bevelSize: 8,
                    bevelOffset: 0,
                    bevelSegments: 5
                });

                UIContentMesh2 = new THREE.Mesh(UIContentGeometry2, materialNumber);
                UIContentMesh2.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y - 0.4, mainNumber.getNumberMeshPos().z + 0.1);
                //scene.add(UIContentMesh2);

                fontButton = new THREE.Mesh(buttonGeometry, materialUnselected);
                styleButton = new THREE.Mesh(buttonGeometry, materialUnselected);
                UIBackground = new THREE.Mesh(UIBackgroundGeometry, materialUI);
                smallTriangle1 = new THREE.Mesh(smallTriangleGeometry, materialNumber);
                smallTriangle2 = new THREE.Mesh(smallTriangleGeometry, materialNumber);

                styleButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
                smallTriangle1.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
                smallTriangle1.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
                fontButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
                smallTriangle2.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
                smallTriangle2.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
                UIBackground.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);

                //fontButton.name = 'nextStepButton';
                //styleButton.name = 'previousStepButton';

                // activeButtons.push(styleButton, fontButton);
                // scene.add(styleButton);
                // scene.add(fontButton);
                // scene.add(smallTriangle1);
                // scene.add(smallTriangle2);
                // scene.add(UIBackground);

                resolve(true);
            });
        });
    });
}

// Font loaded
function loadingUI() {

    scene.add(UIInstructionMesh1);

    scene.add(UIInstructionMesh2);

    scene.add(UIInstructionMesh3);

    scene.add(UIContentMesh1);

    scene.add(UIContentMesh2);

    // const fontButton = new THREE.Mesh(buttonGeometry, materialUnselected);
    // const styleButton = new THREE.Mesh(buttonGeometry, materialUnselected);
    // const UIBackground = new THREE.Mesh(UIBackgroundGeometry, materialUI);
    // const smallTriangle1 = new THREE.Mesh(smallTriangleGeometry, materialNumber);
    // const smallTriangle2 = new THREE.Mesh(smallTriangleGeometry, materialNumber);

    // styleButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
    // smallTriangle1.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
    // smallTriangle1.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
    // fontButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
    // smallTriangle2.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
    // smallTriangle2.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
    // UIBackground.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);

    // fontButton.name = 'nextStepButton';
    // styleButton.name = 'previousStepButton';

    activeButtons.push(styleButton, fontButton);
    scene.add(styleButton);
    scene.add(fontButton);
    scene.add(smallTriangle1);
    scene.add(smallTriangle2);
    scene.add(UIBackground);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

init();

tick();