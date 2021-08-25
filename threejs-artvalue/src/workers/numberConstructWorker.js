import * as THREE from 'three';

self.onmessage = function (e) {

    const currentPos = e.data[0];
    const unitCubeNumber = e.data[1];
    const unitCubeSideLength = e.data[2];
    const numberText = e.data[3];
    const numberFont = e.data[4];
    const numberMeshScale = e.data[5];
    const numberDepthScalingFactor = e.data[6];
    const standardNumberSize = e.data[7];
    const numberDepth = e.data[8];

    let positions = [];
    let collisions = [];
    let xyzPositions = [];

    for (let k = 0; k < unitCubeNumber; k++) {
        xyzPositions.push([]);
        for (let j = 0; j < unitCubeNumber; j++) {
            xyzPositions[k].push([]);
            for (let i = 0; i < unitCubeNumber; i++) {
                const cubePos = new THREE.Vector3(
                    currentPos.x + (i + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber,
                    currentPos.y + (j + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber,
                    currentPos.z + (k + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber);

                positions.push(cubePos);

                xyzPositions[k][j].push(cubePos);
            }
        }
    }

    // let fontLoader = new THREE.FontLoader();

    // fontLoader.load(numberFont, function (font) {
    //     let currentGeometry = new THREE.TextGeometry(numberText, {
    //         font: font,
    //         size: standardNumberSize,
    //         height: 1,
    //         curveSegments: 64,
    //         bevelEnabled: false,
    //         bevelThickness: 0.1,
    //         bevelSize: 0.1,
    //         bevelOffset: 0,
    //         bevelSegments: 5
    //     });

    //     currentGeometry.center();
    //     let currentMesh = new THREE.Mesh(currentGeometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    //     currentMesh.position.set(currentPos.x, currentPos.y, currentPos.z);

    //     let matrixScaling = new THREE.Matrix4();
    //     matrixScaling.makeScale(numberMeshScale, numberMeshScale, numberMeshScale * numberDepthScalingFactor);
    //     currentMesh.geometry.applyMatrix4(matrixScaling);

    //     collisionRayCaster0.layers.set(1);
    //     currentMesh.layers.enable(1);
    //     currentMesh.material.side = THREE.DoubleSide;
    //     currentMesh.updateMatrixWorld();

        console.log("Collision started");

        let workers, running;
        let workerURL = new URL('./colliderSupersamplingWorker.js', import.meta.url);
        let supersamplingCollisions = [[], [], [], []];
        let xyCollisions = [];

        running = 0;
        for (let n = 0; n < 4; n++) {
            console.log("running: " + running);

            workers = new Worker(workerURL);
            workers.postMessage({
                id: n,
                unitCubeNumber: unitCubeNumber,
                xyPositions: xyzPositions[0],
                numberDepth: numberDepth,
                unitCubeSideLength: unitCubeSideLength,
                numberFont: numberFont,
                numberText: numberText,
                standardNumberSize: standardNumberSize,
                numberMeshScale: numberMeshScale,
                numberDepthScalingFactor: numberDepthScalingFactor,
                currentPos: currentPos
            });
            workers.onmessage = workerDone;
            ++running;
        }

        function workerDone(e) {
            --running;
            supersamplingCollisions[e.data.id] = e.data.xyCollisions;
            if (running === 0) {
                for (let k = 0; k < unitCubeNumber; k++) {
                    for (let j = 0; j < unitCubeNumber; j++) {
                        if (k === 0) xyCollisions.push([]);
                        for (let i = 0; i < unitCubeNumber; i++) {
                            if (k === 0) {
                                if ((supersamplingCollisions[0][j][i] && supersamplingCollisions[3][j][i]) ||
                                    (supersamplingCollisions[1][j][i] && supersamplingCollisions[2][j][i])) {
                                    collisions.push(true);
                                    xyCollisions[j].push(true);
                                }
                                else {
                                    collisions.push(false);
                                    xyCollisions[j].push(false);
                                }
                            }
                            else {
                                collisions.push(xyCollisions[j][i]);
                            }
                        }
                    }
                }
                console.log("Collision finished");
                self.postMessage([positions, collisions]);
            }
        }

        //let xyCollisions = []
        // for (let k = 0; k < unitCubeNumber; k++) {
        //     for (let j = 0; j < unitCubeNumber; j++) {
        //         if (k === 0) xyCollisions.push([]);
        //         for (let i = 0; i < unitCubeNumber; i++) {

        //             if (k === 0) {
        //                 collisionRayCaster0.set(new THREE.Vector3(
        //                     xyzPositions[k][j][i].x - unitCubeSideLength / 2,
        //                     xyzPositions[k][j][i].y + unitCubeSideLength / 2,
        //                     xyzPositions[k][j][i].z - unitCubeSideLength / 2),
        //                     new THREE.Vector3(0, 0, 1));

        //                 collisionRayCaster0.far = numberDepth;

        //                 const collisionRayIntersects = collisionRayCaster0.intersectObject(currentMesh);

        //                 if (collisionRayIntersects.length > 0) {
        //                     collisions.push(true);
        //                     xyCollisions[j].push(true);
        //                 }
        //                 else {
        //                     collisions.push(false);
        //                     xyCollisions[j].push(false);
        //                 }
        //             }

        //             else {
        //                 collisions.push(xyCollisions[j][i]);
        //             }
        //         }
        //     }
        // }
    //});
}