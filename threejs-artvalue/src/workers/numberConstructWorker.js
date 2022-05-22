import * as THREE from 'three';

self.onmessage = function (e) {

    const currentPos = e.data[0];
    const unitCubeNumber = e.data[1];
    const unitCubeSideLength = e.data[2];
    const cubeSideLength = e.data[3];
    const numberText = e.data[4];
    const numberFont = e.data[5];
    const numberMeshScale = e.data[6];
    const numberDepthScalingFactor = e.data[7];
    const standardNumberSize = e.data[8];
    const numberDepth = e.data[9];

    let positions = [];
    let collisions = [];
    let xyzPositions = [];

    for (let k = 0; k < unitCubeNumber; k++) {
        xyzPositions.push([]);
        for (let j = 0; j < unitCubeNumber; j++) {
            xyzPositions[k].push([]);
            for (let i = 0; i < unitCubeNumber; i++) {
                const cubePos = new THREE.Vector3(
                    currentPos.x + (i + 0.5) * unitCubeSideLength - 0.5 * cubeSideLength,
                    currentPos.y + (j + 0.5) * unitCubeSideLength - 0.5 * cubeSideLength,
                    currentPos.z + (k + 0.5) * unitCubeSideLength - 0.5 * cubeSideLength);

                positions.push(cubePos);

                xyzPositions[k][j].push(cubePos);
            }
        }
    }

    console.log("Collision started");

    let workers, running;
    let supersamplingCollisions = [[], [], [], [], [], [], [], []];
    let xyCollisions = [];

    running = 0;
    for (let n = 0; n < 8; n++) {

        console.log("running: " + running);

        workers = new Worker(new URL('./colliderSupersamplingWorker.js', import.meta.url));
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
                            let collisionCount = 0;
                            for (let n = 0; n < 8; n++) {
                                collisionCount += supersamplingCollisions[n][j][i];
                            }
                            if (collisionCount >= 4) {
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
}
