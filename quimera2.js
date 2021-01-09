import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

import { TrackballControls } from './node_modules/three/examples/jsm/controls/TrackballControls.js';
import { FlyControls } from './node_modules/three/examples/jsm/controls/FlyControls.js';
import { RectAreaLightUniformsLib } from './node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from './node_modules/three/examples/jsm/helpers/RectAreaLightHelper.js';




let perspectiveCamera, controls, flyControls, scene, renderer;

const fov = 40;
const near = 0.1;
const far = 1000;

const mainColor = '#F3B05A';

const clock = new THREE.Clock();

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
		const planeMat = new THREE.MeshPhongMaterial({
			side: THREE.DoubleSide,
			color: 'grey'
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
				if(keyName === 'p') {
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

	// Ambient Light
	{
		const ambient = new THREE.AmbientLight(mainColor, .25);
		scene.add(ambient);
	}

	// Directional Light
	{
		const light = new THREE.DirectionalLight(mainColor, 1.5);
		light.castShadow = true;
		light.position.set(0, 5, 4);
		light.target.position.set(0, 0, 100);
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		scene.add(light);
		scene.add(light.target);

		const cam = light.shadow.camera;
		cam.near = 0;
		cam.far = 100;
		cam.left = -40;
		cam.right = 40;
		cam.top = 20;
		cam.bottom = -20;

		//const cameraHelper = new THREE.CameraHelper(light2.shadow.camera);
		//scene.add(cameraHelper);
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

	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
	renderer.shadowMap.enabled = true;

	// CONTROLS
	createControls(perspectiveCamera);
}

function createControls(camera) {

	flyControls = new FlyControls(camera, renderer.domElement);
	
	

}

function onWindowResize() {

	const aspect = window.innerWidth / window.innerHeight;

	perspectiveCamera.aspect = aspect;
	perspectiveCamera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	

}

function animate() {

	const delta = clock.getDelta();

	requestAnimationFrame(animate);
	
	
	flyControls.update(delta);
	render();

}

function render() {

	const camera = perspectiveCamera;

	renderer.render(scene, camera);

}
