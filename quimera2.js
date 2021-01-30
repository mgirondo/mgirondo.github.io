import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from './node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from './node_modules/three/examples/jsm/helpers/RectAreaLightHelper.js';

import { PointerLockControls } from './node_modules/three/examples/jsm/controls/PointerLockControls.js';


const mainColor = '#F3B05A';
const floor = {
	color: '#e7e7e7',
	metalness: .778,
	roughness: 0.5,
}

const torus = {
	color: '#aeccdb - #c1b98c' // degradado de cerca a lejos
}

/////////////////////////

let perspectiveCamera, controls, scene, renderer;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();






// TODO: Poner arboles alrededor del pasillo



init();
animate();

function init() {

	RectAreaLightUniformsLib.init();

	const aspect = window.innerWidth / window.innerHeight;

	const loader = new GLTFLoader();

	loader.load('./models/quimeraScene.glb', function (gltf) {
		let quimeraScene = gltf.scene;

		scene.add(quimeraScene);
		quimeraScene.traverse((obj) => {
			if (obj.castShadow !== undefined) {
				obj.castShadow = true;
				obj.receiveShadow = true;
			}
		});
	}, undefined, function (error) {
		console.error(error);
	});


	// CAMERA
	const fov = 40;
	const near = 0.1;
	const far = 1000;
	perspectiveCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	perspectiveCamera.position.set(0, 0, 125);

	// SCENE
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#000000')
	scene.fog = new THREE.Fog('#000000', 10, 500)

	// GROUND
	{
		const planeSize = 1000;

		const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
		const planeMat = new THREE.MeshStandardMaterial({
			side: THREE.DoubleSide,
			color: floor.color,
			roughness: floor.roughness,
			metalness: floor.metalness

		});
		const mesh = new THREE.Mesh(planeGeo, planeMat);
		mesh.receiveShadow = true;
		mesh.rotation.x = Math.PI * -.5;
		mesh.position.set(0, -12, 0);
		scene.add(mesh);
	}

	// CUBE
	{

		const rectangleHeight = 40;
		const rectangleWidth = 60;

		let rectangleShape = new THREE.Shape()
			.moveTo(0, 0)
			.lineTo(0, rectangleHeight)
			.lineTo(rectangleWidth, rectangleHeight)
			.lineTo(rectangleWidth, 0)
			.lineTo(0, 0);

		const extrudeSettings = { depth: 2, bevelEnabled: false };

		// Door wall
		{

			const doorShape = new THREE.Shape()
				.moveTo(rectangleWidth * 0.4, 0)
				.lineTo(rectangleWidth * 0.4, rectangleHeight * 0.5)
				.lineTo(rectangleWidth * 0.6, rectangleHeight * 0.5)
				.lineTo(rectangleWidth * 0.6, 0)
				.lineTo(0, 0)

			rectangleShape.holes.push(doorShape);

			const geometry = new THREE.ExtrudeBufferGeometry(rectangleShape, extrudeSettings);

			const color = 'black';

			let mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: color }));
			mesh.position.set(-30, -12, -5)
			scene.add(mesh);

			rectangleShape.holes.splice(0, 1);
		}

		// Other walls
		{

			let video = document.getElementById('video');

			document.addEventListener('keydown', (event) => {
				const keyName = event.key;
				if (keyName === 'p') {
					video.play();
				}
			})

			let texture = new THREE.VideoTexture(video);

			const parameters = { color: 0xffffff, map: texture, side: THREE.DoubleSide };

			const geometry = new THREE.PlaneBufferGeometry(60, 40);
			const material = new THREE.MeshBasicMaterial(parameters);

			let wallWest = new THREE.Mesh(geometry, material);
			wallWest.position.set(-30, 8, -35);
			wallWest.rotation.y = Math.PI / 2;
			scene.add(wallWest);
			let wallNorth = new THREE.Mesh(geometry, material);
			wallNorth.position.set(0, 8, -65);
			scene.add(wallNorth);
			let wallEast = new THREE.Mesh(geometry, material);
			wallEast.position.set(30, 8, -35);
			wallEast.rotation.y = Math.PI / 2;
			scene.add(wallEast);

		}
	}


	/**LIGHTS**/

	// Point Light - para luz ambiente
	{
		const pointLight = new THREE.PointLight('#ffffff', 1, 0, 2);
		pointLight.position.set(0, 30, 50);
		pointLight.castShadow = true;
		scene.add(pointLight);
		// so we can easily see where the point light is
		const helper = new THREE.PointLightHelper(pointLight);
		scene.add(helper);
	}

	// Spot light - para luz del torus
	{
		const spotLight = new THREE.SpotLight(mainColor, 1);
		spotLight.castShadow = true;
		spotLight.position.set(0, 10, 0);
		spotLight.target.position.set(0, 0, 50);
		spotLight.penumbra = 10;
		scene.add(spotLight);
		scene.add(spotLight.target);
	}


	// Ambient Light - sustituido por luz direccional desde arriba
	{
		// const ambient = new THREE.DirectionalLight('#ffffff', 1);
		// ambient.castShadow = true;
		// ambient.position.set(0, 50, 50);
		// ambient.target.position.set(0, 0, 50);
		// ambient.shadow.mapSize.width = 2048;
		// ambient.shadow.mapSize.height = 2048;
		// scene.add(ambient);
		// scene.add(ambient.target);

		// const ambientCam = ambient.shadow.camera;
		// ambientCam.near = 0;
		// ambientCam.far = 100;
		// ambientCam.left = -40;
		// ambientCam.right = 40;
		// ambientCam.top = 40;
		// ambientCam.bottom = -40;

		// const cameraHelper = new THREE.CameraHelper(ambient.shadow.camera);
		// scene.add(cameraHelper);


	}

	// Directional Light
	{
		// const light = new THREE.DirectionalLight('#ffffff', 1.5);
		// light.castShadow = true;
		// light.position.set(1, 1, 4);
		// light.target.position.set(0, 0, 100);
		// light.shadow.mapSize.width = 2048;
		// light.shadow.mapSize.height = 2048;
		// scene.add(light);
		// scene.add(light.target);

		// const cam = light.shadow.camera;
		// cam.near = 0;
		// cam.far = 200;
		// cam.left = -40;
		// cam.right = 40;
		// cam.top = 20;
		// cam.bottom = -20;

		// const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
		// scene.add(cameraHelper);
	}

	// RectAreaLight
	{
		const color = mainColor;
		const intensity = 15;
		const width = 25;
		const height = 25;
		const light = new THREE.RectAreaLight(color, intensity, width, height);

		scene.add(light);
	}

	// CONTROLS
	createControls(perspectiveCamera);

	// RAYCASTER
	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
	renderer.shadowMap.enabled = true;



}

function createControls(camera) {

	controls = new PointerLockControls(camera, document.body);
	scene.add(controls.getObject());

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera.aspect = aspect;
	perspectiveCamera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);



}

function animate() {


	requestAnimationFrame(animate);

	const time = performance.now();

	if (controls.isLocked) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;
		raycaster.ray.origin.z -= 10;
		raycaster.ray.origin.x -= 10;

	}


	controls.update();
	render();

}

function render() {

	const camera = perspectiveCamera;

	renderer.render(scene, camera);

}

const onKeyDown = function (event) {

	switch (event.code) {

		case 'ArrowUp':
		case 'KeyW':
			moveForward = true;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = true;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = true;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = true;
			break;

		case 'Space':
			if (canJump === true) velocity.y += 350;
			canJump = false;
			break;

	}

};

const onKeyUp = function (event) {

	switch (event.code) {

		case 'ArrowUp':
		case 'KeyW':
			moveForward = false;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = false;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = false;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = false;
			break;

	}

};




