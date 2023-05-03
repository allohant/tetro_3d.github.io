import * as THREE from './../lib/three.module.js';

function startGame() {
    let mainMenu = document.getElementById("main-menu");
    let gameMenu = document.getElementById("game-menu");

    mainMenu.style.display = "none";
    gameMenu.style.display = "block";
    gameStarted = true;
    main();
}

function stopGame() {
    let mainMenu = document.getElementById("main-menu");
    let gameMenu = document.getElementById("game-menu");
    if (gameEnded == true) {
        gameMenu.style.display = "none";
    }
    mainMenu.style.display = "block";
    gameMenu.style.display = "none";
    gameStarted = false;
    document.location.reload();
}

function gameOver() {
    let gameMenu = document.getElementById("game-menu");
    let goverMenu = document.getElementById("gover-menu");
    gameMenu.style.display = "none";
    goverMenu.style.display = "block";
    let scoreField = document.getElementById("score-content");
    let goverScoreField = document.getElementById("gover-score-content");
    goverScoreField.innerHTML = scoreField.innerHTML;
    console.log("Game Over");
    gameEnded = true;
}

function demoGame() {
    demoStarted = true;
    startGame();
}

function updateScore(currentScore) {
    let scoreField = document.getElementById("score-content");
    scoreField.innerHTML = currentScore;
    // main();
}

var gameStarted = false;
var demoStarted = false;
var gameEnded = false;

// CONSTANTS
// Single cube (of which each shape is constructed) size
const singleSquareS = 10;
// Playground size NxNxN
const playCubeS = 110;
// Floor grid squares number
const gridSqNum = 11;
let sideLimit = playCubeS - (singleSquareS / 2);
const cylRad = (Math.sqrt(2) * 8) / 2;

function changeCubesColor(singleCube, newColor) {
    if (singleCube.children.length == 0) {
        singleCube.material.color.setHex(newColor);
    } else {
        singleCube.children.forEach(element => changeCubesColor(element, newColor));
    }
}

function createSingleCube() {

    let exGroup = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(cylRad, cylRad - 1, 1, 4);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0x072534,
        flatShading: true
    });
    const ex1 = new THREE.Mesh(geometry, material);
    ex1.rotateY(Math.PI / 4);

    let ex2 = ex1.clone();
    let ex3 = ex1.clone();
    let ex4 = ex1.clone();
    let ex5 = ex1.clone();
    let ex6 = ex1.clone();
    ex1.position.set(0, -4.5, 0);

    let ex2Group = new THREE.Group();
    let ex3Group = new THREE.Group();
    let ex4Group = new THREE.Group();
    let ex5Group = new THREE.Group();
    let ex6Group = new THREE.Group();
    ex2Group.add(ex2);
    ex2Group.rotateX(Math.PI);
    ex2Group.position.set(0, 4.5, 0);

    ex3.position.set(0, 0.5, 0);
    ex3Group.add(ex3);
    ex3Group.rotateZ(Math.PI / 2);
    ex3Group.position.set(5, 0, 0);

    ex4.position.set(0, 0.5, 0);
    ex4Group.add(ex4);
    ex4Group.rotateZ(-Math.PI / 2);
    ex4Group.position.set(-5, 0, 0);

    ex5.position.set(0, 0.5, 0);
    ex5Group.add(ex5);
    ex5Group.rotateX(-Math.PI / 2);
    ex5Group.position.set(0, 0, 5);

    ex6.position.set(0, 0.5, 0);
    ex6Group.add(ex6);
    ex6Group.rotateX(Math.PI / 2);
    ex6Group.position.set(0, 0, -5);

    exGroup.add(ex1);
    exGroup.add(ex2Group);
    exGroup.add(ex3Group);
    exGroup.add(ex4Group);
    exGroup.add(ex5Group);
    exGroup.add(ex6Group);

    return exGroup;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; // Excluding max, including min
}

class PlayCube extends THREE.Group {
    constructor() {
        // PLAY CUBE
        super();
        let playCubeGeometry = new THREE.BoxGeometry(playCubeS, playCubeS, playCubeS);
        const playCubeEdges = new THREE.EdgesGeometry(playCubeGeometry);
        const playCubeLine = new THREE.LineSegments(playCubeEdges, new THREE.LineBasicMaterial({
            color: 0xffffff
        }));
        this.add(playCubeLine);

        // Grid helper
        // (size, divisions, colorCenterLine, colorGrid)
        const gridHelper = new THREE.GridHelper(playCubeS, gridSqNum, 0x0000ff, 0x808080);
        gridHelper.position.y = -playCubeS / 2;
        gridHelper.position.x = 0;
        this.add(gridHelper);

        this.position.set(playCubeS / 2, playCubeS / 2, playCubeS / 2);
        this.obstacleShapes = [];
        this.shapeConstructors = [LShape, ZShape, IShape, TShape];
        this.activeShape = new this.shapeConstructors[getRandomInt(0, this.shapeConstructors.length)];
        this.layerFilling = [];
    }
    switchShape() {
        // save active shape as obstacle
        this.obstacleShapes.push(this.activeShape);
        // save current shape's cubes coordinates
        this.activeShape.flushCubesFinalCoords();
        // distribute cubes coordinates among layers
        this.flushToLayerFilling();
        let removedCubesNum = this.removeFilledLayers();
        if (removedCubesNum > 0) {
            updateScore(removedCubesNum);
        }
        this.updateCubesFinalCoords();
        this.activeShape = undefined;
        // create new shape and add it as active
        this.activeShape = new this.shapeConstructors[getRandomInt(0, this.shapeConstructors.length)];
        this.activeShape.changeColor();
    }

    updateCubesFinalCoords() {
        this.obstacleShapes.forEach(shape => {
            shape.updateCubesFinalCoords();
        });
    }

    removeFilledLayers() {
        let fullLayerCubesNum = (playCubeS / singleSquareS) ** 2;
        let cubesRemoved = 0;
        for (let i = 0; i < this.layerFilling.length; i++) {
            let value = this.layerFilling[i];
            if (value.length == fullLayerCubesNum) {
                this.removeCubesFromPlayground(value);
                this.layerFilling.splice(i, 1);
                cubesRemoved += fullLayerCubesNum;
            }
        }
        return cubesRemoved;
    }
    removeCubesFromPlayground(cubesArray) {
        cubesArray.forEach(element => {
            element.parent.remove(element);
            // recycleCubes.push(element);
        });
    }
    //initially a map without any key is created
    addValueToLayersList(key, value) {
        //if the list is already created for the "key", then it uses it
        //else it creates new list for the "key" to store multiple values in it.
        this.layerFilling[key] = this.layerFilling[key] || [];
        this.layerFilling[key].push(value);
    }

    flushToLayerFilling() {
        this.activeShape.children.forEach(element => {
            let target = new THREE.Vector3();
            element.getWorldPosition(target);
            target.round();
            let layerNum = (target.y - 5) / 10;
            this.addValueToLayersList(layerNum, element);
        });
    }

    moveShapeDown() {
        if (!this.nowStop()) {
            this.activeShape.position.y -= this.activeShape.downStep;
            this.activeShape.updateMinY();
            this.activeShape.shapeMoves += 1;
            return true;
        } else {
            return false;
        }
    }
    nowStop() {
        if (this.activeShape.minY > 5) {
            // because of lazy evaluation we cant combine both conditions
            if (this.aboveObstacles()) {
                return true;
            }
            return false;
        } else {
            return true;
        }
    }
    aboveObstacles() {
        let target = new THREE.Vector3();
        if (this.obstacleShapes.length > 0) {
            let childrenLen = this.activeShape.children.length;
            for (let i = 0; i < childrenLen; i++) {
                this.activeShape.children[i].getWorldPosition(target);
                target.round();
                for (let j = 0; j < this.obstacleShapes.length; j++) {
                    let currFinalCordsArr = this.obstacleShapes[j].cubesFinalCoords;
                    for (let k = 0; k < currFinalCordsArr.length; k++) {
                        let yDiff = target.y - currFinalCordsArr[k].y;
                        if (target.x == currFinalCordsArr[k].x && target.z == currFinalCordsArr[k].z && (yDiff > 0 && yDiff <= 10)) {
                            return true
                        }
                    }
                }
            }
        }
        return false;
    }

    rotShapeQ() {
        this.activeShape.rotQ(this.obstacleShapes);
    }
    rotShapeE() {
        this.activeShape.rotE(this.obstacleShapes);
    }
    moveShapeRight() {
        this.activeShape.rightMove(this.obstacleShapes);
    }
    moveShapeLeft() {
        this.activeShape.leftMove(this.obstacleShapes);
    }
    moveShapeFwd() {
        this.activeShape.fwdMove(this.obstacleShapes);
    }
    moveShapeBwd() {
        this.activeShape.bwdMove(this.obstacleShapes);
    }
}

class MyShape extends THREE.Group {
    constructor() {
        super();
        this.downStep = 5;
        this.minY = playCubeS + 100;
        this.sideMoveStep = 10;
        this.position.set(playCubeS / 2, playCubeS - 5, playCubeS / 2);

        this.cubesFinalCoords = [];
        this.cubes = [];

        // can be static
        this.cubesColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFF00FF];
        this.cubes.push(createSingleCube());
        for (let i = 1; i < 4; i++) {
            this.cubes.push(this.cubes[0].clone());
        }
        this.shapeMoves = 0;

    }

    changeColor() {
        let randomColor = getRandomInt(0, 4);
        this.children.forEach(element => {
            changeCubesColor(element, this.cubesColors[randomColor]);
        });

    }

    rightMove(obstacleShapes) {
        let theClone = this.clone();
        theClone.position.x += this.sideMoveStep;
        if (!theClone.isInterfering(obstacleShapes) && !theClone.outOfBounds()) {
            this.position.x += this.sideMoveStep;
        }
    }

    leftMove(obstacleShapes) {
        let theClone = this.clone();
        theClone.position.x -= this.sideMoveStep;
        if (!theClone.isInterfering(obstacleShapes) && !theClone.outOfBounds()) {
            this.position.x -= this.sideMoveStep;
        }
    }
    fwdMove(obstacleShapes) {
        let theClone = this.clone();
        theClone.position.z += this.sideMoveStep;
        if (!theClone.isInterfering(obstacleShapes) && !theClone.outOfBounds()) {
            this.position.z += this.sideMoveStep;
        }
    }
    bwdMove(obstacleShapes) {
        let theClone = this.clone();
        theClone.position.z -= this.sideMoveStep;
        if (!theClone.isInterfering(obstacleShapes) && !theClone.outOfBounds()) {
            this.position.z -= this.sideMoveStep;
        }
    }

    updateCubesFinalCoords() {
        this.cubesFinalCoords = [];
        this.flushCubesFinalCoords();
    }

    flushCubesFinalCoords() {
        this.children.forEach(element => {
            let target = new THREE.Vector3();
            element.getWorldPosition(target);
            target.round();
            this.cubesFinalCoords.push(target);
        })
    }

    updateMinY() {
        let target = new THREE.Vector3();
        this.children.forEach(element => {
            element.getWorldPosition(target);
            target.round();
            if (target.y < this.minY) {
                this.minY = target.y;
            }
        });
    }

    outOfBounds() {
        let target = new THREE.Vector3();
        let childrenLen = this.children.length;
        for (let i = 0; i < childrenLen; i++) {
            this.children[i].getWorldPosition(target);
            target.round();
            if (target.x > sideLimit || target.x < 0 || target.z > sideLimit || target.z < 0 || target.y < 5) {
                return true;
            }
        }
        return false;
    }

    // out of bounds check irrespective of obstacles
    isInterfering(obstacleShapes) {
        let target = new THREE.Vector3();
        if (obstacleShapes.length > 0) {
            let childrenLen = this.children.length;
            for (let i = 0; i < childrenLen; i++) {
                this.children[i].getWorldPosition(target);
                target.round();
                for (let j = 0; j < obstacleShapes.length; j++) {
                    let currFinalCordsArr = obstacleShapes[j].cubesFinalCoords;
                    for (let k = 0; k < currFinalCordsArr.length; k++) {
                        if ((target.distanceTo(currFinalCordsArr[k]) < 10)) {
                            return true
                        }
                    }
                }
            }
        }
        return false;
    }
    // makeRotZ and makeRotY are implementet in children classes;
    // Rotation is made on a clone of the object. If after the clone rotation it interferes with some other shapes, rotation of the original object is not made. In the other case the rotation is performed on the original object as well.

    rotQ(obstacleShapes) {
        let theClone = this.clone();
        theClone.makeRotZ();
        if (theClone.isInterfering(obstacleShapes) || theClone.outOfBounds()) {
            return;
        } else {
            this.makeRotZ();
        }
    }
    rotE(obstacleShapes) {
        let theClone = this.clone();
        theClone.makeRotY();
        if (theClone.isInterfering(obstacleShapes) || theClone.outOfBounds()) {
            return;
        } else {
            this.makeRotY();
        }
    }
}

class IShape extends MyShape {
    constructor() {
        super();
        this.isVertical = true;
        this.horRotated = false;

        for (let i = 0; i < 4; i++) {
            this.cubes[i].position.set(0, -(singleSquareS * 1.5) + singleSquareS * i, 0);
            this.add(this.cubes[i]);
        }
    }
    makeOffset(theDirection) {
        this.children.forEach(element => {
            element.position.y += (singleSquareS / 2) * theDirection;
        });
    }
    // When "Q" is pressed - change position from horizonatal (default) to vertical
    makeRotZ() {
        if (this.isVertical == true) {
            this.rotateZ(Math.PI / 2);
            this.makeOffset(1);
            this.isVertical = false;
        } else {
            this.rotateZ(-Math.PI / 2);
            this.makeOffset(-1);
            this.isVertical = true;
        }
    }
    // When "E" is pressed - rotate around its vertical axis
    makeRotY() {
        if (this.isVertical == false && this.horRotated == false) {
            this.rotateX(Math.PI / 2);
            this.horRotated = true;
        } else if (this.isVertical == false) {
            this.rotateX(-Math.PI / 2);
            this.horRotated = false;
        }
    }
}

class LShape extends MyShape {
    constructor() {
        super();
        this.isVertical = true;
        this.horRotated = false;
        this.pUp = false;
        for (let i = 0; i < 3; i++) {
            this.cubes[i].position.set(0, -(singleSquareS) + singleSquareS * i, 0);
            this.add(this.cubes[i]);
        }
        //let lastCube = new THREE.Mesh(oneCubeGeometry, oneCubeMaterial);
        let lastCubeIdx = this.cubes.length - 1;
        this.cubes[lastCubeIdx].position.set(singleSquareS, singleSquareS, 0);
        this.add(this.cubes[lastCubeIdx]);
    }

    makeOffset(theDirection) {
        this.children.forEach(element => {
            element.position.x += (singleSquareS) * theDirection;
        });
    }
    // When "Q" is pressed - change position from horizonatal (default) to vertical
    makeRotZ() {
        if (this.isVertical == true) {
            this.rotateZ(Math.PI / 2);
            this.isVertical = false;
            if (this.pUp == false) {
                this.makeOffset(-1);
            } else {
                this.makeOffset(0);
            }

        } else {
            this.rotateZ(Math.PI / 2);
            this.isVertical = true;
            if (this.pUp == false) {
                this.makeOffset(1);
                this.pUp = true;
            } else {
                this.makeOffset(0);
                this.pUp = false;
            }
        }
    }
    // When "E" is pressed - rotate around its vertical axis
    makeRotY() {
        if (this.isVertical == false) {
            this.rotateX(Math.PI / 2);

        } else {
            this.rotateY(Math.PI / 2);
        }
    }
}

class TShape extends MyShape {
    constructor() {
        super();
        this.isVertical = false;
        this.reverse = 1;
        this.cubes[0].position.set(0, singleSquareS / 2, 0);
        this.cubes[1].position.set(-singleSquareS, singleSquareS / 2, 0);
        this.cubes[2].position.set(singleSquareS, singleSquareS / 2, 0);
        this.cubes[3].position.set(0, -singleSquareS / 2, 0);
        for (let i = 0; i < this.cubes.length; i++) {
            this.add(this.cubes[i]);
        }

    }
    makeOffset(theDirection) {
        this.children.forEach(element => {
            if (this.reverse > 0) {
                element.position.y -= (singleSquareS / 2) * theDirection;
            } else {
                element.position.y += (singleSquareS / 2) * theDirection;
            }
            element.position.x += (singleSquareS / 2) * theDirection;
        });
    }
    // When "Q" is pressed - change position from horizonatal (default) to vertical

    makeRotZ() {
        if (this.isVertical == false) {
            this.rotateZ(Math.PI / 2);
            this.makeOffset(this.reverse);
            this.isVertical = true;
        } else {
            this.rotateZ(Math.PI / 2);
            this.makeOffset(-this.reverse);
            this.isVertical = false;
            this.reverse = -this.reverse;
        }
    }
    // When "E" is pressed - rotate around its vertical axis
    makeRotY() {
        if (this.isVertical == false) {
            this.rotateY(Math.PI / 2);
        } else {
            this.rotateX(Math.PI / 2);
        }
    }
}

class ZShape extends MyShape {

    constructor() {
        super();
        this.isVertical = false;
        let cubesNumber = 4;
        this.cubes[0].position.set(0, singleSquareS / 2, 0);
        this.cubes[1].position.set(-singleSquareS, singleSquareS / 2, 0);
        this.cubes[2].position.set(0, -singleSquareS / 2, 0);
        this.cubes[3].position.set(singleSquareS, -singleSquareS / 2, 0);
        // add cubes to the group
        for (let i = 0; i < cubesNumber; i++) {
            this.add(this.cubes[i]);
        }
    }
    makeOffset(theDirection) {
        this.children.forEach(element => {
            element.position.y -= (singleSquareS / 2) * theDirection;
            element.position.x += (singleSquareS / 2) * theDirection;
        });
    }
    // When "Q" is pressed - change position from horizonatal (default) to vertical
    // when position is changed - there is a need to make an axis offset to make cubes fit the grid.
    // To achieve that we are moving each cube's position by half of its size forward and up, leaving the group axis unchanged

    makeRotZ() {
        if (this.isVertical == false) {
            this.makeOffset(1);
            this.rotateZ(Math.PI / 2);
            this.isVertical = true;
        } else {
            this.makeOffset(-1);
            this.rotateZ(-Math.PI / 2);
            this.isVertical = false;
        }
    }
    // When "E" is pressed - rotate around its vertical axis
    makeRotY() {
        if (this.isVertical == false) {
            this.rotateY(Math.PI / 2);
        } else {
            this.rotateX(Math.PI / 2);
        }
    }
}

class demoLayer extends MyShape {
    constructor() {
        super();
        this.position.set((playCubeS / 2) + 5, playCubeS - 5, (playCubeS / 2) + 5);
        let startX = -(playCubeS / 2);
        let startZ = -(playCubeS / 2);
        let centerCubeIndex = playCubeS / 2; //55
        for (let i = 0; i < 3; i++) {
            this.cubes.pop();
        }

        for (let i = startX; i < (-startX); i += 10) {
            for (let j = startZ; j < (-startZ); j += 10) {
                this.cubes.push(this.cubes[0].clone());
                this.cubes[this.cubes.length - 1].position.set(i, 0, j);
            }
        }
        this.cubes.splice(centerCubeIndex, 1);
        for (let i = 1; i < this.cubes.length; i++) {
            this.add(this.cubes[i]);
        }
    }
}


function main() {
    let menuItem = document.getElementById("main-menu-btn");
    menuItem.onclick = startGame;
    menuItem = document.getElementById("game-menu-btn");
    menuItem.onclick = stopGame;
    menuItem = document.getElementById("gover-menu-btn");
    menuItem.onclick = stopGame;
    menuItem = document.getElementById("main-menu-demo-btn");
    menuItem.onclick = demoGame;

    const canvas = document.querySelector('#canva');
    const renderer = new THREE.WebGLRenderer({
        canvas
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 40;
    const aspect = window.innerWidth / window.innerHeight; // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    let cameraGroup = new THREE.Group();
    let cameraGroupClone = cameraGroup.clone();
    let cameraStopPoint = new THREE.Group();
    cameraGroupClone.add(cameraStopPoint);
    cameraGroup.add(camera);
    cameraGroup.position.set(playCubeS / 2, 0, playCubeS / 2);
    cameraGroupClone.position.set(playCubeS / 2, 0, playCubeS / 2);

    camera.position.set(0, 55, 220);
    cameraStopPoint.position.set(0, 55, 220);

    const scene = new THREE.Scene();
    scene.add(cameraGroup);

    // DIRECTIONAL LIGHT
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(50, 50, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.bottom = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.updateProjectionMatrix();
    scene.add(light);

    // SPHERE LIGHT
    const lightGroup = new THREE.Group();

    const sphere = new THREE.SphereGeometry(0.5, 16, 8);
    const light1 = new THREE.PointLight(0xff0040, 12, 50);
    light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
        color: 0xff0040
    })));
    lightGroup.add(light1);

    const light2 = new THREE.PointLight(0x0040ff, 12, 50);
    light2.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
        color: 0x0040ff
    })));
    lightGroup.add(light2);

    const light3 = new THREE.PointLight(0x80ff80, 12, 50);
    light3.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
        color: 0x80ff80
    })));
    lightGroup.add(light3);

    const light4 = new THREE.PointLight(0xffaa00, 12, 50);
    light4.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
        color: 0xffaa00
    })));
    lightGroup.add(light4);


    // PLAY CUBE
    let playCube = new PlayCube();
    playCube.add(lightGroup);
    scene.add(playCube);

    renderer.render(scene, camera);

    // Keyboard service
    let key = [];
    let keyHard;
    document.addEventListener("keydown", function(event) {
        key[event.keyCode] = true;
        keyHard = event.keyCode;
    });
    document.addEventListener("keyup", function(event) {
        key[event.keyCode] = false;
    });

    //let activeShape = someShape;
    //activeShape.sayHi();
    // left, up, right, down

    var movementKeys = [37, 38, 39, 40];

    function keyboard() {
        // up arrow key
        if (keyHard == movementKeys[1]) {
            playCube.moveShapeBwd();
            console.log(movementKeys);
            keyHard = 0;
        }
        // down arrow key
        if (keyHard == movementKeys[3]) {
            playCube.moveShapeFwd();
            keyHard = 0;
        }
        // left arrow key
        if (keyHard == movementKeys[0]) {
            playCube.moveShapeLeft();
            keyHard = 0;
        }
        // right arrow key
        if (keyHard == movementKeys[2]) {
            playCube.moveShapeRight();
            keyHard = 0;
        }
        // Q key
        if (keyHard == 81) {
            playCube.rotShapeQ();
            keyHard = 0;
        }
        // E key
        if (keyHard == 69) {
            playCube.rotShapeE();
            keyHard = 0;
        }
        // F key
        if (keyHard == 70) {
            playCube.moveShapeDown();
            keyHard = 0;
        }
        // C key
        if (keyHard == 67) {
            let stopPoint = rotateCamClone();
            rotateCamera(stopPoint);
            movementKeys.push(movementKeys.shift());
            keyHard = 0;
        }

    }
    let id;

    function rotateCamClone() {
        cameraGroupClone.rotation.y += (Math.PI / 2);
        let camStopPoint = new THREE.Vector3();
        cameraStopPoint.getWorldPosition(camStopPoint);
        camStopPoint.round();
        return camStopPoint;
    }

    function rotateCamera(camStopPoint) {
        id = requestAnimationFrame(function() {
            return rotateCamera(camStopPoint)
        });
        let camCurrPos = new THREE.Vector3();
        camera.getWorldPosition(camCurrPos);
        camCurrPos.round();
        cameraGroup.rotation.y += (Math.PI / 64);
        camera.getWorldPosition(camCurrPos);
        camCurrPos.round();
        if ((camCurrPos.x == camStopPoint.x) || (camCurrPos.z == camStopPoint.z)) {
            cancelAnimationFrame(id);
        }
        renderer.render(scene, camera);
    }
    const clock = new THREE.Clock();
    let secsPassed;
    let secsPrev;
    if (gameStarted == true) {
        clock.start();
        secsPassed = clock.getElapsedTime();
        secsPrev = secsPassed;
        if (demoStarted == true) {
            playCube.activeShape = new demoLayer();
            demoStarted = false;
        }
        scene.add(playCube.activeShape);
    }

    function animate() {
        requestAnimationFrame(animate);
        secsPassed = Math.floor(clock.getElapsedTime() * 2);
        keyboard();
        if ((secsPassed > secsPrev)) {
            secsPrev = secsPassed;
            if (playCube.moveShapeDown()) {} else {
                if (playCube.activeShape.shapeMoves == 0) {
                    gameOver();
                } else {
                    playCube.switchShape();
                    scene.add(playCube.activeShape);
                }
            }
        }

        // Ligth animation
        lightsUpdate();

        renderer.render(scene, camera);
    }
    if (gameStarted == true) {
        animate();
    }

    // let testTime = Date.now() * 0.0005;

    function lightsUpdate() {
        let radius = 30;

        const time = Date.now() * 0.0005;
        // const delta = clock.getDelta();

        light1.position.x = Math.sin(time * 0.7) * radius;
        light1.position.y = Math.cos(time * 0.5) * radius;
        light1.position.z = Math.cos(time * 0.3) * radius;

        light2.position.x = Math.cos(time * 0.3) * radius;
        light2.position.y = Math.sin(time * 0.5) * radius;
        light2.position.z = Math.sin(time * 0.7) * radius;

        light3.position.x = Math.sin(time * 0.7) * radius;
        light3.position.y = Math.cos(time * 0.3) * radius;
        light3.position.z = Math.sin(time * 0.5) * radius;

        light4.position.x = Math.sin(time * 0.3) * radius;
        light4.position.y = Math.cos(time * 0.7) * radius;
        light4.position.z = Math.sin(time * 0.5) * radius;

    }
}

main();
