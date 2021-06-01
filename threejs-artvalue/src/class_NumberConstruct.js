/**
 * FRONT view:
 * Convert input numbers into 3D constraints
 */
import * as THREE from 'three';

export class NumberConstruct {
    constructor(numberValue, numberStyle, numberFont) {
        this.fontLoader = new THREE.FontLoader();
        this.numberText = "";
        this.numberValue = numberValue;
        this.numberStyle = numberStyle;
        this.numberFont = numberFont;
        this.matchFont();
        this.numberToText();
    }

    addNumberGeometry(scene, material, position) {

        this.fontLoader.load(this.numberFont, function (font) {
            const geometry = new THREE.TextGeometry(this.numberText, {
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
        }.bind(this));
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
        const integer = Math.floor(this.numberValue);
        const hundreds = integer % 1000;
        let results = [hundreds];
        let quotient = Math.floor(integer / 1000);
        let newInteger = integer;
        while (quotient != 0) {
            newInteger = (newInteger - results[results.length - 1]) / 1000;
            results.push(newInteger % 1000);
            quotient = Math.floor(newInteger / 1000);
        }

        let loopCount = 0;
        while (results.length > 0) {
            if (loopCount === 0) {
                this.numberText = this.numberText.concat(results.pop().toString(10));
            }
            else {
                let nextDigits = results.pop().toString(10);
                if (nextDigits.length === 3) {
                    this.numberText = this.numberText.concat(nextDigits);
                }
                else if (nextDigits.length === 2) {
                    this.numberText = this.numberText.concat("0", nextDigits);
                }
                else if (nextDigits.length === 1) {
                    this.numberText = this.numberText.concat("00", nextDigits);
                }
            }
            if (this.numberStyle === "European") {
                this.numberText = this.numberText.concat(".");
            }
            else if (this.numberStyle === "US") {
                this.numberText = this.numberText.concat(",");
            }
            else if (this.numberStyle === "No Separator") {
                // Doing nothing
            }
            loopCount += 1;
        }
        if (this.numberStyle !== "No Separator") {
            this.numberText = this.numberText.substring(0, this.numberText.length - 1);
        }

        const decimal = (this.numberValue - integer).toFixed(2).substring(2);
        if (decimal != 0) {
            if (this.numberStyle === "European") {
                this.numberText = this.numberText.concat(",");
            }
            else if (this.numberStyle === "US") {
                this.numberText = this.numberText.concat(".");
            }
            else if (this.numberStyle === "No Separator") {
                this.numberText = this.numberText.concat(".");
            }
            this.numberText = this.numberText.concat(decimal);
        }



    }
}