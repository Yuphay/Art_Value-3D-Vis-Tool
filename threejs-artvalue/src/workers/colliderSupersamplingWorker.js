import * as THREE from 'three';

self.onmessage = function (e) {

    let id = e.data.id;

    console.log("Thread " + id + " started");

    let unitCubeNumber = e.data.unitCubeNumber;
    let xyPositions = e.data.xyPositions;
    let numberDepth = e.data.numberDepth;
    let unitCubeSideLength = e.data.unitCubeSideLength;
    let numberFont = e.data.numberFont;
    let numberText = e.data.numberText;
    let standardNumberSize = e.data.standardNumberSize;
    let numberMeshScale = e.data.numberMeshScale;
    let numberDepthScalingFactor = e.data.numberDepthScalingFactor;
    let currentPos = e.data.currentPos;

    let fontLoader = new THREE.FontLoader();
    fontLoader.load(numberFont, function (font) {
        let currentGeometry = new THREE.TextGeometry(numberText, {
            font: font,
            size: standardNumberSize,
            height: 1,
            curveSegments: 64,
            bevelEnabled: false,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 5
        });

        currentGeometry.center();
        let currentMesh = new THREE.Mesh(currentGeometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        currentMesh.position.set(currentPos.x, currentPos.y, currentPos.z);

        let matrixScaling = new THREE.Matrix4();
        matrixScaling.makeScale(numberMeshScale, numberMeshScale, numberMeshScale * numberDepthScalingFactor);
        currentMesh.geometry.applyMatrix4(matrixScaling);

        let collisionRayCaster = new THREE.Raycaster();
        let xyCollisions = [];

        collisionRayCaster.layers.set(1);
        currentMesh.layers.enable(1);
        currentMesh.material.side = THREE.DoubleSide;
        currentMesh.updateMatrixWorld();
        collisionRayCaster.far = numberDepth;

        for (let j = 0; j < unitCubeNumber; j++) {
            xyCollisions.push([]);
            for (let i = 0; i < unitCubeNumber; i++) {
                if (id === 0) {
                    collisionRayCaster.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 0.25,
                        xyPositions[j][i].y + unitCubeSideLength * 0.25,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 1) {
                    collisionRayCaster.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 0.25,
                        xyPositions[j][i].y + unitCubeSideLength * 0.25,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 2) {
                    collisionRayCaster.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 0.25,
                        xyPositions[j][i].y - unitCubeSideLength * 0.25,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 3) {
                    collisionRayCaster.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 0.25,
                        xyPositions[j][i].y - unitCubeSideLength * 0.25,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }

                const collisionRayIntersects = collisionRayCaster.intersectObject(currentMesh);

                if (collisionRayIntersects.length > 0) {
                    xyCollisions[j].push(true);
                }
                else {
                    xyCollisions[j].push(false);
                }
            }
        }

        self.postMessage({ id: id, xyCollisions: xyCollisions });
        console.log("Thread " + id + " done");
    });
}

