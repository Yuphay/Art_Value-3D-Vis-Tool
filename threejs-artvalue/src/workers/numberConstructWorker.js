import * as THREE from 'three';

self.onmessage = function (e) {

    const currentPos = e.data[0];
    const unitCubeNumber = e.data[1];
    const unitCubeSideLength = e.data[2];
    const numberText = e.data[3];
    const numberFont = e.data[4];
    const numberMeshScale = e.data[5];
    const cubeSideLength = e.data[6];
    const standardNumberSize = e.data[7];

    let positions = [];
    let collisions = [];

    let collisionRayCaster0 = new THREE.Raycaster();
    let collisionRayCaster1 = new THREE.Raycaster();
    let collisionRayCaster2 = new THREE.Raycaster();
    let collisionRayCaster3 = new THREE.Raycaster();

    for (let k = 0; k < unitCubeNumber; k++) {
        for (let j = 0; j < unitCubeNumber; j++) {
            for (let i = 0; i < unitCubeNumber; i++) {
                positions.push(new THREE.Vector3(
                    currentPos.x + (i + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber,
                    currentPos.y + (j + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber,
                    currentPos.z + (k + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber
                ));
            }
        }
    }

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
        currentMesh.scale.set(numberMeshScale, numberMeshScale, numberMeshScale);
        currentMesh.scale.set(1, 1, cubeSideLength + 1);

        collisionRayCaster0.layers.set(1);
        currentMesh.layers.enable(1);
        currentMesh.material.side = THREE.DoubleSide;
        currentMesh.updateMatrixWorld();

        for (let i = 0; i < positions.length; i++) {

            collisionRayCaster0.set(new THREE.Vector3(
                positions[i].x - unitCubeSideLength / 2,
                positions[i].y + unitCubeSideLength / 2,
                positions[i].z - unitCubeSideLength / 2),
                new THREE.Vector3(0, 0, 1));
    
            //collisionRayCaster0.far = unitCubeSideLength;
    
            const collisionRayIntersects = collisionRayCaster0.intersectObject(currentMesh);

            // console.log(i);
            // console.log(positions[i]);

            if (collisionRayIntersects.length > 0) {
                collisions.push(true);
            }
            else {
                collisions.push(false);
            }
        }

        self.postMessage([positions, collisions]);
    })

}