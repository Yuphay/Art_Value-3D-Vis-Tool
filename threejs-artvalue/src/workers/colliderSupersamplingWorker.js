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
        matrixScaling.makeScale(numberMeshScale, numberMeshScale, numberDepth);
        currentMesh.geometry.applyMatrix4(matrixScaling);

        let collisionRayCaster0 = new THREE.Raycaster();
        let xyCollisions = [];

        collisionRayCaster0.layers.set(1);
        currentMesh.layers.enable(1);
        currentMesh.material.side = THREE.DoubleSide;
        currentMesh.updateMatrixWorld();
        collisionRayCaster0.far = numberDepth;

        for (let j = 0; j < unitCubeNumber; j++) {
            xyCollisions.push([]);
            for (let i = 0; i < unitCubeNumber; i++) {
                if (id === 0) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].y + unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 1) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].y + unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 2) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].y - unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 3) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].y - unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 4) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].y + unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 5) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].y + unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 6) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x - unitCubeSideLength * 1 / 8,
                        xyPositions[j][i].y - unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }
                else if (id === 7) {
                    collisionRayCaster0.set(new THREE.Vector3(
                        xyPositions[j][i].x + unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].y - unitCubeSideLength * 3 / 8,
                        xyPositions[j][i].z),
                        new THREE.Vector3(0, 0, 1));
                }

                const collisionRayIntersects0 = collisionRayCaster0.intersectObject(currentMesh);

                let collisionCount = 0;
                if (collisionRayIntersects0.length > 0) {
                    collisionCount += 1;
                }

                xyCollisions[j].push(collisionCount);
            }
        }

        self.postMessage({ id: id, xyCollisions: xyCollisions });
        console.log("Thread " + id + " done");
    });
}

