import * as THREE from "three";

const container = document.querySelector("#container");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xF2F3F4);

const ambient = new THREE.AmbientLight("white", 1.0);
scene.add(ambient);


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

container.appendChild(renderer.domElement);
/////////


/////////
let geometry, thick, dist;
const cuboids = [];
let n_geos = 64

if (container.clientHeight > container.clientWidth) {
	geometry = new THREE.BoxGeometry(30, thick, 30);
	n_geos = n_geos / 2;
	thick = 1;
	dist = 1;

} else {
	geometry = new THREE.BoxGeometry(30, 30, thick);
	n_geos = n_geos;
	thick = 1;
	dist = 1;
}

for (let i = 0; i < n_geos; i++){
	cuboids[i] = new THREE.Mesh(
		geometry,

		new THREE.MeshPhysicalMaterial(
			{
				roughness: 0.7,   
				transmission: 1.0,  
				thickness: 6,
				ior: 1.2,
		
				color: Math.random() * 0xffffff,

				transparent: true,
				opacity: 0.79,
				side: THREE.DoubleSide,
				depthWrite: false
			}
		)
		
	);
	
	if (container.clientHeight > container.clientWidth) {
		cuboids[i].scale.set(
			Math.random(10.0, 30.0),
			thick,
			Math.random(10.0, 30.0)
		);
		
	
		cuboids[i].position.set(
			0.0,
			(- n_geos / 2 + (thick / 2)) * dist + i * dist, 
			0.0
		);

	} else {
		cuboids[i].scale.set(
			Math.random(10.0, 30.0),
			Math.random(10.0, 30.0),
			thick
		);
		
	
		cuboids[i].position.set(
			0.0,
			0.0, 
			(- n_geos / 2 + (thick / 2)) * dist + i * dist
		);
	}

	scene.add(cuboids[i]);
}
/////////


/////////
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);
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



function render(time) {
	time *= 0.00001;

	for (let i = 0; i < n_geos; i++){
		if (container.clientHeight > container.clientWidth) {
			cuboids[i].rotation.y = time * i * 0.1;
		} else {
			cuboids[i].rotation.z = time * i * 0.1;
		}
		
	}

	renderer.render(scene, camera);
	requestAnimationFrame(render);
}
requestAnimationFrame(render);


/*
setTimeout(
	function(){
		window.location.reload(1);
	},
	1000
);
*/