import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import * as dat from 'dat.gui';
import Stats from 'stats.js/src/Stats.js';

import { NumberConstruct } from './class_NumberConstruct.js';

import noiseVertexShader from './shaders/Perlin_noise/vertex.glsl';
import noiseFragmentShader from './shaders/Perlin_noise/fragment.glsl'

/**
 * Base
 */

// Window sizes

let renderQuality = 2;

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

    if (renderQuality === 0) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    }
    else if (renderQuality === 1) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    else if (renderQuality === 2) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    requestRenderIfNotRequested('resize event');
});

// Canvas
const canvas = document.querySelector('canvas.webgl');

// DOM Elements
let imageHolder = document.createElement('div');
let dragNDropText = document.createElement('b');

// Rendering
let renderRequested = false;
let sceneLoaded = false;
let UILoaded = false;

// Number sytles & fonts
let styleOptions = ['European', 'European No Separator', 'US', 'US No Separator'];
let fontOptions = ['Avenir Black', 'Crash Numbering Serif', 'Nexa Rust Handmade', 'Pecita', 'Press Start 2P', 'Roboto Bold'];

// dat.gui

let mainNumberOptions = {
    lightHelperFlag: false,
    lightHelperEnabled: false,
    numberValue: 1234.56,
    numberStyle: styleOptions[0],
    numberFont: fontOptions[0],

    devMode: false,
    qualityScalar: 1
};

let devMode;

// const testingControl = gui.addFolder('Testing');
// testingControl.add(GUIOptions, 'devMode').name('Dev Mode').onChange(devModeCallback);
// testingControl.open();

function devModeCallback() {
    devMode = mainNumberOptions.devMode;
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
const states = ['None', 'Room 1', '1 to 2', 'Room 2', '2 to 3', 'Room 3', '3 to 4', 'Room 4', '4 to 5', 'Room 5'];
const roomPositions = [new THREE.Vector3(-20, 8, -58.6), new THREE.Vector3(-20, 10.5, -130), new THREE.Vector3(-130, 10.5, -130), new THREE.Vector3(-130, 10.5, -20), new THREE.Vector3(-80, 18, -70)];
const ceilingLightPositions = [new THREE.Vector3(-40, 35, -40), new THREE.Vector3(-40, 35, -110), new THREE.Vector3(-110, 35, -110), new THREE.Vector3(-110, 35, -40)];
const spotlightPositions = [new THREE.Vector3(-20, 23.2, -40), new THREE.Vector3(-20, 0, -75), new THREE.Vector3(-75, 0, -130), new THREE.Vector3(-130, 0, -75)];

const zFramePositions = [new THREE.Vector3(-1, 8, -50), new THREE.Vector3(-1, 8, -40), new THREE.Vector3(-1, 8, -30), new THREE.Vector3(-1, 8, -20),
new THREE.Vector3(-1, 8, -10), new THREE.Vector3(-39.219, 8, -10), new THREE.Vector3(-39.221, 8, -20), new THREE.Vector3(-39.223, 8, -30),
new THREE.Vector3(-39.225, 8, -40), new THREE.Vector3(-39.23, 8, -50)];

const xFramePositions = [new THREE.Vector3(-10, 8, -1), new THREE.Vector3(-20, 8, -1), new THREE.Vector3(-30, 8, -1)];

let previousState = states[0];
let currentState = states[0];

let activeButtons = [];
let environmentObjects = [];
let cameraOffset = 30;
let room1TargetOffset = 5;

const iconScalar = 0.0002;
let iconAnimCounter = 0;
const targetIconAnimScale = new THREE.Vector3(0.4 * iconScalar, -0.4 * iconScalar, 0.4 * iconScalar);
let middleWheelIconAdded = false;

let onClickPhase1 = true;
let onClickPhase2 = false;
let onClickPhase3 = false;
let UIMenuExpanded = [false, false];

let wheelMovementEnabled = false;
let currentCamPosIndex = 0;
let goingBackEnabled = false;
let ceilingLightsOnEnabled = false;
let ceilingLightsOffEnabled = false;

let imageSideGenerated = false;
let stlFileGenerated = false;

let desiredCamPositions1To2 = [new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z + cameraOffset + 10),
new THREE.Vector3(-24, 8, -26),
new THREE.Vector3(-24, 8, -33),
new THREE.Vector3(-28, 8, -40),
new THREE.Vector3(-32, 8, -50),
new THREE.Vector3(-35, 8.5, -60),
new THREE.Vector3(-32, 9, -70),
new THREE.Vector3(-28, 9.5, -80),
new THREE.Vector3(-24, 10, -90),
new THREE.Vector3(-20, 10.5, -100)];

let desiredCamOrientations1To2 = [new THREE.Euler(0, 0, 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(15), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(30), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(25), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(20), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(10), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-5), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-5), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ')];

let desiredCamPositions2To3 = [new THREE.Vector3(roomPositions[1].x - 30, roomPositions[1].y, roomPositions[1].z + 10),
new THREE.Vector3(-50, 10.5, -130),
new THREE.Vector3(-50, 10.5, -130),
new THREE.Vector3(-55, 10.5, -135),
new THREE.Vector3(-60, 10.5, -140),
new THREE.Vector3(-65, 10.5, -145),
new THREE.Vector3(-70, 10.5, -140),
new THREE.Vector3(-80, 10.5, -135),
new THREE.Vector3(-90, 10.5, -130),
new THREE.Vector3(-100, 10.5, -130)];

let desiredCamOrientations2To3 = [new THREE.Euler(0, degreesToRadians(-45), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-90), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-140), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-160), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-180), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(160), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(140), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(120), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(100), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ')];

let desiredCamPositions3To4 = [new THREE.Vector3(roomPositions[2].x + 30, roomPositions[2].y, roomPositions[2].z + 30),
new THREE.Vector3(-100, 10.5, -100),
new THREE.Vector3(-105, 10.5, -95),
new THREE.Vector3(-110, 10.5, -90),
new THREE.Vector3(-115, 10.5, -85),
new THREE.Vector3(-120, 10.5, -80),
new THREE.Vector3(-125, 10.5, -74),
new THREE.Vector3(-130, 9.5, -68),
new THREE.Vector3(-130, 8.5, -60)];

let desiredCamOrientations3To4 = [new THREE.Euler(0, degreesToRadians(45), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(75), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(100), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(120), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(135), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(150), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(165), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ')];

let desiredCamPositions4To5 = [new THREE.Vector3(roomPositions[3].x + 30, 8.5, roomPositions[3].z - 30),
new THREE.Vector3(-85, 8.5, -40),
new THREE.Vector3(-80, 8.5, -30),
new THREE.Vector3(-70, 8.5, -20),
new THREE.Vector3(-65, 8.5, -40),
new THREE.Vector3(-55, 8.5, -55),
new THREE.Vector3(-55, 12, -75),
new THREE.Vector3(-55, 15, -90),
new THREE.Vector3(-60, 16, -95),
new THREE.Vector3(-66, 17, -95),
new THREE.Vector3(-70, 18, -90)];

let desiredCamOrientations4To5 = [new THREE.Euler(0, degreesToRadians(135), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(45), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-20), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(-5), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(30), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(120), 0, 'XYZ'),
new THREE.Euler(0, degreesToRadians(140), 0, 'XYZ')];

// Scene
const scene = new THREE.Scene();

// Loaders

// const textureLoader = new THREE.TextureLoader()
// const normalTexture = textureLoader.load('/textures/seamless_brick_rock_wall_normal_map.png', function (tex) {
//     // tex and normalTexture are the same here, but that might not always be the case
//     //console.log("normalTexture", tex.image.width, tex.image.height);
// });

const fontLoader = new THREE.FontLoader();

const gltfLoader1 = new GLTFLoader();
const gltfLoader2 = new GLTFLoader();
const objLoader1 = new OBJLoader();
const objLoader2 = new OBJLoader();

// Exporter
const stlExporter = new STLExporter();

// Groups
const leftClickIcon = new THREE.Group();
const middleWheelIcon = new THREE.Group();
const rightClickIcon = new THREE.Group();

// Geometry
const smallBoxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const dropdownButtonGeometry = new THREE.BoxGeometry(4.5, 0.6, 0.4);
const smallTriangleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.45, 3);
const UIBackgroundGeometry = new THREE.BoxGeometry(5.2, 6, 0.2);
const buttonGeometry = new THREE.BoxGeometry(1.4, 1.4, 0.4);

const smallFrameGeometry = new THREE.BoxGeometry(4, 3, 0.5);
const largeFrameGeometry = new THREE.BoxGeometry(16, 9, 1);

const platformGeometry = new THREE.BoxGeometry(16, 2, 16);
const rampGeometry = new THREE.CylinderGeometry(2, 2, 2, 3);

let tickGeometry;
let crossGeometry;
let UITitleGeometry1;
let UITitleGeometry2;
let UITitleGeometry3;
let UITitleGeometry4;
let UITitleGeometry5;
let UITitleGeometry6;
let UITitleGeometry7;

let UIContentGeometry1;
let UIContentGeometry2;

let unitCubeGeometry;

// Materials

// const materialTile = new THREE.MeshStandardMaterial();
// materialTile.metalness = 0.0;
// materialTile.roughness = 0.7;
// normalTexture.wrapS = THREE.RepeatWrapping;
// normalTexture.wrapT = THREE.RepeatWrapping;
// normalTexture.repeat.set(0.5, 0.5); // scale
// materialTile.normalMap = normalTexture;
// materialTile.color = new THREE.Color(0x808080);

const materialFrame = new THREE.MeshStandardMaterial();
materialFrame.color = new THREE.Color(0x020202);
materialFrame.metalness = 0.0;
materialFrame.roughness = 0.8;

const materialSpotlight = new THREE.MeshStandardMaterial();
materialSpotlight.color = new THREE.Color(0x222222);
materialSpotlight.metalness = 0.5;
materialSpotlight.roughness = 0.5;

// const materialNumber = new THREE.MeshStandardMaterial();
// materialNumber.color = new THREE.Color(0xFFFFFF);
const materialNumber = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });
materialNumber.transparent = true;
materialNumber.opacity = 1.0;

const materialUI = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
materialUI.transparent = true;
materialUI.opacity = 1.0;

const materialCube = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
materialCube.transparent = true;
materialCube.opacity = 0.3;

//const materialPrintedCube = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
const materialPrintedCube = new THREE.MeshStandardMaterial();
materialPrintedCube.color = new THREE.Color(0xEEEEEE);

const materialPlatform = new THREE.MeshStandardMaterial();
materialPlatform.color = new THREE.Color(0x999999);
materialPlatform.roughness = 0.4;

const materialUIBackground = new THREE.MeshBasicMaterial({ color: 0x040404 });
materialUIBackground.transparent = true;
materialUIBackground.opacity = 0.5;

const materialUnselected = new THREE.MeshBasicMaterial({ color: 0x333333 });
// materialUnselected.transparent = true;
// materialUnselected.opacity = 0.7;

const materialSelected = new THREE.MeshBasicMaterial({ color: 0x666666 });
// materialSelected.transparent = true;
// materialSelected.opacity = 0.7;

const materialEmpty = new THREE.MeshBasicMaterial({ color: 0x000000 });
materialEmpty.transparent = true;
materialEmpty.opacity = 0;


// Classic 3D Perlin Noise Material

let noiseOptions = {
    depthColor: '#186691',
    surfaceColor: '#9bd8ff'
};

const noiseMaterial = new THREE.ShaderMaterial({
    vertexShader: noiseVertexShader,
    fragmentShader: noiseFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },

        uBigWavesElevation: { value: 0.05 },
        uBigWavesFrequency: { value: new THREE.Vector2(2, 2) },
        uBigWavesSpeed: { value: 1 },

        uSmallWavesElevation: { value: 0.1 },
        uSmallWavesFrequency: { value: 1 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallIterations: { value: 2 },

        uDepthColor: { value: new THREE.Color(noiseOptions.depthColor) },
        uSurfaceColor: { value: new THREE.Color(noiseOptions.surfaceColor) },
        uColorOffset: { value: 0.08 },
        uColorMultiplier: { value: 5 }
    }
});


// Meshes
let testingMesh = new THREE.Mesh(smallBoxGeometry, materialNumber);
let styleButton;
let styleButton1;
let styleButton2;
let styleButton3;
let styleButton4;

let fontButton;
let fontButton1;
let fontButton2;
let fontButton3;
let fontButton4;
let fontButton5;
let fontButton6;

let UIBackground;
let smallTriangle1;
let smallTriangle2;
let confirmButton;
let cancelButton;

let tickMesh;
let crossMesh;
let UIInstructionMesh1;
let UIInstructionMesh2;
let UIInstructionMesh3;
let UIInstructionMesh4;
let UIInstructionMesh5;
let UIInstructionMesh6;
let UIInstructionMesh7;

let styleTextMesh;
let styleTextMeshes = [];

let fontTextMesh;
let fontTextMeshes = [];

let largeFrame;

let finalInstancedMesh;
let finalInstancedMeshCube;
let platformMesh = new THREE.Mesh(platformGeometry, materialPlatform);
let rampMesh = new THREE.Mesh(rampGeometry, materialPlatform);

// Loading UI Elements
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
overlayMaterial.transparent = true;
overlayMaterial.opacity = 0.6;
overlayMaterial.side = THREE.DoubleSide;

const loadingOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial);

let loadingBarElement0 = document.querySelector('.loading-bar0');
let loadingBarElement1 = document.querySelector('.loading-bar1');
loadingBarElement0.style.transform = `scaleX(${0.0})`;
loadingBarElement1.style.transform = `scaleX(${0.0})`;

// Fonts
let fontAvenirBook;

/**
 * Lights & Shadows
 */
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
scene.add(ambientLight);

let shadowMapSizeScalar = 1;

let groundLight1;
let groundLight2;

const spotlightTargetObject = new THREE.Object3D();

// const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5.0);
// directionalLight.castShadow = true;
// directionalLight.shadow.mapSize.width = 2048 * shadowMapSizeScalar;
// directionalLight.shadow.mapSize.height = 2048 * shadowMapSizeScalar;
// directionalLight.shadow.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.5, 100);
// directionalLight.shadow.normalBias = 0.1;
// directionalLight.shadow.bias = 0.0001;

// const directionalLightControl = gui.addFolder("Directional Light");
// directionalLightControl.add(directionalLight.position, 'x').min(0).max(50).step(0.01).listen();
// directionalLightControl.add(directionalLight.position, 'y').min(0).max(100).step(0.01).listen();
// directionalLightControl.add(directionalLight.position, 'z').min(0).max(50).step(0.01).listen();
// directionalLightControl.add(directionalLight, 'intensity').min(0).max(10).step(0.01).listen();
// directionalLightControl.add(GUIOptions, 'lightHelperFlag').name('Light Helper').onChange(directionalLightHelperCallback);

// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 2, new THREE.Color('yellow'));
// directionalLightHelper.name = 'lightHelper';

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(directionalLightCameraHelper);

// function directionalLightHelperCallback() {
//     if (mainNumberOptions.lightHelperFlag && !mainNumberOptions.lightHelperEnabled) {
//         scene.add(directionalLightHelper);
//         mainNumberOptions.lightHelperEnabled = true;
//     }
//     else if (!mainNumberOptions.lightHelperFlag && mainNumberOptions.lightHelperEnabled) {
//         scene.remove(scene.getObjectByName('lightHelper'));
//         mainNumberOptions.lightHelperEnabled = false;
//     }
//     requestRenderIfNotRequested('lightHelperCallback');
// }

// testingMesh.position.set(spotlightPositions[1].x, roomPositions[1].y - 1, spotlightPositions[1].z - 2)
// scene.add(testingMesh);

// function updateShadowMapSize(scalar) {
//     scene.remove(ceilingLight0);
//     ceilingLight0.shadow.mapSize.width = 2048 * scalar;
//     ceilingLight0.shadow.mapSize.height = 2048 * scalar;
//     ceilingLight0.castShadow = true;
//     //scene.add(ceilingLight0);
//     ceilingLight1.shadow.mapSize.width = 2048 * scalar;
//     ceilingLight1.shadow.mapSize.height = 2048 * scalar;
//     ceilingLight2.shadow.mapSize.width = 2048 * scalar;
//     ceilingLight2.shadow.mapSize.height = 2048 * scalar;
//     ceilingLight3.shadow.mapSize.width = 2048 * scalar;
//     ceilingLight3.shadow.mapSize.height = 2048 * scalar;
// }

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
//orbitControls.update();
orbitControls.addEventListener('change', requestRenderIfNotRequested);
orbitControls.enabled = false;

// initial value
let initialCamPos = new THREE.Vector3(roomPositions[0].x + room1TargetOffset, roomPositions[0].y + 15, roomPositions[0].z + 50);
let initialCamOrientation = new THREE.Euler();
initialCamOrientation.setFromVector3(new THREE.Vector3(degreesToRadians(-20), 0, 0));

let savedCamPos = new THREE.Vector3(roomPositions[0].x + room1TargetOffset, roomPositions[0].y, roomPositions[0].z + cameraOffset);

// animation
let cameraAnimation = false;
let initialCameraAnimationDone = false;
let cameraAnimationDuration = 2;

let iconAnimation = false;
let iconAnimationDone = false;
let targetCamPosition = new THREE.Vector3(0, 0, 0);
let targetCamOrientation = new THREE.Quaternion();
let startCamPosition = new THREE.Vector3(0, 0, 0);
let startCamOrientation = new THREE.Quaternion();

let materialAnimation = false;

/**
 * Renderer
 */

let renderer;

// const rendererControl = gui.addFolder("Renderer Properties");
// rendererControl.add(renderer, 'toneMappingExposure').min(0).max(2).step(0.01).onChange(requestRenderIfNotRequested);

const updateAllMaterials = () => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            // add environment map
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

const ceilingLight0 = new THREE.PointLight(0xFFFFFF, 40, 150);
const ceilingLight1 = new THREE.PointLight(0xFFFFFF, 40, 150);
const ceilingLight2 = new THREE.PointLight(0xFFFFFF, 40, 150);
const ceilingLight3 = new THREE.PointLight(0xFFFFFF, 40, 150);
const spotLight0 = new THREE.SpotLight(0xFFFFFF, 40, 100, Math.PI / 8, 0.2);
const spotLightEffect = new THREE.PointLight(0xFFFFFF, 10, 5);
const groundSpotLight1 = new THREE.SpotLight(0xFFFFFF, 200, 100, Math.PI / 17, 0.5, 0.1);
const groundLight1Effect = new THREE.PointLight(0xFFFFFF, 20, 5);
const groundSpotLight2 = new THREE.SpotLight(0xFFFFFF, 200, 100, Math.PI / 17, 0.5, 0.1);
const groundLight2Effect = new THREE.PointLight(0xFFFFFF, 20, 5);

function initLightsAndShadows() {
    let aaEnabled = false;
    if (renderQuality === 2) aaEnabled = true;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: aaEnabled,
        powerPreference: "high-performance"
    });

    renderer.setSize(sizes.width, sizes.height);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;

    if (renderQuality === 0) {
        renderer.shadowMap.type = THREE.BasicShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    }
    else if (renderQuality === 1) {
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    else if (renderQuality === 2) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    ceilingLight0.position.set(ceilingLightPositions[0].x, ceilingLightPositions[0].y - 1.5, ceilingLightPositions[0].z);
    ceilingLight0.castShadow = true;
    ceilingLight0.shadow.mapSize.width = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight0.shadow.mapSize.height = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight0.shadow.normalBias = 0.1;
    ceilingLight0.shadow.bias = 0.0001;
    scene.add(ceilingLight0);

    ceilingLight1.position.set(ceilingLightPositions[1].x, ceilingLightPositions[1].y - 1.5, ceilingLightPositions[1].z);
    ceilingLight1.castShadow = true;
    ceilingLight1.shadow.mapSize.width = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight1.shadow.mapSize.height = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight1.shadow.normalBias = 0.1;
    ceilingLight1.shadow.bias = 0.0001;
    scene.add(ceilingLight1);

    ceilingLight2.position.set(ceilingLightPositions[2].x, ceilingLightPositions[2].y - 1.5, ceilingLightPositions[2].z);
    ceilingLight2.castShadow = true;
    ceilingLight2.shadow.mapSize.width = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight2.shadow.mapSize.height = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight2.shadow.normalBias = 0.1;
    ceilingLight2.shadow.bias = 0.0001;
    scene.add(ceilingLight2);

    ceilingLight3.position.set(ceilingLightPositions[3].x, ceilingLightPositions[3].y - 1.5, ceilingLightPositions[3].z);
    ceilingLight3.castShadow = true;
    ceilingLight3.shadow.mapSize.width = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight3.shadow.mapSize.height = Math.round(2048 * shadowMapSizeScalar);
    ceilingLight3.shadow.normalBias = 0.1;
    ceilingLight3.shadow.bias = 0.0001;
    scene.add(ceilingLight3);

    spotLight0.position.set(spotlightPositions[0].x, spotlightPositions[0].y, spotlightPositions[0].z);
    spotLight0.castShadow = true;
    spotLight0.shadow.mapSize.width = Math.round(1024 * shadowMapSizeScalar);
    spotLight0.shadow.mapSize.height = Math.round(1024 * shadowMapSizeScalar);
    spotLight0.shadow.normalBias = 0.2;
    spotLight0.shadow.bias = 0.0001;
    spotLight0.intensity = 0;
    spotLight0.castShadow = false;
    scene.add(spotLight0);

    spotLightEffect.position.set(spotlightPositions[0].x, spotlightPositions[0].y, spotlightPositions[0].z);
    spotLightEffect.castShadow = true;
    spotLightEffect.shadow.mapSize.width = Math.round(512 * shadowMapSizeScalar);
    spotLightEffect.shadow.mapSize.height = Math.round(512 * shadowMapSizeScalar);
    spotLightEffect.shadow.normalBias = 0.1;
    spotLightEffect.shadow.bias = 0.0001;

    spotLightEffect.intensity = 0;
    spotLightEffect.castShadow = false;
    scene.add(spotLightEffect);

    groundSpotLight1.position.set(spotlightPositions[1].x, roomPositions[1].y, spotlightPositions[1].z - 2);
    groundSpotLight1.castShadow = true;
    groundSpotLight1.shadow.mapSize.width = Math.round(1024 * shadowMapSizeScalar);
    groundSpotLight1.shadow.mapSize.height = Math.round(1024 * shadowMapSizeScalar);
    groundSpotLight1.shadow.normalBias = 0.01;
    groundSpotLight1.shadow.bias = 0.0001;
    groundSpotLight1.shadow.camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 30, 80);
    groundSpotLight1.intensity = 0;
    groundSpotLight1.castShadow = false;
    scene.add(groundSpotLight1);

    groundLight1Effect.position.set(spotlightPositions[1].x, roomPositions[1].y - 1, spotlightPositions[1].z - 2);
    groundLight1Effect.intensity = 0;
    scene.add(groundLight1Effect);

    groundSpotLight2.position.set(spotlightPositions[3].x, roomPositions[2].y, spotlightPositions[3].z - 2);
    groundSpotLight2.castShadow = true;
    groundSpotLight2.shadow.mapSize.width = Math.round(1024 * shadowMapSizeScalar);
    groundSpotLight2.shadow.mapSize.height = Math.round(1024 * shadowMapSizeScalar);
    groundSpotLight2.shadow.normalBias = 0.01;
    groundSpotLight2.shadow.bias = 0.0001;
    groundSpotLight2.shadow.camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 30, 80);
    groundSpotLight2.intensity = 0;
    groundSpotLight2.castShadow = false;
    scene.add(groundSpotLight2);

    groundLight2Effect.position.set(spotlightPositions[3].x, roomPositions[2].y - 1, spotlightPositions[3].z - 2);
    groundLight2Effect.intensity = 0;
    scene.add(groundLight2Effect);
}

/**
 * Setting up the main scene
 */
async function init() {

    initLightsAndShadows();

    qualitySelectorSlider.remove();
    document.body.removeChild(initUIText0);
    document.body.removeChild(initUIText1);
    document.body.removeChild(initUIText2);
    document.body.removeChild(initUIText3);
    document.body.removeChild(numberInputField);
    document.body.removeChild(buttonHolder);

    loadingBarElement0.style.transform = `scaleX(${0.1})`;

    console.assert(previousState === states[0]);

    mainNumber = new NumberConstruct(mainNumberOptions.numberValue, mainNumberOptions.numberStyle, mainNumberOptions.numberFont,
        new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z));

    camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
    camera.setRotationFromEuler(initialCamOrientation);
    scene.add(camera);

    const galleryAsyncLoading = gltfLoader1.loadAsync('/models/NumberGallery/glb/NumberGallery.glb');

    const groundLightAsyncLoading = gltfLoader2.loadAsync('/models/Lights/groundLight.glb');

    const ceilingLightAsyncLoading = objLoader1.loadAsync('/models/Lights/CeilingLight.obj');

    const spotLightAsyncLoading = objLoader2.loadAsync('/models/Lights/Spotlight.obj');

    loadingBarElement0.style.transform = `scaleX(${0.5})`;

    Promise.all([galleryAsyncLoading, ceilingLightAsyncLoading, spotLightAsyncLoading, groundLightAsyncLoading]).then(async models => {

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

        const spotlight = models[2].clone();

        for (let i = 0; i < spotlight.children.length; i++) {
            spotlight.children[i].material = materialSpotlight;
        }
        //spotlight.setRotationFromEuler(new THREE.Euler(0, -Math.PI * 3 / 4, Math.PI, 'XYZ'));
        //spotlight.position.addVectors(new THREE.Vector3(7, 1.7, -27), spotlightPositions[0]);
        spotlight.position.set(spotlightPositions[0].x, spotlightPositions[0].y, spotlightPositions[0].z);
        scene.add(spotlight);

        groundLight1 = models[3].scene.clone();
        groundLight1.scale.set(1, 1, 1);
        groundLight1.position.set(spotlightPositions[1].x, spotlightPositions[1].y, spotlightPositions[1].z);
        groundLight1.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ'));
        groundLight1.material = materialSpotlight;
        scene.add(groundLight1);

        groundLight2 = models[3].scene.clone();

        largeFrame = new THREE.Mesh(largeFrameGeometry, materialFrame);
        largeFrame.position.set(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z - 0.02);
        environmentObjects.push(largeFrame);
        scene.add(largeFrame);

        loadingBarElement0.style.transform = `scaleX(${0.8})`;

        updateAllMaterials();

        Promise.all([mainNumber.addNumberMesh(renderer, scene, camera, materialNumber, false), initUI()]).then(async loadingResults => {

            sceneLoaded = loadingResults[0];
            if (sceneLoaded) console.log("Scene loaded!");
            UILoaded = loadingResults[1];
            if (UILoaded) console.log("UI loaded!");
            camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
            camera.setRotationFromEuler(initialCamOrientation);

            renderer.compile(scene, camera);
            requestRenderIfNotRequested('First frame for renderer compiling');

            //loadingBarElement.style.transform = `scaleX(${1})`;
            loadingBarElement0.classList.add('ended');
            loadingBarElement0.style.transform = '';

            Promise.all([loadSVG(['/svg/mouse_left_click.svg', '/svg/mouse_wheel.svg', '/svg/mouse_right_click.svg',
                '/svg/camera_rotate.svg', '/svg/camera_zoom.svg', '/svg/camera_pan.svg']), asyncTimeout(1000)]).then(results => {

                    if (results[0]) console.log("SVG loaded!");

                    camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
                    camera.setRotationFromEuler(initialCamOrientation);
                    cameraAnimationDispatcher(camera.position, savedCamPos, camera.quaternion, new THREE.Euler(0, 0, 0, 'XYZ'), 2.5);

                    currentState = states[1];
                    orbitControls.target = new THREE.Vector3(mainNumber.getNumberMeshPos().x + room1TargetOffset, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z + cameraOffset / 2);

                });
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

        const smallNumber = new NumberConstruct(mainNumberOptions.numberValue, mainNumberOptions.numberStyle, mainNumberOptions.numberFont,
            new THREE.Vector3(zFramePositions[i].x, zFramePositions[i].y, zFramePositions[i].z));

        smallNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, THREE.MathUtils.randFloat(0, Math.pow(10, THREE.MathUtils.randInt(0, 5))),
            mainNumberOptions.numberStyle, mainNumberOptions.numberFont, 0.5, rotationAngle);
    }

    for (let i = 0; i < xFramePositions.length; i++) {
        const frame = new THREE.Mesh(smallFrameGeometry, materialFrame);
        frame.position.set(xFramePositions[i].x, xFramePositions[i].y, xFramePositions[i].z - 0.24);
        frame.castShadow = true;
        frame.receiveShadow = true;
        environmentObjects.push(frame);
        scene.add(frame);

        const smallNumber = new NumberConstruct(mainNumberOptions.numberValue, mainNumberOptions.numberStyle, mainNumberOptions.numberFont,
            new THREE.Vector3(xFramePositions[i].x, xFramePositions[i].y, xFramePositions[i].z));
        smallNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, THREE.MathUtils.randFloat(0, Math.pow(10, THREE.MathUtils.randInt(0, 5))),
            mainNumberOptions.numberStyle, mainNumberOptions.numberFont, 0.5, Math.PI);
    }
}



// FRONT view
// const numberControl = gui.addFolder("Number Control");
// numberControl.add(GUIOptions, 'numberValue').name('Value').onFinishChange(numberMeshCallback);
// numberControl.add(GUIOptions, 'numberStyle', styleOptions).name('Style').onFinishChange(numberMeshCallback);
// numberControl.add(GUIOptions, 'numberFont', fontOptions).name('Font').onFinishChange(numberMeshCallback);


let mainNumber;
let mainNumberMeshClone;

async function numberMeshCallback() {
    if (currentState === states[1]) {
        Promise.all([mainNumber.addNumberMesh(renderer, scene, camera, materialNumber, true, mainNumberOptions.numberValue, mainNumberOptions.numberStyle, mainNumberOptions.numberFont)]).then(result => {
            requestRenderIfNotRequested('numberMeshCallback');
        })
    }
}

/**
 * Interactions & State Control (Model)
 */

function enterNewState() {

    // scene.remove(directionalLight);

    console.log("New state: " + currentState);

    if (currentState === states[1]) { // room 1

        if (previousState === states[2]) {
            mainNumber.removePreviousCubes(scene);
            scene.remove(mainNumberMeshClone);

            // let matrixScaling = new THREE.Matrix4();
            // matrixScaling.makeScale(1, 1, 1 / mainNumber.numberDepthScalingFactor);
            // mainNumber.currentMesh.geometry.applyMatrix4(matrixScaling);

            mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z), true);
            mainNumber.currentMesh.material.side = THREE.FrontSide;

            // scene.add(spotLightEffect);
            // scene.add(spotLight0);
            spotLight0.intensity = 40;
            spotLight0.castShadow = true;
            spotLightEffect.intensity = 10;
            spotLightEffect.castShadow = true;

            cameraAnimationDispatcher(
                camera.position,
                new THREE.Vector3(mainNumber.getNumberMeshPos().x + room1TargetOffset, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z + cameraOffset),
                camera.quaternion, new THREE.Euler(0, 0, 0, 'XYZ'), 2);
        }
        else if (previousState === states[0]) {
            orbitControls.saveState();
            savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
            console.log("Initial camera control state saved");
        }
    }
    else if (currentState === states[2]) { // 1 to 2

        leftClickIcon.visible = false;
        rightClickIcon.visible = false;
        middleWheelIcon.visible = false;

        middleWheelIconAdded = false;

        if (currentCamPosIndex !== desiredCamPositions1To2.length - 2) {
            mainNumberMeshClone = mainNumber.currentMesh.clone();
            scene.add(mainNumberMeshClone);

            mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[1].x, roomPositions[1].y, roomPositions[1].z));
            mainNumber.generateCubeConstraint(renderer, scene, camera, Math.round(128 * mainNumberOptions.qualityScalar), materialCube.clone());

            let animTime;
            if (mainNumber.numberFont !== fontOptions[4]) {
                animTime = 2;
            }
            else {
                animTime = 1.2;
            }

            Promise.all([asyncTimeout(300)]).then(results => {
                cameraAnimationDispatcher(camera.position, new THREE.Vector3(roomPositions[0].x, roomPositions[0].y, roomPositions[0].z + (cameraOffset + 10)), camera.quaternion, new THREE.Euler(0, 0, 0, 'XYZ'), animTime);
            });
        }
        else {
            console.log('Back');

            groundSpotLight1.intensity = 0;
            groundSpotLight1.castShadow = false;
            groundLight1Effect.intensity = 0;

            mainNumber.instancedMesh.castShadow = false;

            cameraAnimationDispatcher(
                camera.position,
                new THREE.Vector3(
                    mainNumber.getNumberMeshPos().x,
                    mainNumber.getNumberMeshPos().y,
                    mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset),
                camera.quaternion,
                new THREE.Euler(0, 0, 0, 'XYZ'), 2);
        }
    }
    else if (currentState === states[3]) { // room 2

        orbitControls.target = mainNumber.getNumberMeshPos();
        wheelMovementEnabled = false;

        // Update Lighting
        spotlightTargetObject.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);
        scene.add(spotlightTargetObject);

        // directionalLight.target = targetObject;
        // directionalLight.position.set(
        //     mainNumber.getNumberMeshPos().x,
        //     mainNumber.getNumberMeshPos().y,
        //     mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset);

        groundSpotLight1.target = spotlightTargetObject;
        // scene.add(groundSpotLight1);
        // scene.add(groundLightEffect);
        groundSpotLight1.intensity = 200;
        groundSpotLight1.castShadow = true;
        groundLight1Effect.intensity = 20;

        mainNumber.instancedMesh.castShadow = true;

        orbitControls.saveState();
        savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
        console.log("Camera control state saved");

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                mainNumber.getNumberMeshPos().x,
                mainNumber.getNumberMeshPos().y,
                mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset),
            camera.quaternion,
            new THREE.Euler(0, 0, 0, 'XYZ'), 1.5);

        // // Turn on All Lights
        // scene.add(spotLight0);
        // ceilingLight0.intensity = 40;
        // ceilingLight0.color = new THREE.Color(0xFFFFFF);
        // ceilingLight1.intensity = 40;
        // ceilingLight1.color = new THREE.Color(0xFFFFFF);
        // ceilingLight2.intensity = 40;
        // ceilingLight2.color = new THREE.Color(0xFFFFFF);
        // ceilingLight3.intensity = 40;
        // ceilingLight3.color = new THREE.Color(0xFFFFFF);
        // ceilingLight0.castShadow = true;
        // ceilingLight1.castShadow = true;
        // ceilingLight2.castShadow = true;
        // ceilingLight3.castShadow = true;
    }
    else if (currentState === states[4]) { // 2 to 3

        ceilingLightsOffEnabled = false;
        ceilingLightsOnEnabled = false;

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                desiredCamPositions2To3[0].x,
                desiredCamPositions2To3[0].y,
                desiredCamPositions2To3[0].z),
            camera.quaternion,
            desiredCamOrientations2To3[0], 1.5);
    }
    else if (currentState === states[5]) { // room 3
        orbitControls.target = mainNumber.getNumberMeshPos();

        middleWheelIcon.visible = false;

        if (imageSideGenerated) {
            scene.remove(finalInstancedMesh);
            imageSideGenerated = false;
        }

        spotlightTargetObject.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);
        groundSpotLight1.target = spotlightTargetObject;
        groundSpotLight2.target = spotlightTargetObject;

        // let matrixTranslation = new THREE.Matrix4();
        // let previousMatrix = new THREE.Matrix4();
        // for (let i = 0; i < mainNumber.instancedMesh.count; i++) {
        //     matrixTranslation.makeTranslation(-roomPositions[1].x, -roomPositions[1].y, -roomPositions[1].z);
        //     mainNumber.instancedMesh.getMatrixAt(i + 1, previousMatrix);
        //     mainNumber.instancedMesh.setMatrixAt(i + 1, matrixTranslation.multiply(previousMatrix));
        // }

        mainNumber.instancedMesh.position.set(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z);
        mainNumber.instancedMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'));
        mainNumber.instancedMesh.castShadow = true;
        scene.add(mainNumber.instancedMesh);

        // let v = new THREE.Vector3();
        // mainNumber.instancedMesh.getWorldPosition(v);
        // console.log(v);

        scene.remove(groundLight1);
        groundSpotLight1.position.set(spotlightPositions[2].x - 2, roomPositions[2].y, spotlightPositions[2].z);
        groundLight1Effect.position.set(spotlightPositions[2].x - 2, roomPositions[2].y - 1, spotlightPositions[2].z);
        // scene.add(groundSpotLight1);
        // scene.add(groundLightEffect);
        groundSpotLight1.intensity = 200;
        groundSpotLight1.castShadow = true;
        groundLight1Effect.intensity = 20;

        groundLight1.position.set(spotlightPositions[2].x, spotlightPositions[2].y, spotlightPositions[2].z);
        groundLight2.position.set(spotlightPositions[3].x, spotlightPositions[3].y, spotlightPositions[3].z);
        groundLight1.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(-90), 0, 'XYZ'));
        groundLight2.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(-180), 0, 'XYZ'));
        scene.add(groundLight1);
        scene.add(groundLight2);

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                mainNumber.getNumberMeshPos().x,
                mainNumber.getNumberMeshPos().y,
                mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset),
            camera.quaternion,
            new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ'), 2);

        orbitControls.saveState();
        savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
        console.log("Camera control state saved");
    }
    else if (currentState === states[6]) { // 3 to 4

        ceilingLightsOffEnabled = false;
        ceilingLightsOnEnabled = false;

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                desiredCamPositions3To4[0].x,
                desiredCamPositions3To4[0].y,
                desiredCamPositions3To4[0].z),
            camera.quaternion,
            desiredCamOrientations3To4[0], 1.5);
    }
    else if (currentState === states[7]) { // room 4

        middleWheelIcon.visible = false;
        orbitControls.target = mainNumber.getNumberMeshPos();

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                mainNumber.getNumberMeshPos().x,
                mainNumber.getNumberMeshPos().y,
                mainNumber.getNumberMeshPos().z - mainNumber.getCubeSideLength() / 2 - cameraOffset),
            camera.quaternion,
            new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ'), 1);

        scene.remove(groundLight1);
        scene.remove(groundLight2);

        orbitControls.saveState();
        savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
        console.log("Camera control state saved");
    }
    else if (currentState === states[8]) { // 4 to 5

        ceilingLightsOffEnabled = false;
        ceilingLightsOnEnabled = false;

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                desiredCamPositions4To5[0].x,
                desiredCamPositions4To5[0].y,
                desiredCamPositions4To5[0].z),
            camera.quaternion,
            desiredCamOrientations4To5[0], 1.5);
    }
    else if (currentState === states[9]) { // room 5
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material != noiseMaterial) {
                child.visible = false;
            }
        });

        environmentObjects.length = 0;
        cameraCollisionDetectionEnabled = false;

        orbitControls.target = mainNumber.getNumberMeshPos();

        cameraAnimationDispatcher(
            camera.position,
            new THREE.Vector3(
                mainNumber.getNumberMeshPos().x + mainNumber.getCubeSideLength() / 2 + 12,
                mainNumber.getNumberMeshPos().y,
                mainNumber.getNumberMeshPos().z - mainNumber.getCubeSideLength() / 2 - 12),
            camera.quaternion,
            new THREE.Euler(0, degreesToRadians(135), 0, 'XYZ'), 1.5);

        orbitControls.saveState();
        savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
        console.log("Camera control state saved");
    }
}

// Raycasting for mouse picking
const mouseRayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Raycasting for camera control
const cameraRayCaster = new THREE.Raycaster();

/**
 * Animation Loop (View)
 */

const clockForCamera = new THREE.Clock();
clockForCamera.autoStart = false;

const clockForShader = new THREE.Clock();
clockForShader.autoStart = false;

let cameraCollisionDetectionVector;
let cameraCollisionDetectionEnabled = true;
let cameraAnimationTime = 0;
let orbitControlsEnableAllowed = true;

const tick = () => {

    // *** Update Controls ***
    if (sceneLoaded && UILoaded) {

        if (previousState !== currentState) {
            enterNewState();
            previousState = currentState;
        }

        if (currentState === states[1] || currentState === states[3] || currentState === states[5] || currentState === states[7] || currentState === states[9]) {
            if (!cameraAnimation && iconAnimationDone && !wheelMovementEnabled) {
                if (!orbitControls.enabled && orbitControlsEnableAllowed) {
                    console.log('orbitControls enabled');
                    orbitControls.enabled = true;
                    orbitControls.update();
                }
                else {
                    orbitControls.update();
                }
            }
        }
        else if (currentState === states[2]) {
            if (!middleWheelIconAdded && mainNumber.generatingCubeDone) {
                middleWheelIcon.visible = true;

                middleWheelIconAdded = true;
                requestRenderIfNotRequested('Middle Wheel Icon Added');
            }
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

        if (!devMode && orbitControls.enabled && cameraCollisionDetectionEnabled) {
            cameraCollisionDetectionVector = new THREE.Vector3(camera.position.x - orbitControls.target.x,
                camera.position.y - orbitControls.target.y, camera.position.z - orbitControls.target.z);

            cameraRayCaster.far = cameraCollisionDetectionVector.length() + 2;

            cameraRayCaster.set(orbitControls.target, cameraCollisionDetectionVector.normalize());

            const cameraRayIntersects = cameraRayCaster.intersectObjects(environmentObjects, true);

            if (cameraRayIntersects.length > 0) {
                orbitControls.enableZoom = false;
                let newDistance = cameraRayIntersects[0].distance - 2.2;
                if (newDistance > 2) {
                    orbitControls.maxDistance = newDistance;
                    // updateUIIconGroup();
                }
                else {
                    orbitControls.reset();
                    orbitControls.minDistance = currentState === states[1] ? cameraOffset / 2 : cameraOffset;
                    camera.position.set(savedCamPos.x, savedCamPos.y, savedCamPos.z);
                }
            }
            else {
                orbitControls.maxDistance = 200;
                orbitControls.enableZoom = true;
                orbitControls.minDistance = 0;
            }
        }
    }

    // Camera animation
    if (cameraAnimation) {

        if (!initialCameraAnimationDone) {
            let newTargetCamPosition = new THREE.Vector3(targetCamPosition.x, targetCamPosition.y - 0.11, targetCamPosition.z - 0.11);
            camera.position.lerp(newTargetCamPosition, 0.015);
            camera.quaternion.slerp(targetCamOrientation, 0.02);
            if (new THREE.Vector3(newTargetCamPosition.x - camera.position.x, newTargetCamPosition.y - camera.position.y, newTargetCamPosition.z - camera.position.z).lengthSq() < 0.04) {
                cameraAnimation = false;
                cameraAnimationTime = 0;
                clockForCamera.stop();

                scene.add(UIInstructionMesh6);
                initialCameraAnimationDone = true;

                addUIIconGroup();

                addLoadingOverlay();
            }
        }
        else {
            camera.position.lerpVectors(startCamPosition, targetCamPosition, cameraAnimationTime / cameraAnimationDuration);
            camera.quaternion.slerpQuaternions(startCamOrientation, targetCamOrientation, cameraAnimationTime / cameraAnimationDuration);

            cameraAnimationTime += clockForCamera.getDelta();
        }

        // console.log(camera.quaternion.dot(targetCamOrientation))

        // room 1 to 2
        if (currentState === states[2]) {
            ceilingLight0.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
            ceilingLight1.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
            ceilingLight2.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
            ceilingLight3.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
        }
        // room 2 to 1
        else if (currentState === states[1]) {
            if (goingBackEnabled) {
                ceilingLight0.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight1.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight2.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight3.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
            }
        }
        // room 2 to 3
        else if (currentState === states[4]) {
            if (ceilingLightsOnEnabled) {
                ceilingLight0.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight1.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight2.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight3.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
            }
            else if (ceilingLightsOffEnabled) {
                ceilingLight0.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight1.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight2.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                ceilingLight3.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
            }
        }
        // room 3 to 4
        else if (currentState === states[6]) {
            if (ceilingLightsOnEnabled) {
                ceilingLight3.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
            }
            else if (ceilingLightsOffEnabled) {
                ceilingLight3.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
            }
        }
        // room 4 to 5
        else if (currentState === states[8]) {
            if (ceilingLightsOnEnabled) {
                if (currentCamPosIndex === desiredCamPositions4To5.length - 2) {
                    // if (ambientLight.intensity < 0.7) ambientLight.intensity += 0.01;
                    ceilingLight0.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight1.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight2.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight3.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                }
                else {
                    ceilingLight0.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight1.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight2.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight3.color.lerpColors(new THREE.Color(0x000000), new THREE.Color(0xFFFFFF), cameraAnimationTime / cameraAnimationDuration);
                }
            }
            else if (ceilingLightsOffEnabled) {
                if (currentCamPosIndex === desiredCamPositions4To5.length - 3) {
                    // if (ambientLight.intensity > 0) ambientLight.intensity -= 0.01;
                    ceilingLight0.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight1.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight2.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight3.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                }
                else {
                    ceilingLight0.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight1.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight2.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                    ceilingLight3.color.lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0x000000), cameraAnimationTime / cameraAnimationDuration);
                }
            }
        }

        if (initialCameraAnimationDone && (cameraAnimationTime >= cameraAnimationDuration)) {

            camera.position.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
            camera.quaternion.set(targetCamOrientation.x, targetCamOrientation.y, targetCamOrientation.z, targetCamOrientation.w);

            cameraAnimation = false;
            cameraAnimationTime = 0;
            clockForCamera.stop();

            if (currentState === states[2]) {

                ceilingLight0.intensity = 0;
                ceilingLight1.intensity = 0;
                ceilingLight2.intensity = 0;
                ceilingLight3.intensity = 0;
                ceilingLight0.castShadow = false;
                ceilingLight1.castShadow = false;
                ceilingLight2.castShadow = false;
                ceilingLight3.castShadow = false;

                wheelMovementEnabled = true;

                if (currentCamPosIndex === desiredCamPositions1To2.length - 1) {

                    cameraAnimation = true;
                    currentState = states[3];
                    wheelMovementEnabled = false;

                }
                else if (currentCamPosIndex === 0 && goingBackEnabled) {
                    cameraAnimation = true;
                    currentState = states[1];
                    wheelMovementEnabled = false;

                    ceilingLight0.intensity = 40;
                    ceilingLight1.intensity = 40;
                    ceilingLight2.intensity = 40;
                    ceilingLight3.intensity = 40;
                    ceilingLight0.castShadow = true;
                    ceilingLight1.castShadow = true;
                    ceilingLight2.castShadow = true;
                    ceilingLight3.castShadow = true;
                }
            }
            else if (currentState === states[1]) {
                if (goingBackEnabled) {
                    leftClickIcon.visible = true;
                    rightClickIcon.visible = true;
                    middleWheelIcon.visible = true;

                    loadUI();
                    orbitControls.target = new THREE.Vector3(mainNumber.getNumberMeshPos().x + room1TargetOffset, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z + cameraOffset / 2);

                    orbitControls.saveState();
                    savedCamPos.set(targetCamPosition.x, targetCamPosition.y, targetCamPosition.z);
                    console.log("Camera control state saved");

                    goingBackEnabled = false;
                }
            }
            else if (currentState === states[3]) {

                leftClickIcon.visible = true;
                rightClickIcon.visible = true;
                middleWheelIcon.visible = true;

                confirmButton.position.set(roomPositions[1].x - 11, roomPositions[1].y, roomPositions[1].z - 19);
                tickMesh.position.set(roomPositions[1].x - 11, roomPositions[1].y, roomPositions[1].z - 19);
                scene.add(confirmButton);
                scene.add(tickMesh);

                cancelButton.position.set(roomPositions[1].x - 9, roomPositions[1].y, roomPositions[1].z - 19);
                crossMesh.position.set(roomPositions[1].x - 9, roomPositions[1].y, roomPositions[1].z - 19);
                scene.add(cancelButton);
                scene.add(crossMesh);

                activeButtons.push(confirmButton, cancelButton);

                if (goingBackEnabled) {
                    goingBackEnabled = false;
                }
            }
            else if (currentState === states[4]) {

                leftClickIcon.visible = false;
                rightClickIcon.visible = false;
                middleWheelIcon.visible = true;

                wheelMovementEnabled = true;

                if (currentCamPosIndex === desiredCamPositions2To3.length - 1) {
                    cameraAnimation = true;
                    currentState = states[5];
                    wheelMovementEnabled = false;
                }
                else if (currentCamPosIndex === 0 && goingBackEnabled) {
                    cameraAnimation = true;
                    currentState = states[3];
                    wheelMovementEnabled = false;
                    goingBackEnabled = false;
                }
                else if (currentCamPosIndex === 2) {
                    if (ceilingLightsOffEnabled) {
                        ceilingLight0.intensity = 0;
                        ceilingLight1.intensity = 0;
                        ceilingLight2.intensity = 0;
                        ceilingLight3.intensity = 0;
                        ceilingLight0.castShadow = false;
                        ceilingLight1.castShadow = false;
                        ceilingLight2.castShadow = false;
                        ceilingLight3.castShadow = false;

                        ceilingLightsOffEnabled = false;
                    }
                }
                else if (currentCamPosIndex === 3) {
                    ceilingLightsOnEnabled = false;
                }
                else if (currentCamPosIndex === desiredCamPositions2To3.length - 2) {
                    if (ceilingLightsOffEnabled) {
                        ceilingLight0.intensity = 0;
                        ceilingLight1.intensity = 0;
                        ceilingLight2.intensity = 0;
                        ceilingLight3.intensity = 0;
                        ceilingLight0.castShadow = false;
                        ceilingLight1.castShadow = false;
                        ceilingLight2.castShadow = false;
                        ceilingLight3.castShadow = false;

                        ceilingLightsOffEnabled = false;
                    }
                }
                else if (currentCamPosIndex === desiredCamPositions2To3.length - 3) {
                    ceilingLightsOnEnabled = false;
                }
            }
            else if (currentState === states[5]) {

                orbitControlsEnableAllowed = false;
                initImageHolder();

                confirmButton.position.set(roomPositions[2].x + 9, roomPositions[2].y, roomPositions[2].z - 19);
                tickMesh.position.set(roomPositions[2].x + 9, roomPositions[2].y, roomPositions[2].z - 19);
                scene.add(confirmButton);
                scene.add(tickMesh);

                cancelButton.position.set(roomPositions[2].x + 11, roomPositions[2].y, roomPositions[2].z - 19);
                crossMesh.position.set(roomPositions[2].x + 11, roomPositions[2].y, roomPositions[2].z - 19);
                scene.add(cancelButton);
                scene.add(crossMesh);

                activeButtons.push(confirmButton, cancelButton);

                if (goingBackEnabled) {
                    goingBackEnabled = false;
                }
            }
            else if (currentState === states[6]) {

                leftClickIcon.visible = false;
                rightClickIcon.visible = false;
                middleWheelIcon.visible = true;

                wheelMovementEnabled = true;

                if (currentCamPosIndex === desiredCamPositions3To4.length - 1) {
                    cameraAnimation = true;
                    currentState = states[7];
                }
                else if (currentCamPosIndex === 0 && goingBackEnabled) {
                    cameraAnimation = true;
                    currentState = states[5];
                    wheelMovementEnabled = false;
                    goingBackEnabled = false;
                }
                // else if (currentCamPosIndex === 2) {
                //     if (ceilingLightsOffEnabled) {
                //         ceilingLight3.intensity = 0;
                //         ceilingLight3.castShadow = false;

                //         ceilingLightsOffEnabled = false;
                //     }
                // }
                // else if (currentCamPosIndex === 3) {
                //     ceilingLightsOnEnabled = false;
                // }
                else if (currentCamPosIndex === desiredCamPositions3To4.length - 3) {
                    if (ceilingLightsOffEnabled) {
                        ceilingLight3.intensity = 0;
                        ceilingLight3.castShadow = false;

                        ceilingLightsOffEnabled = false;
                    }
                }
                else if (currentCamPosIndex === desiredCamPositions3To4.length - 2) {
                    ceilingLightsOnEnabled = false;
                }
            }
            else if (currentState === states[7]) {

                if (goingBackEnabled) {
                    goingBackEnabled = false;
                }

                if (stlFileGenerated) {
                    leftClickIcon.visible = true;
                    rightClickIcon.visible = true;
                    middleWheelIcon.visible = true;

                    confirmButton.position.set(roomPositions[3].x, 1, roomPositions[3].z - 8.577);
                    confirmButton.setRotationFromEuler(new THREE.Euler(degreesToRadians(30), degreesToRadians(180), 0, 'XYZ'));
                    tickMesh.position.set(roomPositions[3].x, 1, roomPositions[3].z - 8.577);
                    tickMesh.setRotationFromEuler(new THREE.Euler(degreesToRadians(30), degreesToRadians(180), 0, 'XYZ'));
                    scene.add(confirmButton);
                    scene.add(tickMesh);

                    activeButtons.push(confirmButton);
                }
                else {
                    releaseInstancedMeshMemeory();

                    loadingOverlay.visible = true;
                    requestRenderIfNotRequested("loadingOverlay visible");

                    Promise.all([generateMergedFinalGeometry()]).then(results => {

                        loadingBarElement1.classList.add('ended');
                        loadingBarElement1.style.transform = '';
                        document.body.removeChild(loadingText);
                        loadingOverlay.visible = false;

                        finalInstancedMesh.material = materialPrintedCube.clone();
                        finalInstancedMeshCube.material = materialEmpty.clone();

                        leftClickIcon.visible = true;
                        rightClickIcon.visible = true;
                        middleWheelIcon.visible = true;

                        confirmButton.position.set(roomPositions[3].x, 1, roomPositions[3].z - 8.577);
                        confirmButton.setRotationFromEuler(new THREE.Euler(degreesToRadians(30), degreesToRadians(180), 0, 'XYZ'));
                        tickMesh.position.set(roomPositions[3].x, 1, roomPositions[3].z - 8.577);
                        tickMesh.setRotationFromEuler(new THREE.Euler(degreesToRadians(30), degreesToRadians(180), 0, 'XYZ'));
                        scene.add(confirmButton);
                        scene.add(tickMesh);

                        activeButtons.push(confirmButton);

                        wheelMovementEnabled = false;

                        stlFileGenerated = true;
                        requestRenderIfNotRequested("generateMergedFinalGeometry done");
                    });
                }
            }
            else if (currentState === states[8]) {

                middleWheelIcon.visible = true;
                wheelMovementEnabled = true;

                if (currentCamPosIndex === desiredCamPositions4To5.length - 1) {
                    cameraAnimation = true;
                    currentState = states[9];
                    wheelMovementEnabled = false;
                }
                else if (currentCamPosIndex === 0 && goingBackEnabled) {
                    cameraAnimation = true;
                    currentState = states[7];
                    wheelMovementEnabled = false;
                }
                else if (currentCamPosIndex === desiredCamPositions4To5.length - 3 || currentCamPosIndex === 4 || currentCamPosIndex === 2) {
                    // ambientLight.intensity = 0.7;
                    ceilingLightsOnEnabled = false;
                }
                else if (currentCamPosIndex === 3) {
                    if (ceilingLightsOffEnabled) {
                        ceilingLight0.intensity = 0;
                        ceilingLight1.intensity = 0;
                        ceilingLight2.intensity = 0;
                        ceilingLight3.intensity = 0;
                        ceilingLight0.castShadow = false;
                        ceilingLight1.castShadow = false;
                        ceilingLight2.castShadow = false;
                        ceilingLight3.castShadow = false;

                        ceilingLightsOffEnabled = false;
                    }
                }
                else if (currentCamPosIndex === desiredCamPositions4To5.length - 2) {
                    if (ceilingLightsOffEnabled) {
                        // ambientLight.intensity = 0.3;
                        ceilingLight0.intensity = 0;
                        ceilingLight1.intensity = 0;
                        ceilingLight2.intensity = 0;
                        ceilingLight3.intensity = 0;
                        ceilingLight0.castShadow = false;
                        ceilingLight1.castShadow = false;
                        ceilingLight2.castShadow = false;
                        ceilingLight3.castShadow = false;

                        ceilingLightsOffEnabled = false;
                    }
                }
            }
            else if (currentState === states[9]) {

                addGUI();

                materialAnimation = true;
                clockForShader.start();

                leftClickIcon.visible = true;
                rightClickIcon.visible = true;
                middleWheelIcon.visible = true;

                leftClickIcon.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.visible = true;
                    }
                });

                rightClickIcon.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.visible = true;
                    }
                });

                middleWheelIcon.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.visible = true;
                    }
                });
            }
        }

        // updateUIIconGroup();
        requestRenderIfNotRequested('cameraAnimation');
    }

    // Icon animation
    if (iconAnimation) {
        orbitControls.enabled = false;

        //targetLeftClickIconPos = new THREE.Vector3(sizes.width / 2 * iconScalar, sizes.height / 2 * iconScalar, 0);
        leftClickIcon.scale.lerp(targetIconAnimScale, 0.02);
        //leftClickIcon.position.lerp(targetLeftClickIconPos, 0.01);
        for (let i = 0; i < leftClickIcon.children.length; i++) {
            leftClickIcon.children[i].translateX(-0.004 / iconScalar);
            leftClickIcon.children[i].translateY(0.0068 / iconScalar);
        }
        middleWheelIcon.scale.lerp(targetIconAnimScale, 0.02);
        for (let i = 0; i < middleWheelIcon.children.length; i++) {
            middleWheelIcon.children[i].translateX(-0.002 / iconScalar);
            middleWheelIcon.children[i].translateY(0.0058 / iconScalar);
        }
        rightClickIcon.scale.lerp(targetIconAnimScale, 0.02);
        for (let i = 0; i < rightClickIcon.children.length; i++) {
            rightClickIcon.children[i].translateX(0 / iconScalar);
            rightClickIcon.children[i].translateY(0.0048 / iconScalar);
        }

        iconAnimCounter++;
        if (iconAnimCounter >= 130) {

            iconAnimation = false;
            onClickPhase2 = true;
            iconAnimationDone = true;

            scene.remove(UIInstructionMesh4);
            scene.remove(UIInstructionMesh5);
            scene.add(UIInstructionMesh7);

            for (let i = 0; i < leftClickIcon.children.length; i++) {
                if (i === leftClickIcon.children.length - 1 ||
                    i === leftClickIcon.children.length - 2 ||
                    i === leftClickIcon.children.length - 3) {
                    leftClickIcon.children[i].material.opacity *= 0.5;
                }
                else {
                    leftClickIcon.children[i].material.opacity *= 0.7;
                }
            }
            for (let i = 0; i < middleWheelIcon.children.length; i++) {
                if (i === middleWheelIcon.children.length - 3 ||
                    i === middleWheelIcon.children.length - 4) {
                    middleWheelIcon.children[i].material.opacity *= 0.5;
                }
                else {
                    middleWheelIcon.children[i].material.opacity *= 0.7;
                }
            }
            for (let i = 0; i < rightClickIcon.children.length; i++) {
                if (i === rightClickIcon.children.length - 1 ||
                    i === rightClickIcon.children.length - 2 ||
                    i === rightClickIcon.children.length - 3 ||
                    i === rightClickIcon.children.length - 4) {
                    rightClickIcon.children[i].material.opacity *= 0.5;
                }
                else {
                    rightClickIcon.children[i].material.opacity *= 0.7;
                }
            }
        }
        requestRenderIfNotRequested('iconAnimation');
    }

    // Material animation
    if (materialAnimation) {
        const elapsedTime = clockForShader.getElapsedTime();
        noiseMaterial.uniforms.uTime.value = elapsedTime;

        requestRenderIfNotRequested('materialAnimation');
    }

    // Debug
    stats.update();

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
    //console.log(caller);
    // }

    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
    }
}

let initUIText3 = document.createElement('p');
initUIText3.innerHTML = 'For a smoother experience, you may prepare a personally meaningful picture/image/drawing related to your number before getting started. (preferably with high contrast)';
initUIText3.style.fontFamily = 'verdana';
initUIText3.style.fontSize = '120%';
initUIText3.style.color = '#ffffff';
initUIText3.style.textAlign = 'center';
initUIText3.style.width = '40%';
initUIText3.style.top = '25%';
initUIText3.style.left = '30%';
initUIText3.style.position = 'absolute';
initUIText3.style.lineHeight = '120%';

let initUIText0 = document.createElement('p');
initUIText0.innerHTML = 'Please input your number from the auction:';
initUIText0.style.fontFamily = 'verdana';
initUIText0.style.fontSize = '100%';
initUIText0.style.color = '#ffffff';
initUIText0.style.textAlign = 'center';
initUIText0.style.width = '50%';
initUIText0.style.top = '45%';
initUIText0.style.left = '25%';
initUIText0.style.position = 'absolute';

let numberInputField = document.createElement("input");
numberInputField.setAttribute('type', 'text');
numberInputField.style.width = '14%';
numberInputField.style.top = '49%';
numberInputField.style.left = '43%';
numberInputField.style.position = 'absolute';
numberInputField.style.textAlign = 'center';

let initUIText1 = document.createElement('p');
initUIText1.innerHTML = 'Please select the quality based on your device\'s computing power:';
initUIText1.style.fontFamily = 'verdana';
initUIText1.style.fontSize = '100%';
initUIText1.style.color = '#ffffff';
initUIText1.style.textAlign = 'center';
initUIText1.style.width = '50%';
initUIText1.style.top = '55%';
initUIText1.style.left = '25%';
initUIText1.style.position = 'absolute';

let qualitySelectorSlider = document.getElementById("qualitySelector");
qualitySelectorSlider.oninput = function () {
    if (this.value == 1) {
        initUIText2.innerHTML = 'Low';
        mainNumberOptions.qualityScalar = 0.625;
        renderQuality = 0;
        shadowMapSizeScalar = 0.5;
    }
    else if (this.value == 2) {
        initUIText2.innerHTML = 'Medium';
        mainNumberOptions.qualityScalar = 0.78125;
        renderQuality = 1;
        shadowMapSizeScalar = 0.75;
    }
    else if (this.value == 3) {
        initUIText2.innerHTML = 'High';
        mainNumberOptions.qualityScalar = 1;
        renderQuality = 2;
        shadowMapSizeScalar = 1;
    }
}

let initUIText2 = document.createElement('p');
initUIText2.innerHTML = 'High';
initUIText2.style.fontFamily = 'verdana';
initUIText2.style.fontSize = '100%';
initUIText2.style.color = '#ffffff';
initUIText2.style.textAlign = 'center';
initUIText2.style.width = '50%';
initUIText2.style.top = '62%';
initUIText2.style.left = '25%';
initUIText2.style.position = 'absolute';

let buttonHolder = document.createElement("div");
buttonHolder.style.width = '100%';
buttonHolder.style.height = '30%';
buttonHolder.style.margin = 'auto';
buttonHolder.style.textAlign = 'center';
buttonHolder.style.bottom = '0';
buttonHolder.style.position = 'absolute';

let startButton = document.createElement("button");
startButton.innerHTML = "START";
startButton.style.textAlign = 'center';
startButton.style.margin = 'auto';
// startButton.style.marginTop = '50%';
// startButton.style.marginBottom = '50%';
// startButton.style.marginLeft = 'auto';
// startButton.style.marginRight = 'auto';

startButton.style.borderRadius = '8px';
startButton.style.padding = '8px 12px';
startButton.style.color = 'black';
startButton.style.backgroundColor = '#e7e7e7';
startButton.style.fontSize = '100%';

startButton.addEventListener("click", function () {

    if (isNaN(parseFloat(numberInputField.value))) {
        alert("Please input a valid number");
    }
    else {
        mainNumberOptions.numberValue = parseFloat(numberInputField.value);

        init();

        tick();
    }
});

document.body.appendChild(initUIText0);
document.body.appendChild(initUIText1);
document.body.appendChild(initUIText2);
document.body.appendChild(initUIText3);
document.body.appendChild(numberInputField);
buttonHolder.appendChild(startButton);
document.body.appendChild(buttonHolder);


/**
 * Event Handlers (Controller)
 */

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);
window.addEventListener('wheel', onZoom, false);

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {

    if (initialCameraAnimationDone) {
        if (onClickPhase1 && !cameraAnimation) {
            iconAnimation = true;

            onClickPhase1 = false;
        }
        else if (onClickPhase2) {
            scene.remove(UIInstructionMesh7);
            scene.add(mainNumber.currentMesh);

            spotLight0.target = largeFrame;
            // scene.add(spotLight0);
            // scene.add(spotLightEffect);
            spotLight0.intensity = 40;
            spotLight0.castShadow = true;
            spotLightEffect.intensity = 10;
            spotLightEffect.castShadow = true;

            requestRenderIfNotRequested('mainNumber added');

            onClickPhase2 = false;
            onClickPhase3 = true;
        }
        else if (onClickPhase3) {
            scene.remove(UIInstructionMesh6);
            loadUI();

            onClickPhase3 = false;
        }

        if (confirmButton.material === materialSelected) {
            if (currentState === states[1]) {
                if (UIMenuExpanded[0]) collapseUIMenu(0);
                if (UIMenuExpanded[1]) collapseUIMenu(1);
                removeUI();
                confirmButton.material = materialUnselected;

                currentState = states[2];

                currentCamPosIndex = 0;
            }
            else if (currentState === states[3]) {
                scene.remove(confirmButton);
                scene.remove(cancelButton);
                confirmButton.material = materialUnselected;
                cancelButton.material = materialUnselected;
                scene.remove(tickMesh);
                scene.remove(crossMesh);
                activeButtons.length = 0;

                currentState = states[4];

                wheelMovementEnabled = false;
                currentCamPosIndex = 0;
                goingBackEnabled = false;
            }
            else if (currentState === states[5] && imageSideGenerated) {
                scene.remove(confirmButton);
                scene.remove(cancelButton);
                confirmButton.material = materialUnselected;
                cancelButton.material = materialUnselected;
                scene.remove(tickMesh);
                scene.remove(crossMesh);
                activeButtons.length = 0;

                currentState = states[6];

                wheelMovementEnabled = false;
                currentCamPosIndex = 0;
                goingBackEnabled = false;
            }
            else if (currentState === states[7]) {
                scene.remove(confirmButton);
                confirmButton.material = materialUnselected;
                scene.remove(tickMesh);
                activeButtons.length = 0;

                leftClickIcon.visible = false;
                rightClickIcon.visible = false;
                middleWheelIcon.visible = false;

                // Ascii
                // const result = stlExporter.parse(mergedFinalMesh);
                // saveFile(new Blob([result], { type: 'text/plain' }), '3D_Print.stl');

                // Binary
                const result = stlExporter.parse(mergedFinalMesh, { binary: true });
                saveFile(new Blob([result], { type: 'application/octet-stream' }), '3D_Print.stl');

                currentState = states[8];

                wheelMovementEnabled = false;
                currentCamPosIndex = 0;
                goingBackEnabled = false;
            }
        }
        else if (cancelButton.material === materialSelected) {
            if (currentState === states[3]) {
                scene.remove(confirmButton);
                scene.remove(cancelButton);
                confirmButton.material = materialUnselected;
                cancelButton.material = materialUnselected;
                scene.remove(tickMesh);
                scene.remove(crossMesh);
                activeButtons.length = 0;

                currentState = states[2];

                currentCamPosIndex = desiredCamPositions1To2.length - 2;
                goingBackEnabled = true;
            }
            else if (currentState === states[5] && imageSideGenerated) {
                scene.remove(confirmButton);
                scene.remove(cancelButton);
                confirmButton.material = materialUnselected;
                cancelButton.material = materialUnselected;
                scene.remove(tickMesh);
                scene.remove(crossMesh);
                activeButtons.length = 0;

                scene.remove(finalInstancedMesh);
                imageSideGenerated = false;

                scene.add(mainNumber.instancedMesh);

                wheelMovementEnabled = false;

                orbitControls.target = mainNumber.getNumberMeshPos();

                leftClickIcon.visible = false;
                rightClickIcon.visible = false;
                middleWheelIcon.visible = false;

                // spotlightTargetObject.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);
                // groundSpotLight1.target = spotlightTargetObject;
                // groundSpotLight2.target = spotlightTargetObject;
                // mainNumber.instancedMesh.position.set(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z);
                // mainNumber.instancedMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'));
                // mainNumber.instancedMesh.castShadow = true;
                // scene.add(mainNumber.instancedMesh);

                groundSpotLight1.position.set(spotlightPositions[2].x - 2, roomPositions[2].y, spotlightPositions[2].z);
                groundLight1Effect.position.set(spotlightPositions[2].x - 2, roomPositions[2].y - 1, spotlightPositions[2].z);
                groundSpotLight1.intensity = 200;
                groundSpotLight1.castShadow = true;
                groundLight1Effect.intensity = 20;

                groundSpotLight2.intensity = 0;
                groundSpotLight2.castShadow = false;
                groundLight2Effect.intensity = 0;

                cameraAnimationDispatcher(
                    camera.position,
                    new THREE.Vector3(
                        mainNumber.getNumberMeshPos().x,
                        mainNumber.getNumberMeshPos().y,
                        mainNumber.getNumberMeshPos().z + mainNumber.getCubeSideLength() / 2 + cameraOffset),
                    camera.quaternion,
                    new THREE.Euler(0, degreesToRadians(0), 0, 'XYZ'), 1.5);
            }
        }
        else if (styleButton.material === materialSelected) {
            if (!UIMenuExpanded[0]) {
                if (UIMenuExpanded[1]) collapseUIMenu(1);
                expandUIMenu(0);
            }
            else {
                collapseUIMenu(0);
            }
        }
        else if (fontButton.material === materialSelected) {
            if (!UIMenuExpanded[1]) {
                if (UIMenuExpanded[0]) collapseUIMenu(0);
                expandUIMenu(1);
            }
            else {
                collapseUIMenu(1);
            }
        }
        else if (styleButton1.material === materialSelected) {
            confirmUIMenu(0, 0);
        }
        else if (styleButton2.material === materialSelected) {
            confirmUIMenu(0, 1);
        }
        else if (styleButton3.material === materialSelected) {
            confirmUIMenu(0, 2);
        }
        else if (styleButton4.material === materialSelected) {
            confirmUIMenu(0, 3);
        }
        else if (fontButton1.material === materialSelected) {
            confirmUIMenu(1, 0);
        }
        else if (fontButton2.material === materialSelected) {
            confirmUIMenu(1, 1);
        }
        else if (fontButton3.material === materialSelected) {
            confirmUIMenu(1, 2);
        }
        else if (fontButton4.material === materialSelected) {
            confirmUIMenu(1, 3);
        }
        else if (fontButton5.material === materialSelected) {
            confirmUIMenu(1, 4);
        }
        else if (fontButton6.material === materialSelected) {
            confirmUIMenu(1, 5);
        }
    }
}

function onZoom(event) {
    if (wheelMovementEnabled && mainNumber.generatingCubeDone) {
        if (currentState === states[2]) {
            if (event.deltaY < 0 && currentCamPosIndex < desiredCamPositions1To2.length - 1) {
                currentCamPosIndex += 1;
                goingBackEnabled = true;

                // scene.remove(spotLight0);
                // scene.remove(spotLightEffect);
                spotLight0.intensity = 0;
                spotLight0.castShadow = false;
                spotLightEffect.intensity = 0;
                spotLightEffect.castShadow = false;

                cameraAnimationDispatcher(camera.position, desiredCamPositions1To2[currentCamPosIndex], camera.quaternion, desiredCamOrientations1To2[currentCamPosIndex], 1);
                wheelMovementEnabled = false;

            }
            else if (event.deltaY > 0 && currentCamPosIndex > 0) {
                currentCamPosIndex -= 1;

                cameraAnimationDispatcher(camera.position, desiredCamPositions1To2[currentCamPosIndex], camera.quaternion, desiredCamOrientations1To2[currentCamPosIndex], 1);
                wheelMovementEnabled = false;
            }
        }
        else if (currentState === states[4]) {
            if (event.deltaY < 0 && currentCamPosIndex < desiredCamPositions2To3.length - 1) {
                if (currentCamPosIndex === 2) {
                    ceilingLight0.intensity = 40;
                    ceilingLight1.intensity = 40;
                    ceilingLight2.intensity = 40;
                    ceilingLight3.intensity = 40;
                    ceilingLight0.castShadow = true;
                    ceilingLight1.castShadow = true;
                    ceilingLight2.castShadow = true;
                    ceilingLight3.castShadow = true;

                    ceilingLightsOnEnabled = true;

                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z));
                    scene.remove(mainNumber.instancedMesh);
                }
                else if (currentCamPosIndex === desiredCamPositions2To3.length - 3) {
                    ceilingLightsOffEnabled = true;
                }

                currentCamPosIndex += 1;
                goingBackEnabled = true;
                wheelMovementEnabled = false;

                // scene.remove(groundSpotLight1);
                // scene.remove(groundLightEffect);
                groundSpotLight1.intensity = 0;
                groundSpotLight1.castShadow = false;
                groundLight1Effect.intensity = 0;

                mainNumber.instancedMesh.castShadow = false;

                if (currentCamPosIndex <= 2) {
                    cameraAnimationDispatcher(camera.position, desiredCamPositions2To3[currentCamPosIndex], camera.quaternion, desiredCamOrientations2To3[currentCamPosIndex], 1.4);
                }
                else {
                    cameraAnimationDispatcher(camera.position, desiredCamPositions2To3[currentCamPosIndex], camera.quaternion, desiredCamOrientations2To3[currentCamPosIndex], 1);
                }
            }
            else if (event.deltaY > 0 && currentCamPosIndex > 0) {
                if (currentCamPosIndex === 2) {
                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[1].x, roomPositions[1].y, roomPositions[1].z));
                    scene.add(mainNumber.instancedMesh);
                }
                else if (currentCamPosIndex === 3) {
                    ceilingLightsOffEnabled = true;
                }
                else if (currentCamPosIndex === desiredCamPositions2To3.length - 2) {
                    ceilingLight0.intensity = 40;
                    ceilingLight1.intensity = 40;
                    ceilingLight2.intensity = 40;
                    ceilingLight3.intensity = 40;
                    ceilingLight0.castShadow = true;
                    ceilingLight1.castShadow = true;
                    ceilingLight2.castShadow = true;
                    ceilingLight3.castShadow = true;

                    ceilingLightsOnEnabled = true;
                }

                currentCamPosIndex -= 1;
                if (currentCamPosIndex <= 1) {
                    cameraAnimationDispatcher(camera.position, desiredCamPositions2To3[currentCamPosIndex], camera.quaternion, desiredCamOrientations2To3[currentCamPosIndex], 1.4);
                }
                else {
                    cameraAnimationDispatcher(camera.position, desiredCamPositions2To3[currentCamPosIndex], camera.quaternion, desiredCamOrientations2To3[currentCamPosIndex], 1);
                }
                wheelMovementEnabled = false;
            }
        }
        else if (currentState === states[6]) {
            if (event.deltaY < 0 && currentCamPosIndex < desiredCamPositions3To4.length - 1) {
                if (currentCamPosIndex === 2) {

                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[3].x, 2 + mainNumber.getCubeSideLength() / 2, roomPositions[3].z));
                    //scene.remove(finalInstancedMesh);
                    finalInstancedMesh.material = materialEmpty.clone();
                    finalInstancedMesh.position.set(roomPositions[3].x, 2 + mainNumber.getCubeSideLength() / 2, roomPositions[3].z);
                    finalInstancedMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ'));
                    finalInstancedMesh.castShadow = false;

                    finalInstancedMeshCube = new THREE.Mesh(new THREE.BoxGeometry(mainNumber.getCubeSideLength(), mainNumber.getCubeSideLength(), mainNumber.getCubeSideLength()), materialPrintedCube.clone());
                    finalInstancedMeshCube.position.set(finalInstancedMesh.position.x, finalInstancedMesh.position.y, finalInstancedMesh.position.z);
                    finalInstancedMeshCube.castShadow = true;
                    scene.add(finalInstancedMeshCube);

                    platformMesh.position.set(roomPositions[3].x, 1, roomPositions[3].z);
                    environmentObjects.push(platformMesh);
                    platformMesh.castShadow = true;
                    platformMesh.receiveShadow = true;
                    scene.add(platformMesh);

                    rampMesh.position.set(roomPositions[3].x, 0, roomPositions[3].z - 8);
                    rampMesh.setRotationFromEuler(new THREE.Euler(degreesToRadians(-90), degreesToRadians(0), degreesToRadians(90), 'XYZ'));
                    environmentObjects.push(rampMesh);
                    rampMesh.castShadow = true;
                    scene.add(rampMesh);
                }
                else if (currentCamPosIndex === desiredCamPositions3To4.length - 3) {
                    ceilingLight3.intensity = 40;
                    ceilingLight3.castShadow = true;

                    ceilingLightsOnEnabled = true;
                }
                // else if (currentCamPosIndex === desiredCamPositions3To4.length - 3) {
                //     ceilingLightsOffEnabled = true;
                // }

                currentCamPosIndex += 1;
                goingBackEnabled = true;
                wheelMovementEnabled = false;

                // scene.remove(groundSpotLight1);
                // scene.remove(groundLightEffect);
                groundSpotLight1.intensity = 0;
                groundSpotLight1.castShadow = false;
                groundLight1Effect.intensity = 0;
                groundSpotLight2.intensity = 0;
                groundSpotLight2.castShadow = false;
                groundLight2Effect.intensity = 0;

                mainNumber.instancedMesh.castShadow = false;

                cameraAnimationDispatcher(camera.position, desiredCamPositions3To4[currentCamPosIndex], camera.quaternion, desiredCamOrientations3To4[currentCamPosIndex], 1.2);
            }
            else if (event.deltaY > 0 && currentCamPosIndex > 0) {
                if (currentCamPosIndex === 2) {
                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z));
                    finalInstancedMesh.material = materialCube.clone();
                    finalInstancedMesh.position.set(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z);
                    finalInstancedMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'));
                    finalInstancedMesh.castShadow = true;
                }
                else if (currentCamPosIndex === desiredCamPositions3To4.length - 2) {
                    ceilingLightsOffEnabled = true;
                }
                // if (currentCamPosIndex === 3) {
                //     ceilingLightsOffEnabled = true;
                // }
                // else if (currentCamPosIndex === desiredCamPositions3To4.length - 2) {
                //     ceilingLight3.intensity = 40;
                //     ceilingLight3.castShadow = true;

                //     ceilingLightsOnEnabled = true;
                // }

                currentCamPosIndex -= 1;

                cameraAnimationDispatcher(camera.position, desiredCamPositions3To4[currentCamPosIndex], camera.quaternion, desiredCamOrientations3To4[currentCamPosIndex], 1.2);

                wheelMovementEnabled = false;
            }
        }
        else if (currentState === states[8]) {
            if (event.deltaY < 0 && currentCamPosIndex < desiredCamPositions4To5.length - 1) {
                if (currentCamPosIndex === 2) {
                    ceilingLightsOffEnabled = true;

                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[4].x, roomPositions[4].y, roomPositions[4].z));
                }
                else if (currentCamPosIndex === 3) {
                    ceilingLight1.intensity = 40;
                    ceilingLight1.castShadow = true;

                    ceilingLightsOnEnabled = true;
                }
                else if (currentCamPosIndex === desiredCamPositions4To5.length - 3) {
                    releaseSTLMemory();
                    generateVirtualArtifact();

                    ceilingLightsOffEnabled = true;
                }

                currentCamPosIndex += 1;
                goingBackEnabled = true;
                wheelMovementEnabled = false;

                // scene.remove(groundSpotLight1);
                // scene.remove(groundLightEffect);
                groundSpotLight1.intensity = 0;
                groundSpotLight1.castShadow = false;
                groundLight1Effect.intensity = 0;
                groundSpotLight2.intensity = 0;
                groundSpotLight2.castShadow = false;
                groundLight2Effect.intensity = 0;

                cameraAnimationDispatcher(camera.position, desiredCamPositions4To5[currentCamPosIndex], camera.quaternion, desiredCamOrientations4To5[currentCamPosIndex], 1.5);
                // mainNumber.instancedMesh.castShadow = false;
            }
            else if (event.deltaY > 0 && currentCamPosIndex > 0) {
                if (currentCamPosIndex === 3) {
                    ceilingLight3.intensity = 40;
                    ceilingLight3.castShadow = true;

                    ceilingLightsOnEnabled = true;

                    mainNumber.updateNumberMeshPos(scene, new THREE.Vector3(roomPositions[3].x, 2 + mainNumber.getCubeSideLength() / 2, roomPositions[3].z));

                }
                else if (currentCamPosIndex === 4) {
                    ceilingLightsOffEnabled = true;
                }
                else if (currentCamPosIndex === desiredCamPositions4To5.length - 2) {
                    ceilingLight1.intensity = 40;
                    ceilingLight1.castShadow = true;

                    ceilingLightsOnEnabled = true;

                }

                currentCamPosIndex -= 1;

                cameraAnimationDispatcher(camera.position, desiredCamPositions4To5[currentCamPosIndex], camera.quaternion, desiredCamOrientations4To5[currentCamPosIndex], 1.5);

                wheelMovementEnabled = false;
            }
        }
    }
}


/**
 * Utility Functions
 */

function cameraAnimationDispatcher(startPos, targetPos, startOrientation, targetOrientation, duration) {
    renderer.compile(scene, camera);

    cameraAnimationDuration = duration;
    startCamPosition.copy(startPos);
    startCamOrientation.copy(startOrientation);

    targetCamPosition.copy(targetPos);
    targetCamOrientation.setFromEuler(targetOrientation);
    orbitControls.enabled = false;

    cameraAnimation = true;
    clockForCamera.start();
}

function initUI() {
    return new Promise(resolve => {
        fontLoader.load('/fonts/Avenir Black_Regular.json', function (font) {
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
            UIInstructionMesh1 = new THREE.Mesh(UITitleGeometry1, materialUI);
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
            UIInstructionMesh2 = new THREE.Mesh(UITitleGeometry2, materialUI);
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
            UIInstructionMesh3 = new THREE.Mesh(UITitleGeometry3, materialUI);
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
            UIInstructionMesh4 = new THREE.Mesh(UITitleGeometry4, materialUI);
            UIInstructionMesh4.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y + 0.8, mainNumber.getNumberMeshPos().z);
            scene.add(UIInstructionMesh4);

            UITitleGeometry5 = new THREE.TextGeometry('Art Value Experience!', {
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
            UIInstructionMesh5 = new THREE.Mesh(UITitleGeometry5, materialUI);
            UIInstructionMesh5.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y - 0.8, mainNumber.getNumberMeshPos().z);
            scene.add(UIInstructionMesh5);

            UITitleGeometry7 = new THREE.TextGeometry('Here\'s your number', {
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
            UITitleGeometry7.center();
            UIInstructionMesh7 = new THREE.Mesh(UITitleGeometry7, materialUI);
            UIInstructionMesh7.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);

            tickGeometry = new THREE.TextGeometry('√', {
                font: font,
                size: 0.6,
                height: 0.45,
                curveSegments: 24,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            tickGeometry.center();
            tickMesh = new THREE.Mesh(tickGeometry, materialUI);
            tickMesh.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2, mainNumber.getNumberMeshPos().z);
            //scene.add(tickMesh);

            crossGeometry = new THREE.TextGeometry('X', {
                font: font,
                size: 0.6,
                height: 0.45,
                curveSegments: 24,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            crossGeometry.center();
            crossMesh = new THREE.Mesh(crossGeometry, materialUI);

            fontLoader.load('/fonts/Avenir Book_Regular.json', function (font) {
                fontAvenirBook = font;
                UIContentGeometry1 = new THREE.TextGeometry(mainNumberOptions.numberStyle, {
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
                styleTextMesh = new THREE.Mesh(UIContentGeometry1, materialUI);
                styleTextMesh.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y + 0.9, mainNumber.getNumberMeshPos().z + 0.1);

                for (let n = 0; n < styleOptions.length; n++) {
                    UIContentGeometry1 = new THREE.TextGeometry(styleOptions[n], {
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

                    styleTextMeshes.push(new THREE.Mesh(UIContentGeometry1, materialUI));
                    styleTextMeshes[n].position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y + 0.9, mainNumber.getNumberMeshPos().z + 0.1);
                }

                UIContentGeometry2 = new THREE.TextGeometry(mainNumberOptions.numberFont, {
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
                fontTextMesh = new THREE.Mesh(UIContentGeometry2, materialUI);
                fontTextMesh.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y - 0.4, mainNumber.getNumberMeshPos().z + 0.1);

                for (let n = 0; n < fontOptions.length; n++) {
                    UIContentGeometry2 = new THREE.TextGeometry(fontOptions[n], {
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

                    fontTextMeshes.push(new THREE.Mesh(UIContentGeometry2, materialUI));
                    fontTextMeshes[n].position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y - 0.4, mainNumber.getNumberMeshPos().z + 0.1);
                }


                UITitleGeometry6 = new THREE.TextGeometry('Click to continue...', {
                    font: font,
                    size: 0.4,
                    height: 1,
                    curveSegments: 24,
                    bevelEnabled: false,
                    bevelThickness: 10,
                    bevelSize: 8,
                    bevelOffset: 0,
                    bevelSegments: 5
                });
                UITitleGeometry6.center();
                UIInstructionMesh6 = new THREE.Mesh(UITitleGeometry6, materialUI);
                UIInstructionMesh6.position.set(mainNumber.getNumberMeshPos().x, mainNumber.getNumberMeshPos().y - 3, mainNumber.getNumberMeshPos().z);
                //scene.add(UIInstructionMesh6);


                styleButton = new THREE.Mesh(dropdownButtonGeometry, materialUnselected);
                styleButton1 = styleButton.clone();
                styleButton2 = styleButton.clone();
                styleButton3 = styleButton.clone();
                styleButton4 = styleButton.clone();
                fontButton = new THREE.Mesh(dropdownButtonGeometry, materialUnselected);
                fontButton1 = fontButton.clone();
                fontButton2 = fontButton.clone();
                fontButton3 = fontButton.clone();
                fontButton4 = fontButton.clone();
                fontButton5 = fontButton.clone();
                fontButton6 = fontButton.clone();
                UIBackground = new THREE.Mesh(UIBackgroundGeometry, materialUIBackground);
                smallTriangle1 = new THREE.Mesh(smallTriangleGeometry, materialUI);
                smallTriangle2 = new THREE.Mesh(smallTriangleGeometry, materialUI);

                confirmButton = new THREE.Mesh(buttonGeometry, materialUnselected);
                cancelButton = new THREE.Mesh(buttonGeometry, materialUnselected);

                styleButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
                styleButton1.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y + 0.4, mainNumber.getNumberMeshPos().z + 0.1);
                styleButton2.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.2, mainNumber.getNumberMeshPos().z + 0.1);
                styleButton3.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.8, mainNumber.getNumberMeshPos().z + 0.1);
                styleButton4.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 1.4, mainNumber.getNumberMeshPos().z + 0.1);

                smallTriangle1.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y + 1, mainNumber.getNumberMeshPos().z);
                smallTriangle1.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));

                fontButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
                fontButton1.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 0.9, mainNumber.getNumberMeshPos().z + 0.1);
                fontButton2.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 1.5, mainNumber.getNumberMeshPos().z + 0.1);
                fontButton3.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2.1, mainNumber.getNumberMeshPos().z + 0.1);
                fontButton4.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2.7, mainNumber.getNumberMeshPos().z + 0.1);
                fontButton5.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 3.3, mainNumber.getNumberMeshPos().z + 0.1);
                fontButton6.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 3.9, mainNumber.getNumberMeshPos().z + 0.1);

                smallTriangle2.position.set(mainNumber.getNumberMeshPos().x + 10, mainNumber.getNumberMeshPos().y - 0.3, mainNumber.getNumberMeshPos().z);
                smallTriangle2.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
                UIBackground.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y, mainNumber.getNumberMeshPos().z);

                confirmButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2, mainNumber.getNumberMeshPos().z);

                //fontButton.name = 'nextStepButton';
                //styleButton.name = 'previousStepButton';

                // activeButtons.push(styleButton, fontButton, nextButton);
                // scene.add(styleButton);
                // scene.add(fontButton);
                // scene.add(smallTriangle1);
                // scene.add(smallTriangle2);
                // scene.add(UIBackground);
                // scene.add(nextButton);
                // scene.add(tickMesh);

                resolve(true);
            });
        });
    });
}

function loadUI() {

    scene.add(UIInstructionMesh1);
    scene.add(UIInstructionMesh2);
    scene.add(UIInstructionMesh3);
    scene.add(styleTextMesh);
    scene.add(fontTextMesh);

    scene.add(styleButton);
    scene.add(fontButton);
    scene.add(smallTriangle1);
    scene.add(smallTriangle2);
    scene.add(UIBackground);

    confirmButton.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2, mainNumber.getNumberMeshPos().z);
    tickMesh.position.set(mainNumber.getNumberMeshPos().x + 12, mainNumber.getNumberMeshPos().y - 2, mainNumber.getNumberMeshPos().z);
    scene.add(confirmButton);
    scene.add(tickMesh);

    activeButtons.push(styleButton, fontButton, confirmButton);
    requestRenderIfNotRequested('loadingUI');
}

function removeUI() {

    scene.remove(UIInstructionMesh1);
    scene.remove(UIInstructionMesh2);
    scene.remove(UIInstructionMesh3);
    scene.remove(styleTextMesh);
    scene.remove(fontTextMesh);

    scene.remove(styleButton);
    scene.remove(fontButton);
    scene.remove(smallTriangle1);
    scene.remove(smallTriangle2);
    scene.remove(UIBackground);
    scene.remove(confirmButton);
    scene.remove(tickMesh);

    activeButtons.length = 0;
    requestRenderIfNotRequested('removeUI');
}

function expandUIMenu(index) {
    UIMenuExpanded[index] = true;

    if (index === 0) {

        scene.add(styleButton1);
        styleTextMeshes[0].position.set(styleTextMeshes[0].position.x, styleButton1.position.y - 0.1, styleButton1.position.z + 0.11);
        scene.add(styleTextMeshes[0]);

        scene.add(styleButton2);
        styleTextMeshes[1].position.set(styleTextMeshes[1].position.x, styleButton2.position.y - 0.1, styleButton2.position.z + 0.11);
        scene.add(styleTextMeshes[1]);

        scene.add(styleButton3);
        styleTextMeshes[2].position.set(styleTextMeshes[2].position.x, styleButton3.position.y - 0.1, styleButton3.position.z + 0.11);
        scene.add(styleTextMeshes[2]);

        scene.add(styleButton4);
        styleTextMeshes[3].position.set(styleTextMeshes[3].position.x, styleButton4.position.y - 0.1, styleButton4.position.z + 0.11);
        scene.add(styleTextMeshes[3]);

        smallTriangle1.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'));

        activeButtons.push(styleButton1, styleButton2, styleButton3, styleButton4);
    }
    else if (index === 1) {

        scene.add(fontButton1);
        fontTextMeshes[0].position.set(fontTextMeshes[0].position.x, fontButton1.position.y - 0.1, fontButton1.position.z + 0.11);
        scene.add(fontTextMeshes[0]);

        scene.add(fontButton2);
        fontTextMeshes[1].position.set(fontTextMeshes[1].position.x, fontButton2.position.y - 0.1, fontButton2.position.z + 0.11);
        scene.add(fontTextMeshes[1]);

        scene.add(fontButton3);
        fontTextMeshes[2].position.set(fontTextMeshes[2].position.x, fontButton3.position.y - 0.1, fontButton3.position.z + 0.11);
        scene.add(fontTextMeshes[2]);

        scene.add(fontButton4);
        fontTextMeshes[3].position.set(fontTextMeshes[3].position.x, fontButton4.position.y - 0.1, fontButton4.position.z + 0.11);
        scene.add(fontTextMeshes[3]);

        scene.add(fontButton5);
        fontTextMeshes[4].position.set(fontTextMeshes[4].position.x, fontButton5.position.y - 0.1, fontButton5.position.z + 0.11);
        scene.add(fontTextMeshes[4]);

        scene.add(fontButton6);
        fontTextMeshes[5].position.set(fontTextMeshes[5].position.x, fontButton6.position.y - 0.1, fontButton6.position.z + 0.11);
        scene.add(fontTextMeshes[5]);

        smallTriangle2.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'));

        activeButtons.push(fontButton1, fontButton2, fontButton3, fontButton4, fontButton5, fontButton6);
    }
    requestRenderIfNotRequested('expandUIMenu');
}

function collapseUIMenu(index) {

    UIMenuExpanded[index] = false;

    for (let i = 0; i < activeButtons.length; i++) {
        activeButtons[i].material = materialUnselected;
    }

    if (index === 0) {
        scene.remove(styleButton1);
        scene.remove(styleButton2);
        scene.remove(styleButton3);
        scene.remove(styleButton4);
        for (let n = 0; n < styleOptions.length; n++) {
            scene.remove(styleTextMeshes[n]);
        }
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        smallTriangle1.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
    }
    else if (index === 1) {
        scene.remove(fontButton1);
        scene.remove(fontButton2);
        scene.remove(fontButton3);
        scene.remove(fontButton4);
        scene.remove(fontButton5);
        scene.remove(fontButton6);
        for (let n = 0; n < fontOptions.length; n++) {
            scene.remove(fontTextMeshes[n]);
        }
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        activeButtons.pop();
        smallTriangle2.setRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ'));
    }
    requestRenderIfNotRequested('collapseUIMenu');
}

function confirmUIMenu(index, buttonIndex) {

    if (index === 0) {
        const UIContentGeometry = new THREE.TextGeometry(styleOptions[buttonIndex], {
            font: fontAvenirBook,
            size: 0.24,
            height: 0.12,
            curveSegments: 16,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5
        });

        scene.remove(styleTextMesh);
        styleTextMesh = new THREE.Mesh(UIContentGeometry, materialUI);
        styleTextMesh.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y + 0.9, mainNumber.getNumberMeshPos().z + 0.1);
        scene.add(styleTextMesh);

        mainNumberOptions.numberStyle = styleOptions[buttonIndex];
        numberMeshCallback();

        collapseUIMenu(index);
    }
    else if (index === 1) {
        const UIContentGeometry = new THREE.TextGeometry(fontOptions[buttonIndex], {
            font: fontAvenirBook,
            size: 0.24,
            height: 0.12,
            curveSegments: 16,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5
        });

        scene.remove(fontTextMesh);
        fontTextMesh = new THREE.Mesh(UIContentGeometry, materialUI);
        fontTextMesh.position.set(mainNumber.getNumberMeshPos().x + 10.3, mainNumber.getNumberMeshPos().y - 0.4, mainNumber.getNumberMeshPos().z + 0.1);
        scene.add(fontTextMesh);

        mainNumberOptions.numberFont = fontOptions[buttonIndex];
        numberMeshCallback();

        collapseUIMenu(index);
    }
    requestRenderIfNotRequested('confirmUIMenu');
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

async function loadSVG(urls) {

    return new Promise(resolve => {
        const svgLoaders = [new SVGLoader(), new SVGLoader(), new SVGLoader(), new SVGLoader(), new SVGLoader(), new SVGLoader()];
        let promises = [];

        for (let n = 0; n < urls.length; n++) {
            promises.push(svgLoaders[n].loadAsync(urls[n]));
        }

        Promise.all([promises[0], promises[1], promises[2], promises[3], promises[4], promises[5]]).then(data => {

            for (let n = 0; n < urls.length; n++) {
                const paths = data[n].paths;

                for (let i = 0; i < paths.length; i++) {

                    const path = paths[i];

                    const fillColor = path.userData.style.fill;

                    if (fillColor !== undefined && fillColor !== 'none') {

                        const material = new THREE.MeshBasicMaterial({
                            color: new THREE.Color().setStyle(fillColor),
                            opacity: path.userData.style.fillOpacity,
                            transparent: path.userData.style.fillOpacity < 1,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                            wireframe: false
                        });

                        const shapes = SVGLoader.createShapes(path);

                        for (let j = 0; j < shapes.length; j++) {

                            const shape = shapes[j];

                            const geometry = new THREE.ShapeGeometry(shape);
                            const mesh = new THREE.Mesh(geometry, material);

                            if (n === 0) {
                                leftClickIcon.add(mesh);
                            }
                            else if (n === 1) {
                                middleWheelIcon.add(mesh);
                            }
                            else if (n === 2) {
                                rightClickIcon.add(mesh);
                            }
                            else if (n === 3) {
                                let matrixScaling = new THREE.Matrix4();
                                matrixScaling.makeScale(30, 30, 1);
                                mesh.applyMatrix4(matrixScaling);
                                matrixScaling.makeTranslation(0.22 / iconScalar, -0.2 / iconScalar, 0);
                                mesh.applyMatrix4(matrixScaling);
                                leftClickIcon.add(mesh);
                            }
                            else if (n === 4) {
                                let matrixScaling = new THREE.Matrix4();
                                matrixScaling.makeScale(30, 30, 1);
                                mesh.applyMatrix4(matrixScaling);
                                matrixScaling.makeTranslation(0.22 / iconScalar, -0.07 / iconScalar, 0);
                                mesh.applyMatrix4(matrixScaling);
                                middleWheelIcon.add(mesh);
                            }
                            else if (n === 5) {
                                let matrixScaling = new THREE.Matrix4();
                                matrixScaling.makeScale(30, 30, 1);
                                mesh.applyMatrix4(matrixScaling);
                                matrixScaling.makeTranslation(0.22 / iconScalar, 0.06 / iconScalar, 0);
                                mesh.applyMatrix4(matrixScaling);
                                rightClickIcon.add(mesh);
                            }
                        }
                    }

                    const strokeColor = path.userData.style.stroke;

                    if (strokeColor !== undefined && strokeColor !== 'none') {

                        const material = new THREE.MeshBasicMaterial({
                            color: new THREE.Color().setStyle(strokeColor),
                            opacity: path.userData.style.strokeOpacity,
                            transparent: path.userData.style.strokeOpacity < 1,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                            wireframe: false
                        });

                        for (let j = 0, jl = path.subPaths.length; j < jl; j++) {

                            const subPath = path.subPaths[j];

                            const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);

                            if (geometry) {

                                const mesh = new THREE.Mesh(geometry, material);

                                if (n === 0) {
                                    leftClickIcon.add(mesh);
                                }
                                else if (n === 1) {
                                    middleWheelIcon.add(mesh);
                                }
                                else if (n === 2) {
                                    rightClickIcon.add(mesh);
                                }
                                else if (n === 3) {
                                    let matrixScaling = new THREE.Matrix4();
                                    matrixScaling.makeScale(30, 30, 1);
                                    mesh.applyMatrix4(matrixScaling);
                                    matrixScaling.makeTranslation(0.22 / iconScalar, -0.2 / iconScalar, 0);
                                    mesh.applyMatrix4(matrixScaling);
                                    leftClickIcon.add(mesh);
                                }
                                else if (n === 4) {
                                    let matrixScaling = new THREE.Matrix4();
                                    matrixScaling.makeScale(30, 30, 1);
                                    mesh.applyMatrix4(matrixScaling);
                                    matrixScaling.makeTranslation(0.22 / iconScalar, -0.07 / iconScalar, 0);
                                    mesh.applyMatrix4(matrixScaling);
                                    middleWheelIcon.add(mesh);
                                }
                                else if (n === 5) {
                                    let matrixScaling = new THREE.Matrix4();
                                    matrixScaling.makeScale(30, 30, 1);
                                    mesh.applyMatrix4(matrixScaling);
                                    matrixScaling.makeTranslation(0.22 / iconScalar, 0.06 / iconScalar, 0);
                                    mesh.applyMatrix4(matrixScaling);
                                    rightClickIcon.add(mesh);
                                }
                            }
                        }
                    }
                }

                if (n === 0) {
                    leftClickIcon.scale.multiplyScalar(iconScalar);
                    leftClickIcon.scale.y *= -1;

                    for (let i = 0; i < leftClickIcon.children.length; i++) {
                        leftClickIcon.children[i].translateX(0.15 / iconScalar);
                        leftClickIcon.children[i].translateY(-0.18 / iconScalar);
                    }
                }
                else if (n === 1) {
                    middleWheelIcon.scale.multiplyScalar(iconScalar);
                    middleWheelIcon.scale.y *= -1;

                    for (let i = 0; i < middleWheelIcon.children.length; i++) {
                        middleWheelIcon.children[i].translateX(0.15 / iconScalar);
                        middleWheelIcon.children[i].translateY(-0.05 / iconScalar);
                    }
                }
                else if (n === 2) {
                    rightClickIcon.scale.multiplyScalar(iconScalar);
                    rightClickIcon.scale.y *= -1;

                    for (let i = 0; i < rightClickIcon.children.length; i++) {
                        rightClickIcon.children[i].translateX(0.15 / iconScalar);
                        rightClickIcon.children[i].translateY(0.08 / iconScalar);
                    }
                }
            }
            resolve(true);
        });
    });
}

function addUIIconGroup() {
    let offsetVector = new THREE.Vector3(0, 0, 0);
    camera.getWorldDirection(offsetVector);
    leftClickIcon.position.set(offsetVector.x, offsetVector.y, offsetVector.z);
    leftClickIcon.setRotationFromQuaternion(camera.quaternion.clone());
    middleWheelIcon.position.set(offsetVector.x, offsetVector.y, offsetVector.z);
    middleWheelIcon.setRotationFromQuaternion(camera.quaternion.clone());
    rightClickIcon.position.set(offsetVector.x, offsetVector.y, offsetVector.z);
    rightClickIcon.setRotationFromQuaternion(camera.quaternion.clone());

    camera.add(leftClickIcon);
    camera.add(middleWheelIcon);
    camera.add(rightClickIcon);
}

async function asyncTimeout(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, true), t)
    });
}

function initImageHolder() {
    // let imageHolder = document.createElement('div');
    imageHolder.setAttribute('id', 'imageHolder');
    imageHolder.setAttribute('align', 'center');
    imageHolder.setAttribute('valign', 'middle');

    imageHolder.style.border = '20px dashed #555';
    imageHolder.style.width = '400px';
    imageHolder.style.height = '400px';
    imageHolder.style.top = '50%';
    imageHolder.style.left = '50%';
    imageHolder.style.marginTop = '-220px';
    imageHolder.style.marginLeft = '-220px';
    imageHolder.style.position = 'absolute';

    // let dragNDropText = document.createElement('b');
    dragNDropText.innerHTML = 'DRAG & DROP YOUR IMAGE HERE';
    dragNDropText.style.fontFamily = 'verdana';
    dragNDropText.style.fontSize = '150%';
    dragNDropText.style.color = '#555';
    dragNDropText.style.textAlign = 'center';
    dragNDropText.style.width = '50%';
    dragNDropText.style.top = '40%';
    dragNDropText.style.left = '25%';
    dragNDropText.style.position = 'absolute';

    imageHolder.ondragover = () => {
        console.log("ondragover");
        imageHolder.style.border = '20px dashed #ccc';
        dragNDropText.style.color = '#ccc';

        return false;
    }

    imageHolder.ondragleave = () => {
        console.log("ondragleave");
        imageHolder.style.border = '20px dashed #555';
        dragNDropText.style.color = '#555';

        return false;
    }

    imageHolder.ondrop = (e) => {
        console.log("ondrop");

        e.preventDefault();

        let file = e.dataTransfer.files[0];
        let fileReader = new FileReader();

        let image = document.createElement('img');

        fileReader.onload = function (event) {
            // imageHolder.style.background =
            //     'url(' + event.target.result + ') no-repeat center';

            image.src = event.target.result;
            //imageHolder.appendChild(image);
            Promise.all([asyncTimeout(200)]).then(results => {

                generateImageSide(image);

                // let texture = new THREE.Texture(image);
                // texture.needsUpdate = true;
                // scene.getObjectByName('cube').material.map = texture;
            });
        };

        fileReader.readAsDataURL(file);

        return false;
    }

    document.body.appendChild(imageHolder);
    imageHolder.appendChild(dragNDropText);
}

function generateImageSide(image) {
    let scalingFactor = mainNumber.getCubeSideLength() * 0.92 / Math.max(image.width, image.height);
    let imageWidthInScene = image.width * scalingFactor;
    let imageHeightInScene = image.height * scalingFactor;

    let imageData = getImageData(image);

    let newCubePositions = [];
    let cubeCount = 0;
    unitCubeGeometry = new THREE.BoxGeometry(mainNumber.getUnitCubeSideLength(), mainNumber.getUnitCubeSideLength(), mainNumber.getUnitCubeSideLength());

    let majorityDarkColor;
    let totalColor = 0;
    let sampleCount = 0;
    for (let i = 0; i < image.width; i++) {
        for (let j = 0; j < image.height; j++) {
            totalColor += getImagePixelColor(imageData, i, j);
            sampleCount++;
        }
    }

    let averageColor = totalColor / sampleCount;
    console.log("averageColor: " + averageColor);

    if (averageColor > 382) {
        majorityDarkColor = false;
    }
    else {
        majorityDarkColor = true;
    }

    for (let i = 0; i < mainNumber.cubePositions.length; i++) {
        if ((Math.abs(mainNumber.cubePositions[i].z) < (imageWidthInScene / 2 - mainNumber.getUnitCubeSideLength() / 2)) &&
            (Math.abs(mainNumber.cubePositions[i].y) < (imageHeightInScene / 2 - mainNumber.getUnitCubeSideLength() / 2))) {
            let xPos0 = Math.round((mainNumber.cubePositions[i].z + imageWidthInScene / 2 - mainNumber.getUnitCubeSideLength() / 4) / imageWidthInScene * image.width);
            let yPos0 = Math.round((1 - (mainNumber.cubePositions[i].y + imageHeightInScene / 2 - mainNumber.getUnitCubeSideLength() / 4) / imageHeightInScene) * image.height);
            let xPos1 = Math.round((mainNumber.cubePositions[i].z + imageWidthInScene / 2 + mainNumber.getUnitCubeSideLength() / 4) / imageWidthInScene * image.width);
            let yPos1 = Math.round((1 - (mainNumber.cubePositions[i].y + imageHeightInScene / 2 + mainNumber.getUnitCubeSideLength() / 4) / imageHeightInScene) * image.height);

            let color = (getImagePixelColor(imageData, xPos0, yPos0) + getImagePixelColor(imageData, xPos0, yPos1) + getImagePixelColor(imageData, xPos1, yPos1) + getImagePixelColor(imageData, xPos1, yPos0)) / 4;
            if (majorityDarkColor) {
                if (color < (averageColor + 382) / 2) {
                    newCubePositions.push(mainNumber.cubePositions[i]);
                    cubeCount++;
                }
            }
            else {
                if (color > (averageColor + 382) / 2) {
                    newCubePositions.push(mainNumber.cubePositions[i]);
                    cubeCount++;
                }
            }
        }
        else {
            newCubePositions.push(mainNumber.cubePositions[i]);
            cubeCount++;
        }
    }

    finalInstancedMesh = new THREE.InstancedMesh(unitCubeGeometry, materialCube.clone(), cubeCount);

    let matrixTranslation = new THREE.Matrix4();

    for (let i = 0; i < cubeCount; i++) {
        matrixTranslation.makeTranslation(newCubePositions[i].x, newCubePositions[i].y, newCubePositions[i].z);
        finalInstancedMesh.setMatrixAt(i, matrixTranslation);
    }

    finalInstancedMesh.instanceMatrix.needsUpdate = true;
    finalInstancedMesh.castShadow = true;

    finalInstancedMesh.position.set(roomPositions[2].x, roomPositions[2].y, roomPositions[2].z);
    finalInstancedMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(90), 0, 'XYZ'));

    scene.remove(mainNumber.instancedMesh);
    imageHolder.removeChild(dragNDropText);
    document.body.removeChild(imageHolder);

    leftClickIcon.visible = true;
    rightClickIcon.visible = true;
    middleWheelIcon.visible = true;
    scene.add(finalInstancedMesh);

    imageSideGenerated = true;

    groundSpotLight2.intensity = 200;
    groundSpotLight2.castShadow = true;
    groundLight2Effect.intensity = 20;

    orbitControlsEnableAllowed = true;
    requestRenderIfNotRequested('generateImageSide');
}

function getImageData(image) {

    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    let context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height);
}

function getImagePixelColor(imageData, x, y) {

    let position = (x + imageData.width * y) * 4, data = imageData.data;
    // return { r: data[position], g: data[position + 1], b: data[position + 2], a: data[position + 3] };
    if (data[position + 2] > (data[position] + data[position + 1]) * 2) {
        // Oversaturated sky
        return ((data[position] + data[position + 1] + data[position + 2]) * 4);
    }
    else {
        return (data[position] + data[position + 1] + data[position + 2]);
    }
}

// 3D Printing

let finalGeometries = [];
let mergedFinalGeometry;
let mergedFinalMesh;

let newMatrix = new THREE.Matrix4();

let link = document.createElement('a');
link.style.display = 'none';

let loadingText = document.createElement('b');
loadingText.innerHTML = 'Your 3D print is being generated ... 0%';
loadingText.style.fontFamily = 'verdana';
loadingText.style.fontSize = '120%';
loadingText.style.color = '#ffffff';
loadingText.style.textAlign = 'center';
loadingText.style.width = '50%';
loadingText.style.top = '45%';
loadingText.style.left = '25%';
loadingText.style.position = 'absolute';

function saveFile(blob, filename) {
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    document.body.removeChild(link);
}

function generateMergedFinalGeometry() {

    return new Promise(resolve => {

        document.body.appendChild(loadingText);

        let j = 0;

        let refreshIntervalId = setInterval(function () {
            length = 20;
            if (j < 20) {
                const progressRatio = (j + 1) / 20;
                const progressRatioPercentage = Math.round(progressRatio * 100);
                loadingBarElement1.style.transform = `scaleX(${progressRatio})`;
                loadingText.innerHTML = `Your 3D print is being generated ... ${progressRatioPercentage}%`;

                for (let i = Math.round(finalInstancedMesh.count * j / 20); i < Math.round(finalInstancedMesh.count * (j + 1) / 20); i++) {
                    finalInstancedMesh.getMatrixAt(i, newMatrix);
                    finalGeometries.push(unitCubeGeometry.clone().applyMatrix4(newMatrix));
                }

                if (j === 0) {
                    mergedFinalGeometry = mergeBufferGeometries(finalGeometries);
                    finalGeometries.length = 0;
                }
                else {
                    finalGeometries.push(mergedFinalGeometry.clone());
                    mergedFinalGeometry = mergeBufferGeometries(finalGeometries);
                    finalGeometries.length = 0;
                }

            } else {
                finalGeometries = [];
                mergedFinalMesh = new THREE.Mesh(mergedFinalGeometry, new THREE.MeshBasicMaterial({ color: 0xFF0404 }));
                // mergedFinalMesh.position.set(finalInstancedMesh.position.x + 20, finalInstancedMesh.position.y, finalInstancedMesh.position.z);
                // scene.add(mergedFinalMesh);

                clearInterval(refreshIntervalId);
                resolve(true);
            }
            j++;
        }, 100);
    });
}

function releaseInstancedMeshMemeory() {
    scene.remove(mainNumber.instancedMesh);
    mainNumber.instancedMesh = null;
}

function addLoadingOverlay() {
    let offsetVector = new THREE.Vector3(0, 0, 0);
    camera.getWorldDirection(offsetVector);
    loadingOverlay.position.set(offsetVector.x, offsetVector.y, offsetVector.z);
    loadingOverlay.setRotationFromQuaternion(camera.quaternion.clone());

    loadingOverlay.visible = false;
    camera.add(loadingOverlay);
}

function releaseSTLMemory() {
    link = null;
    mergedFinalMesh = null;
}

// Virtual artifact

let virtualArtifactMesh;
let virtualArtifactGenerated = false;

function generateVirtualArtifact() {
    if (!virtualArtifactGenerated) {
        document.body.style.background = "rgb(80, 80, 80)";

        virtualArtifactMesh = new THREE.Mesh(mergedFinalGeometry, noiseMaterial);
        virtualArtifactMesh.position.set(roomPositions[4].x, roomPositions[4].y, roomPositions[4].z);
        virtualArtifactMesh.setRotationFromEuler(new THREE.Euler(0, degreesToRadians(180), 0, 'XYZ'));
        scene.add(virtualArtifactMesh);

        virtualArtifactGenerated = true;
    }
}

function addGUI() {

    const gui = new dat.GUI({ width: 330 });

    gui.addColor(noiseOptions, 'depthColor').onChange(() => { noiseMaterial.uniforms.uDepthColor.value.set(noiseOptions.depthColor) });
    gui.addColor(noiseOptions, 'surfaceColor').onChange(() => { noiseMaterial.uniforms.uSurfaceColor.value.set(noiseOptions.surfaceColor) });

    gui.add(noiseMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(0.2).step(0.001).name('uBigWavesElevation');
    gui.add(noiseMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(5).step(0.001).name('uBigWavesFrequencyX');
    gui.add(noiseMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(5).step(0.001).name('uBigWavesFrequencyY');
    gui.add(noiseMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(4).step(0.001).name('uBigWavesSpeed');
    gui.add(noiseMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(0.4).step(0.001).name('uSmallWavesElevation');
    gui.add(noiseMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(10).step(0.001).name('uSmallWavesFrequency');
    gui.add(noiseMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(1).step(0.001).name('uSmallWavesSpeed');
    gui.add(noiseMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations');
    gui.add(noiseMaterial.uniforms.uColorOffset, 'value').min(0).max(0.5).step(0.001).name('uColorOffset');
    gui.add(noiseMaterial.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier');
}