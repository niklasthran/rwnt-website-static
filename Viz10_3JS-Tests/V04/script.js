import * as THREE from "three";

const container = document.querySelector("#container");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xF2F3F4);
const ambient = new THREE.AmbientLight("white", 1.0);
scene.add(ambient);

/////////
let geometry, n_geos;
const thick = 1;
const dist = 1;

if (container.clientHeight > container.clientWidth) {
	geometry = new THREE.BoxGeometry(30, thick, 30);
	n_geos = 64;

} else {
	geometry = new THREE.BoxGeometry(30, 30, thick);
	n_geos = 128;
	
}

const cuboids = new THREE.InstancedMesh(
	geometry,

	new THREE.MeshPhysicalMaterial(
		{
			roughness: 0.7,   
			transmission: 1.0,  
			thickness: 6,
			ior: 1.2,
			transparent: true,
			opacity: 0.79,
			side: THREE.DoubleSide,
			depthWrite: false
		}
	),

	n_geos
);

const dummy = new THREE.Object3D();
for (let i = 0; i < n_geos; i++){
	if (container.clientHeight > container.clientWidth) {
		dummy.scale.set(
			Math.random(10.0, 30.0),
			thick,
			Math.random(10.0, 30.0)
		);
		
		dummy.position.set(
			0.0,
			(- n_geos / 2 + (thick / 2)) * dist + i * dist, 
			0.0
		);
	
	} else {
		dummy.position.set(
			0.0,
			0.0, 
			(- n_geos / 2 + (thick / 2)) * dist + i * dist
		);
	
		dummy.scale.set(
			Math.random(10.0, 30.0),
			Math.random(10.0, 30.0),
			thick
		);
		
	}

	dummy.updateMatrix();
	cuboids.setMatrixAt(i, dummy.matrix);
	cuboids.setColorAt(i, new THREE.Color(Math.random() * 0xffffff))
}

scene.add(cuboids);
/////////

/////////
const aspect = container.clientWidth / container.clientHeight;

const size = 75;
const camera = new THREE.OrthographicCamera(
	(size * aspect) / -2,
	(size * aspect) / 2,
	size / 2,
	size / -2,
	1,
	1000
);

camera.position.set(70, 45, 100);
camera.lookAt(0, 0, 0);
/////////

/////////
const renderer = new THREE.WebGLRenderer(
	{
		antialias: true
	}
);

renderer.setSize(
	container.clientWidth,
	container.clientHeight
);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);
/////////

/////////
container.appendChild(renderer.domElement);
/////////

/////////
let toggle_switch = false;
if (container.clientHeight > container.clientWidth && toggle_switch == false) {
	toggle_switch = true;
}

if (container.clientHeight < container.clientWidth && toggle_switch == true) {
	toggle_switch = false;
}

function onWindowResize() {
	if (container.clientHeight > container.clientWidth && toggle_switch == false) {
		window.location.reload();
	}

	if (container.clientHeight < container.clientWidth && toggle_switch == true) {
		window.location.reload();
	}

	const newAspect = container.clientWidth / container.clientHeight;

	camera.left = (size * newAspect) / -2;
	camera.right = (size * newAspect) / 2;

	camera.updateProjectionMatrix();

	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize);
/////////


/*
function render(time) {
	time *= 0.001;

	//cuboid.rotation.x = time;
	//cuboid.rotation.y = time;

	renderer.render(scene, camera);
	//controls.update();

	requestAnimationFrame(render);
}
requestAnimationFrame(render);
*/