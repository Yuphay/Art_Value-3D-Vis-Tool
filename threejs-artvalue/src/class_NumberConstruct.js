/**
 * FRONT view:
 * Convert input numbers into 3D constraints
 */
import * as THREE from 'three';

export class NumberConstruct {

    constructor(numberValue, numberStyle, numberFont) {
        this.currentMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        this.currentMesh.name = 'currentNumberMesh';
        this.fontLoader = new THREE.FontLoader();
        this.numberText = "";
        this.numberValue = numberValue;
        this.numberStyle = numberStyle;
        this.numberFont = numberFont;
        this.standardNumberSize = 2;
        this.boundingBoxSize = new THREE.Vector3(0, 0, 0);
        this.currentPos = new THREE.Vector3(-20, 7, -50); // initial value
        this.unitCubeGroup = new THREE.Group();
        this.cubeSideLength = 0;
    }

    setNumberMeshPos(newPos) {
        this.currentPos.set(newPos.x, newPos.y, newPos.z);
        this.currentMesh.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);
    }

    getNumberMeshPos() {
        return this.currentPos;
    }

    getCubeSideLength(){
        return this.cubeSideLength;
    }

    addNumberMesh(scene, material, numberValue = this.numberValue, numberStyle = this.numberStyle, numberFont = this.numberFont) {

        scene.remove(scene.getObjectByName('currentNumberMesh'));

        this.numberText = "";
        this.numberValue = numberValue;
        this.numberStyle = numberStyle;
        this.numberFont = numberFont;

        this.matchFont();
        this.numberToText();

        this.fontLoader.load(this.numberFont, function (font) {
            const geometry = new THREE.TextGeometry(this.numberText, {
                font: font,
                size: this.standardNumberSize,
                height: 1,
                curveSegments: 64,
                bevelEnabled: false,
                bevelThickness: 0.1,
                bevelSize: 0.1,
                bevelOffset: 0,
                bevelSegments: 5
            });

            material.transparent = true;
            material.opacity = 0.0;
            geometry.center();
            this.currentMesh = new THREE.Mesh(geometry, material);

            this.currentMesh.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);

            this.currentMesh.name = 'currentNumberMesh';
            scene.add(this.currentMesh);

            let boundingBox = new THREE.Box3();
            boundingBox.setFromObject(this.currentMesh);

            boundingBox.getSize(this.boundingBoxSize);
            const scaleFactor = this.standardNumberSize / this.boundingBoxSize.y;

            scene.getObjectByName('currentNumberMesh').scale.set(scaleFactor, scaleFactor, scaleFactor);

            scene.getObjectByName('currentNumberMesh').material.opacity = 0.5;

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
            else if (this.numberStyle === "European No Separator") {
                // Doing nothing
            }
            else if (this.numberStyle === "US No Separator") {
                // Doing nothing
            }
            loopCount += 1;
        }
        if (this.numberStyle === "European" || this.numberStyle === "US") {
            this.numberText = this.numberText.substring(0, this.numberText.length - 1);
        }

        const decimal = (this.numberValue - integer).toFixed(2).substring(2);
        if (decimal != 0) {
            if (this.numberStyle === "European" || this.numberStyle === "European No Separator") {
                this.numberText = this.numberText.concat(",");
            }
            else if (this.numberStyle === "US" || this.numberStyle === "US No Separator") {
                this.numberText = this.numberText.concat(".");
            }

            this.numberText = this.numberText.concat(decimal);
        }
    }

    generateCubeConstraint(scene, unitCubeNumber, material) {

        
        this.cubeSideLength = this.boundingBoxSize.x + 2;
        let unitCubeSideLength = this.cubeSideLength / unitCubeNumber;
        const unitCubeGeometry = new THREE.BoxGeometry(unitCubeSideLength, unitCubeSideLength, unitCubeSideLength);
        this.unitCubeGroup.clear();
        for (let k = 0; k < unitCubeNumber; k++) {
            for (let j = 0; j < unitCubeNumber; j++) {
                for (let i = 0; i < unitCubeNumber; i++) {
                    let mesh = new THREE.Mesh(unitCubeGeometry, material);
                    mesh.position.x = this.currentPos.x + (i + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber;
                    mesh.position.y = this.currentPos.y + (j + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber;
                    mesh.position.z = this.currentPos.z + (k + 0.5) * unitCubeSideLength - 0.5 * unitCubeSideLength * unitCubeNumber;;

                    this.unitCubeGroup.add(mesh);
                }
            }
        }
        scene.add(this.unitCubeGroup);

        scene.getObjectByName('currentNumberMesh').scale.set(1, 1, this.cubeSideLength + 1);
    }

    removeUnitCubeGroup(scene) {
        scene.remove(this.unitCubeGroup);
    }
}