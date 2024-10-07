import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';



class Orbit {
    constructor(xRadius, yRadius, xPos, yPos, zPos) {
        this.ORBIT_POINTS = 128;
        this.ORBIT_COLOR = 0x333333;
        this.xRadius = xRadius;
        this.yRadius = yRadius;
        this.xPos = xPos;
        this.yPos = yPos;
        this.zPos = zPos;
    }
    init() {
        const curve = new THREE.EllipseCurve(0, 0, this.xRadius, this.yRadius, 0, d2r(360), false, 0);
        const points = curve.getPoints(this.ORBIT_POINTS);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        geometry.rotateX(d2r(90));

        const material = new THREE.LineBasicMaterial({color: this.ORBIT_COLOR});
        const object = new THREE.Line(geometry, material);
        this.object = object;
        this.setPos(this.xPos, this.yPos, this.zPos);
    }
    setPos(x, y, z) {
        this.xPos = x;
        this.yPos = x;
        this.zPos = z;
        this.object.position.set(x, y, z);
    }
}

class CelestialObject {
    constructor(modelPath, texturePath, radius, xPos, yPos, zPos, tiltAngle, yRotSpd, name) {
        this.modelPath = modelPath;
        this.texturePath = texturePath;
        this.radius = radius;
        this.xPos = xPos;
        this.yPos = yPos;
        this.zPos = zPos;
        this.tiltAngle = d2r(tiltAngle);
        this.yRotSpd = d2r(yRotSpd);
        this.name = name;
    }
    rotAnimation = () => {
        this.object.rotation.y += this.yRotSpd;
        requestAnimationFrame(this.rotAnimation);
    }
    init() {
        var that = this;

        const texture = textureLoader.load(this.texturePath)
        objLoader.load(
	        this.modelPath,
	        function (object) {
                object.traverse(function(child) {
                    if (child.isMesh) child.material.map = texture;
                });
                object.scale.set(that.radius, that.radius, that.radius);
                object.rotation.x = that.tiltAngle;
                object.name = that.name;
                that.object = object;
                that.setPos(that.xPos, that.yPos, that.zPos);
                scene.add(that.object);
                that.rotAnimation();
                console.log('Object loaded');
                that.setName();
	        },
	        function (xhr) { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); },
	        function (error) { console.log('An error happened during object loading: ' + error); }
        );
    }
    setPos(x, y, z) {
        this.xPos = x;
        this.yPos = x;
        this.zPos = z;
        this.object.position.set(x, y, z);
    }
    setName() {
        this.object.name = "feww";
    }
}

class Planet extends CelestialObject {
    constructor(modelPath, texturePath, radius, xPos, yPos, zPos, tiltAngle, yRotSpd, xMovSpd, yMovSpd, xRadiusOrb, yRadiusOrb, tiltOrb, name) {
        super(modelPath, texturePath, radius, xPos, yPos, zPos, tiltAngle, yRotSpd, name);
        this.xMovSpd = d2r(xMovSpd);
        this.yMovSpd = d2r(yMovSpd);
        this.orbit = new Orbit(xRadiusOrb, yRadiusOrb, xPos, yPos, zPos);
        this.tiltOrb = d2r(tiltOrb);
        this.orbitAngle = 0;
    }
    rotAnimation = () => {
        requestAnimationFrame(this.rotAnimation);
        this.object.rotation.y += this.yRotSpd;
        this.orbitAngle += Math.abs(this.xMovSpd * Math.cos(this.orbitAngle)) + Math.abs(this.yMovSpd * Math.sin(this.orbitAngle));
        super.setPos(
            this.orbit.xRadius * Math.cos(this.orbitAngle),
            this.object.position.y,
            this.orbit.yRadius * Math.sin(this.orbitAngle)
        );
    }
    init() {
        var that = this;

        this.orbit.init();
        this.orbit.object.rotation.z = this.tiltOrb;

        const texture = textureLoader.load(this.texturePath)
        objLoader.load(this.modelPath, (object) => {
                object.traverse(function(child) {
                    if (child.isMesh) child.material.map = texture;
                });
                object.scale.set(that.radius, that.radius, that.radius);
                object.rotation.x = that.tiltAngle;
                that.orbit.object.add(object);
                object.name = that.name;
                that.object = object;
                that.setPos(that.xPos, that.yPos, that.zPos);
                scene.add(that.orbit.object);
                that.rotAnimation();
                console.log('Object loaded');
	        },
	        function (xhr) { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); },
	        function (error) { console.log('An error happened during object loading: ' + error); }
        );
    }
    setPos(x, y, z) {
        this.xPos = x;
        this.yPos = x;
        this.zPos = z;
        this.orbit.setPos(x, y, z);
    }
}

class PlanetSatelite extends Planet {
    constructor(modelPath, texturePath, radius, xPos, yPos, zPos, tiltAngle, yRotSpd, xMovSpd, yMovSpd, xRadiusOrb, yRadiusOrb, tiltOrb, satelite) {
        super(modelPath, texturePath, radius, xPos, yPos, zPos, tiltAngle, yRotSpd, xMovSpd, yMovSpd, xRadiusOrb, yRadiusOrb, tiltOrb);
        this.satelite = satelite;
    }
    satelitePosUpdate = () => {
        requestAnimationFrame(this.satelitePosUpdate);
        this.satelite.setPos(this.xPos, 0, this.zPos); // #TOFIX: y bias
    }
    init() {
        super.init();
        this.satelite.init();
        this.satelitePosUpdate();
    }
    setPos(x, y, z) {
        super.setPos(x, y, z);
        this.satelite.setPos(x, y, z);
    }
}



function d2r(degrees) {
    return degrees * (Math.PI / 180);
}

function animate() {
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
};



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10000);
camera.position.set(0, 0, 5);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector("#container").appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0, 0 );
controls.update();
controls.enablePan = true;
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0x888888, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 0).normalize();
scene.add(directionalLight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const textureLoader = new THREE.TextureLoader();
const objLoader = new OBJLoader();

const skyTexture = textureLoader.load('public/images/skybox.exr'); // Your single skybox image

// Create a sphere geometry for the skybox
const skySphereGeometry = new THREE.SphereGeometry(500, 60, 40); // A large sphere to surround the scene
skySphereGeometry.rotateX(d2r(90));

// Create a material using the loaded texture
const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide // Render the inside of the sphere
});

// Create the sky sphere mesh
const skySphere = new THREE.Mesh(skySphereGeometry, skyMaterial);
//scene.add(skySphere);


/*
const bar = new Planet(
    "public/models/moon.obj", "public/images/moon.jpg",
    0.5,         // radius
    0, 0, 0,   // xyz pos
    25,        // tiltAngle
    1,         // yRotSpd
    0.1, 0.1,      // xy MovSpd
    5, 5,      // xy orbit radius 
    0          // orb tilt
);
const foo = new PlanetSatelite(
    "public/models/moon.obj", "public/images/moon.jpg",
    1,         // radius
    0, 0, 0,   // xyz pos
    25,        // tiltAngle
    1,         // yRotSpd
    0.1, 0.1,      // xy MovSpd
    10, 10,      // xy orbit radius 
    0,         // orb tilt
    bar        // satelite
);
foo.init();
*/

const C = 100;

const sun = new CelestialObject(
    "public/models/sun.obj", "public/images/sun.jpg",
    0.7*200,
    0, 85, 0,
    7.25,
    0.000003*C*C*5,
    "sun"
);
sun.init();

const mercury = new Planet(
    "public/models/mercury.obj", "public/images/mercury.jpg",
    0.003*C*50,         // radius
    0, 0, 0,   // xyz pos
    0,        // tiltAngle
    0.0000015*C*C,         // yRotSpd
    0.0000474*10000, 0.0000474*10000,      // xy MovSpd
    58+200, 56+200,      // xy orbit radius 
    7,
    "mercury"          // orb tilt
);
mercury.init();

const venus = new Planet(
    "public/models/venus.obj", "public/images/venus.jpg",
    0.006*C*50,         // radius
    0, 0, 0,   // xyz pos
    177,        // tiltAngle
    0,         // yRotSpd
    0.00002*10000, 0.00002*10000,      // xy MovSpd
    108+300, 108+300,      // xy orbit radius 
    3.39,
    "venus"          // orb tilt
);
venus.init();

const earth = new Planet(
    "public/models/earth.obj", "public/images/earth.jpg",
    0.006*C*100,         // radius
    0, 0, 0,   // xyz pos
    23.5,        // tiltAngle
    0.004*C,         // yRotSpd
    0.0000114*10000, 0.0000114*10000,      // xy MovSpd
    150+400, 150+400,      // xy orbit radius 
    0,
    "earth"          // orb tilt
);
earth.init();

const mars = new Planet(
    "public/models/mars.obj", "public/images/mars.jpg",
    0.003*C*100,         // radius
    0, 0, 0,   // xyz pos
    25,        // tiltAngle
    0.004*C*10,         // yRotSpd
    0.00000606*10000, 0.00000606*10000,      // xy MovSpd
    227.9+700, 227.9+700,      // xy orbit radius 
    2,
    "mars"          // orb tilt
);
mars.init();

const jupiter = new Planet(
    "public/models/jupiter.obj", "public/images/jupiter.jpg",
    0.070*C*10,         // radius
    0, 0, 0,   // xyz pos
    3,        // tiltAngle
    0.004*4*C,         // yRotSpd
    0.000000962*30000, 0.000000962*30000,      // xy MovSpd
    778+400, 778+400,      // xy orbit radius 
    1.31,
    "jupiter"          // orb tilt
);
jupiter.init();

const saturn = new Planet(
    "public/models/saturn.obj", "public/images/saturn.jpg",
    0.058*C,         // radius
    0, 0, 0,   // xyz pos
    26.7,        // tiltAngle
    0.004*2.5*50,         // yRotSpd
    0.000000905*10000, 0.000000905*10000,      // xy MovSpd
    1429+300, 1429+300,      // xy orbit radius 
    2.49,
    "saturn"          // orb tilt
);
saturn.init();

const uranus = new Planet(
    "public/models/uranus.obj", "public/images/uranus.jpg",
    0.025*C*10,         // radius
    0, 0, 0,   // xyz pos
    97.77,        // tiltAngle
    0.003*C*2,         // yRotSpd
    0.000000213*10000, 0.000000213*10000,      // xy MovSpd
    2871-700, 2871-700,      // xy orbit radius 
    0.77,
    "uranus"          // orb tilt
);
uranus.init();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// As

// Add an event listener for mouse clicks
window.addEventListener('pointerdown', onMouseClick, false);

function hideAll(except) {
    const earth_ = document.querySelector("#earth");
    if (except != "earth") {
        earth_.classList.add("move-down");
        setTimeout(() => {
            earth_.hidden = true;
            earth_.classList.remove("move-down");
        }, 250);
    }
    
    const sun_ = document.querySelector("#sun");
    if (except != "sun") {
        sun_.classList.add("move-down");
        setTimeout(() => {
            sun_.hidden = true;
            sun_.classList.remove("move-down");
        }, 250);
    }

    const jupiter_ = document.querySelector("#jupiter");
    if (except != "jupiter") {
        jupiter_.classList.add("move-down");
        setTimeout(() => {
            jupiter_.hidden = true;
            jupiter_.classList.remove("move-down");
        }, 250);
    }

    const mars_ = document.querySelector("#mars");
    if (except != "mars") {
        mars_.classList.add("move-down");
        setTimeout(() => {
            mars_.hidden = true;
            mars_.classList.remove("move-down");
        }, 250);
    }

    const mercury_ = document.querySelector("#mercury");
    if (except != "mercury") {
        mercury_.classList.add("move-down");
        setTimeout(() => {
            mercury_.hidden = true;
            mercury_.classList.remove("move-down");
        }, 250);
    }

    const saturn_ = document.querySelector("#saturn");
    if (except != "saturn") {
        saturn_.classList.add("move-down");
        setTimeout(() => {
            saturn_.hidden = true;
            saturn_.classList.remove("move-down");
        }, 250);
    }

    const uranus_ = document.querySelector("#uranus");
    if (except != "uranus") {
        uranus_.classList.add("move-down");
        setTimeout(() => {
            uranus_.hidden = true;
            uranus_.classList.remove("move-down");
        }, 250);
    }

    const venus_ = document.querySelector("#venus");
    if (except != "venus") {
        venus_.classList.add("move-down");
        setTimeout(() => {
            venus_.hidden = true;
            venus_.classList.remove("move-down");
        }, 250);
    }
}

function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        // If there is an intersection, do something with the intersected object
        const clickedObject = intersects[0].object.name;
        const objElem = document.querySelector("#"+clickedObject);
        if (objElem.hidden) {
            hideAll(clickedObject);
            objElem.classList.add("move-up");
            objElem.hidden = false;
            setTimeout(() => {
                objElem.classList.remove("move-up");
              }, 250);
        }
        else {
            objElem.classList.add("move-down");
            setTimeout(() => {
                objElem.hidden = true;
                objElem.classList.remove("move-down");
            }, 250);
        }
    }
}

/*
const neptune = new Planet(
    "public/models/moon.obj", "public/images/moon.jpg",
    0.024,         // radius
    0, 0, 0,   // xyz pos
    28,        // tiltAngle
    0.0015,         // yRotSpd
    0.000000172, 0.000000172,      // xy MovSpd
    4495, 4495,      // xy orbit radius 
    1.77          // orb tilt
);
neptune.init();*/



animate();