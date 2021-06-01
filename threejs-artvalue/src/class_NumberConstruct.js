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
        this.matchFont();
    }

    addNumberGeometry(scene, material, position) {
        const fontLoader = new THREE.FontLoader();

        fontLoader.load(this.numberFont, function (font) {

            const geometry = new THREE.TextGeometry('10.234.567,89', {
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

    matchFont() {
        switch (this.numberFont) {
            case 'Avenir Black':
                this.numberFont = '/fonts/Avenir Black_Regular.json';
                break;
            case 'Crash Numbering Serif':
                this.numberFont = '/fonts/CrashNumberingSerif_Regular.json';
                break;
            case 'Nexa Rust Handmade':
                this.numberFont = '/fonts/Nexa Rust Handmade Extended_Regular.json';
                break;
            case 'Pecita':
                this.numberFont = '/fonts/Pecita_Book.json'
                break;
            case 'Press Start 2P':
                this.numberFont = '/fonts/Press Start 2P_Regular.json'
                break;
            case 'Roboto Bold':
                this.numberFont = '/fonts/Roboto_Bold.json'
                break;
            default:
                this.numberFont = '/fonts/Avenir Black_Regular.json';
        }
    }

    numberToText() {

    }
}