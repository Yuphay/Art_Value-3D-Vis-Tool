/**
 * FRONT view:
 * Convert input numbers into 3D constraints
 */
import * as THREE from 'three';

export class NumberConstruct {
    constructor(numberValue, numberStyle, numberFont) {
        this.numberValue = numberValue;
        this.numberStyle = numberStyle;
        this.numberFont = numberFont;
    }

    addNumberGeometry(scene, material, position) {
        const fontLoader = new THREE.FontLoader();

        fontLoader.load('/fonts/Avenir Black_Regular.json', function (font) {

            const geometry = new THREE.TextGeometry('1.234,56', {
                font: font,
                size: 5,
                height: 1,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 1,
                bevelOffset: 0,
                bevelSegments: 5
            });

            const materialEmpty = new THREE.MeshBasicMaterial({ color: 0x0000FF });
            materialEmpty.transparent = true;
            materialEmpty.opacity = 0.5;

            const meshNumber = new THREE.Mesh(geometry, material);
            meshNumber.position.set(position.x, position.y, position.z);
            scene.add(meshNumber);
        });
    }
}