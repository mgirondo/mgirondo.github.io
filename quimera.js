import * as THREE from './node_modules/three/build/three.module.js';

import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';

import { TrackballControls } from './node_modules/three/examples/jsm/controls/TrackballControls.js';

import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

let perspectiveCamera, orthographicCamera, controls, scene, renderer, stats;

const params = {
    orthographicCamera: false
};

const frustumSize = 400;

init();
animate();

function init() {

    const aspect = window.innerWidth / window.innerHeight;

    const loader = new GLTFLoader();

    for (let i = 0; i < 50; i += 10) {
        loader.load('./models/scene.gltf', function (gltf) {

            let model1 = gltf.scene;
            model1.position.z = i;
            scene.add(model1);
            
        }, undefined, function (error) {

            console.error(error);

        })
        loader.load('./models/scene.gltf', function (gltf) {

            
            let model2 = gltf.scene;
            model2.position.z = i;
            model2.position.x = 10;
            scene.add(model2);

        }, undefined, function (error) {

            console.error(error);

        })
        
        
    }

    loader.load('./models/silla.glb', function (gltf) {

            
        let model3 = gltf.scene;
        model3.position.z = 450;
        model3.position.y = 0;
        scene.add(model3);

    }, undefined, function (error) {

        console.error(error);

    })
    

    perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 1, 1000000);
    perspectiveCamera.position.z = 40;
    perspectiveCamera.position.y = 1;
    perspectiveCamera.position.x = 5;

    // world

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    //scene.fog = new THREE.Fog('grey', 1, 10)
    

    // lights

    const dirLight1 = new THREE.DirectionalLight(0xffffff);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    // const dirLight2 = new THREE.DirectionalLight(0x002288);
    // dirLight2.position.set(- 1, - 1, - 1);
    // scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);

    // renderer

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //

    window.addEventListener('resize', onWindowResize, false);

    createControls(perspectiveCamera);

}

function createControls(camera) {

    controls = new TrackballControls(camera, renderer.domElement);

    controls.rotateSpeed = 5;
    controls.zoomSpeed = 0.25;
    controls.panSpeed = 0.8;
    controls.target = new THREE.Vector3(5, 1, 0);

    controls.keys = [65, 83, 68];

}

function onWindowResize() {

    const aspect = window.innerWidth / window.innerHeight;

    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();

}

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    render();

}

function render() {

    const camera = perspectiveCamera;

    renderer.render(scene, camera);

}