import * as THREE from "./node_modules/three/build/three.module.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightUniformsLib } from "./node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "./node_modules/three/examples/jsm/helpers/RectAreaLightHelper.js";

import { PointerLockControls } from "./node_modules/three/examples/jsm/controls/PointerLockControls.js";

const mainColor = "#F3B05A";
const floor = {
  color: "#e7e7e7",
  metalness: 0.778,
  roughness: 1.0,
};

const torus = {
  color: "#aeccdb - #c1b98c", // degradado de cerca a lejos
};

/////////////////////////

let perspectiveCamera, controls, renderer;
let objects = [];
const scene = new THREE.Scene();

const pickPosition = { x: 0, y: 0 };
clearPickPosition();

class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
  }

  pick(normalizedPosition, scene, camera) {
    // cast ray
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get list of objects that ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(objects);
    if (intersectedObjects.length) {
      // pick first ojbect
      this.pickedObject = intersectedObjects[0].object;
    }
  }
}

const pickHelper = new PickHelper();

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

  const manager = new THREE.LoadingManager();
  manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(
      "Started loading file: " +
        url +
        ".\nLoaded " +
        itemsLoaded +
        " of " +
        itemsTotal +
        " files."
    );
  };

  manager.onLoad = function () {
	let overlay = document.querySelector('#loading-overlay');
	overlay.style.display = 'none';
    console.log("Loading complete!");
  };

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log(
      "Loading file: " +
        url +
        ".\nLoaded " +
        itemsLoaded +
        " of " +
        itemsTotal +
        " files."
    );
  };

  manager.onError = function (url) {
    console.log("There was an error loading " + url);
  };

  RectAreaLightUniformsLib.init();

  const aspect = window.innerWidth / window.innerHeight;

  let loader = new GLTFLoader(manager);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 5; j++) {
      loader.load(
        "./models/scene.gltf",
        function (gltf) {
          let forestScene = gltf.scene;
          forestScene.scale.set(10, 10, 10);
          forestScene.position.set(100 + i * 100, -15, j * 50);

          scene.add(forestScene);
        },
        undefined,
        function (error) {
          console.error(error);
        }
      );
    }
    for (let j = 0; j < 5; j++) {
      loader.load(
        "./models/scene.gltf",
        function (gltf) {
          let forestScene = gltf.scene;
          forestScene.scale.set(10, 10, 10);
          forestScene.position.set(-100 - i * 100, -15, j * 50);

          scene.add(forestScene);
        },
        undefined,
        function (error) {
          console.error(error);
        }
      );
    }
  }

  for (let i = 0; i < 3; i++) {
    loader.load(
      "./models/scene.gltf",
      function (gltf) {
        let forestScene = gltf.scene;
        forestScene.scale.set(10, 10, 10);
        forestScene.position.set(-100 + i * 100, -15, -100);

        scene.add(forestScene);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    loader.load(
      "./models/scene.gltf",
      function (gltf) {
        let forestScene = gltf.scene;
        forestScene.scale.set(10, 10, 10);
        forestScene.rotateY(180);
        forestScene.position.set(-50 + i * 100, -15, 200);

        scene.add(forestScene);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
  }

  loader.load(
    "./models/quimeraScene.glb",
    function (gltf) {
      let quimeraScene = gltf.scene;

      scene.add(quimeraScene);
      quimeraScene.traverse((obj) => {
        if (obj.castShadow !== undefined) {
          obj.castShadow = true;
          objects.push(obj);
        }
      });
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  loader.load(
    "./models/curtain/scene.gltf",
    function (gltf) {
      let curtain = gltf.scene;

      curtain.scale.set(0.1, 0.1, 0.1);
      curtain.position.set(0.75, -12, -4);
      scene.add(curtain);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  // CAMERA
  const fov = 40;
  const near = 0.1;
  const far = 1000;
  perspectiveCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  perspectiveCamera.position.set(0, 0, 125);

  // SCENE

  scene.background = new THREE.Color("#000000");
  scene.fog = new THREE.Fog("#000000", 10, 200);

  // GROUND
  {
    const planeSize = 1000;

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: floor.color,
      roughness: floor.roughness,
      metalness: floor.metalness,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.set(0, -12, 0);
    scene.add(mesh);
  }

  // CUBE
  {
    const rectangleHeight = 30;
    const rectangleWidth = 45;

    let rectangleShape = new THREE.Shape()
      .moveTo(0, 0)
      .lineTo(0, rectangleHeight)
      .lineTo(rectangleWidth, rectangleHeight)
      .lineTo(rectangleWidth, 0)
      .lineTo(0, 0);

    const extrudeSettings = { depth: 0, bevelEnabled: false };

    // Door wall
    {
      const doorShape = new THREE.Shape()
        .moveTo(rectangleWidth * 0.4, 0)
        .lineTo(rectangleWidth * 0.4, rectangleHeight * 0.5)
        .lineTo(rectangleWidth * 0.6, rectangleHeight * 0.5)
        .lineTo(rectangleWidth * 0.6, 0)
        .lineTo(0, 0);

      rectangleShape.holes.push(doorShape);

      const geometry = new THREE.ExtrudeBufferGeometry(
        rectangleShape,
        extrudeSettings
      );

      const color = "black";

      let mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: color })
      );
      mesh.position.set(-22.5, -12, -5);

      scene.add(mesh);

      rectangleShape.holes.splice(0, 1);
    }

    // Other walls
    {
      let playing = false;
      let videoNorth = document.getElementById("video-north");
      let videoSouth = document.getElementById("video-south");
      let videoWest = document.getElementById("video-west");
      let videoEast = document.getElementById("video-east");
      videoWest.volume = 0.0;
      videoEast.volume = 0.0;
      videoSouth.volume = 0.0;

      let videos = [videoNorth, videoWest, videoEast, videoSouth];

      document.addEventListener("keydown", (event) => {
        const keyName = event.key;
        if (keyName === "p") {
          if (playing) {
            videos.forEach((video) => video.pause());
            playing = false;
          } else {
            videos.forEach((video) => video.play());
            playing = true;
          }
        }
      });

      let textureNorth = new THREE.VideoTexture(videoNorth);
      let textureSouth = new THREE.VideoTexture(videoSouth);
      let textureWest = new THREE.VideoTexture(videoWest);
      let textureEast = new THREE.VideoTexture(videoEast);

      const geometryNorthSouth = new THREE.PlaneBufferGeometry(45, 30);
      const geometryEastWest = new THREE.PlaneBufferGeometry(60, 30);
      const geometryCeiling = new THREE.PlaneBufferGeometry(45, 60);

      let ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      let ceiling = new THREE.Mesh(geometryCeiling, ceilingMaterial);
      ceiling.position.set(0, 13, -35);
      ceiling.rotation.x = Math.PI / 2;
      scene.add(ceiling);

      let wallNorthMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: textureNorth,
        side: THREE.DoubleSide,
      });
      let wallNorth = new THREE.Mesh(geometryNorthSouth, wallNorthMaterial);
      wallNorth.position.set(0, -2, -65);
      scene.add(wallNorth);

      let wallSouthMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: textureSouth,
      });
      let wallSouth = new THREE.Mesh(geometryNorthSouth, wallSouthMaterial);
      wallSouth.rotation.y = Math.PI;
      wallSouth.position.set(0, -2.3, -5.25);
      scene.add(wallSouth);

      let wallWestMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: textureWest,
        side: THREE.DoubleSide,
      });
      let wallWest = new THREE.Mesh(geometryEastWest, wallWestMaterial);
      wallWest.position.set(-22.5, -1.52, -35);
      wallWest.rotation.y = Math.PI / 2;
      scene.add(wallWest);

      let wallEastMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: textureEast,
        side: THREE.DoubleSide,
      });
      let wallEast = new THREE.Mesh(geometryEastWest, wallEastMaterial);
      wallEast.position.set(22.5, -1.52, -35);
      wallEast.rotation.y = Math.PI / 2;
      scene.add(wallEast);
    }
  }

  /**LIGHTS**/

  // Point Light - para luz ambiente
  {
    const pointLight = new THREE.PointLight("#ffffff", 1, 0, 2);
    pointLight.position.set(0, 30, 50);

    scene.add(pointLight);
  }

  // Spot light - para luz del torus
  {
    const spotLight = new THREE.SpotLight(mainColor, 0.5);
    spotLight.castShadow = true;
    spotLight.position.set(0, 10, 0);
    spotLight.target.position.set(0, 0, 50);
    spotLight.penumbra = 12;
    spotLight.shadow.mapSize.width = 5120;
    spotLight.shadow.mapSize.height = 5120;
    scene.add(spotLight);
    scene.add(spotLight.target);
  }

  // RectAreaLight
  {
    const color = mainColor;
    const intensity = 1;
    const width = 25;
    const height = 25;
    const light = new THREE.RectAreaLight(color, intensity, width, height);

    scene.add(light);
  }

  // CONTROLS
  createControls(perspectiveCamera);

  // RENDERER
  const canvas = document.querySelector("#canvas");
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener("resize", onWindowResize, false);
  renderer.shadowMap.enabled = true;
}

function createControls(camera) {
  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
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
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 250.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 250.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  prevTime = time;
  render();
}

function render() {
  const camera = perspectiveCamera;

  pickHelper.pick(pickPosition, scene, camera);

  renderer.render(scene, camera);
}

function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / canvas.width) * 2 - 1;
  pickPosition.y = (pos.y / canvas.height) * -2 + 1; // note we flip Y
}

function clearPickPosition() {
  // unlike the mouse which always has a position
  // if the user stops touching the screen we want
  // to stop picking. For now we just pick a value
  // unlikely to pick something
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}

window.addEventListener("mousemove", setPickPosition);
window.addEventListener("mouseout", clearPickPosition);
window.addEventListener("mouseleave", clearPickPosition);

window.addEventListener(
  "touchstart",
  (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
  },
  { passive: false }
);

window.addEventListener("touchmove", (event) => {
  setPickPosition(event.touches[0]);
});

window.addEventListener("touchend", clearPickPosition);
