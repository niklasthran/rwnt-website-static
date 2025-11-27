import * as THREE from "three";
import * as D3 from "d3";
import GSAP from "gsap";


////////////////////////////
/* Loading ALS Data Repository from JSON file */

const ALS_DATA_FILE = await fetch("../assets/data_mini.json");
const ALS_DATA = await ALS_DATA_FILE.json();
////////////////////////////


////////////////////////////
/* Spiral algorithm */

function phyllotaxis(n, radius=1) {
	const phi = Math.PI * (3 - Math.sqrt(5));
	const points = [];
  
	for (let i = 0; i < n; i++) {
	  const r = Math.sqrt(i / n) * radius;
	  const theta = i * phi;
	  points.push({
		x: r * Math.cos(theta),
		y: r * Math.sin(theta)
	  });
	}
  
	return points;
}
////////////////////////////


////////////////////////////
/* Retrieve data from IDB */

const num_fsr 				= ALS_DATA["N_FSR"];
const num_opm 				= ALS_DATA["N_OPM"];
const num_nfl 				= ALS_DATA["N_NFL"];
const n_geos 				= ALS_DATA["N_TOTAL"];
const merge_group 			= ALS_DATA["DATA"];

/* DOM fetch */

const dom_dataviz 			= document.querySelector(".dataviz");
const dom_dataviz_loader 	= document.getElementById("dataviz-loader");
const dom_dataviz_label 	= document.querySelector(".dataviz-label");
const dom_num_fsr 			= document.getElementById("num_fsr");
const dom_num_opm 			= document.getElementById("num_opm");
const dom_num_nfl 			= document.getElementById("num_nfl");
const cb_fsr 				= document.getElementById("cb_fsr");
const cb_opm 				= document.getElementById("cb_opm");
const cb_nfl 				= document.getElementById("cb_nfl");
////////////////////////////


(async function() {
	// Displaying loader
	dom_dataviz_loader.style.display = "block";

	// DV + DV label bg are not visible yet
	dom_dataviz.style.opacity = 0;
	dom_dataviz_label.style.background = "#FFFFFF";

	// Displaying numbers as HTML p-elements
	dom_num_fsr.innerHTML = num_fsr.toLocaleString();
	dom_num_opm.innerHTML = num_opm.toLocaleString();
	dom_num_nfl.innerHTML = num_nfl.toLocaleString();

	// ... but not visible yet
	dom_num_fsr.style.opacity = 0;
	dom_num_opm.style.opacity = 0;
	dom_num_nfl.style.opacity = 0;


	////////////////////////////
	/* Scene and lights */

	const scene = new THREE.Scene();

	scene.background = new THREE.Color(0xF2F3F4);
	const ambient = new THREE.AmbientLight(0xFFFFFF, 1.0);
	scene.add(ambient);
	////////////////////////////


	////////////////////////////
	/* Geometry and Material */

	const geo_size 	= 5.0;

	const geometry 	= 	new THREE.BoxGeometry
						(
							geo_size,
							geo_size,
							geo_size
						);

	const material 	= 	new THREE.MeshPhysicalMaterial
	(
		{
			roughness: 0.7,   
			transmission: 1.0,  
			thickness: 7,
			ior: 1.25,
			transparent: true,
			opacity: 0.99,
			side: THREE.DoubleSide,
			depthWrite: true
		}
	);
				
	// Custom opacity attribute to be changed per instance
	const opacities = new Float32Array(n_geos);
	geometry.setAttribute("instanceOpacity", new THREE.InstancedBufferAttribute(opacities, 1));

	// MeshPhysicalMaterial shader modification
	material.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader.replace(
			"#include <common>",
			`
			#include <common>
			attribute float instanceOpacity;
			varying float vInstanceOpacity;
			`
		);

		shader.vertexShader = shader.vertexShader.replace(
			"#include <begin_vertex>",
			`
			#include <begin_vertex>
			vInstanceOpacity = instanceOpacity;
			`
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <common>",
			`
			#include <common>
			varying float vInstanceOpacity;
			`
		);

		// Apply per-instance opacity safely in the PhysicalMaterial pipeline
		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <opaque_fragment>",
			`
			#include <opaque_fragment>
			gl_FragColor.a *= vInstanceOpacity;
			`
		);
	};

	const cuboids 	= 	new THREE.InstancedMesh
						(
							geometry,
							material,
							n_geos
						);

	// Colors
	// FSR
	const cscaleA = D3.scaleLinear().domain([0, 4]).range(['#f4f4f4', '#2c9cd1']);
	const cscaleB = D3.scaleLinear().domain([0, 4]).range(['#f4f4f4', '#4f53c2']);

	// NfL
	const maxScore = D3.max(merge_group.flat(), d => d.nfl);
	const cscaleC = D3.scaleLinear().domain([0.0, maxScore]).range(['#dbd56e', '#dbd56e']);

	// OPM
	const cscaleD = D3.scaleLinear().domain([0, 4]).range(['#af80a6', '#af80a6']);
	////////////////////////////


	////////////////////////////
	/* GFX Assembly */

	const spiral_coord = phyllotaxis(merge_group.length);

	// height + rad of dom_dataviz
	const H 			= 1 / 4;
	const R 			= 2000;

	const day 			= ((1000 * 60) * 60) * 24;
	const day_offset 	= 18700;

	// Counter reset
	let counter 		= 0;

	// 3D object for cuboid instance transformation
	const dummy = new THREE.Object3D();

	for (let i = 0; i < merge_group.length; i++) {

		let pX = spiral_coord[i].x;
		let pZ = spiral_coord[i].y;

		// starting at 3rd object in id array, cutting off earliest data
		for (let j = 1; j < merge_group[i].length; j++) {

			let date = Math.round(merge_group[i][j]["date"] / day) - day_offset;

			for (const [key, value] of Object.entries(merge_group[i][j])) {

				if (key.includes("fsr_mean")) {

					dummy.position.x = pX * R;
					dummy.position.y = date * H;
					dummy.position.z = pZ * R;

					dummy.scale.x = 1.0;
					dummy.scale.y = 1.0;
					dummy.scale.z = 1.0;

					dummy.updateMatrix();
					cuboids.setMatrixAt(counter, dummy.matrix);
					
					// change opacity for fsr
					opacities[counter] = 1.0;

					if (merge_group[i][j]["sod"] == "Digital self assessments_ALS App" ||
						merge_group[i][j]["sod"] == "Digital self assessments_APST platform") {

						cuboids.setColorAt
						(
							counter,
							new THREE.Color
							(
								D3.color(cscaleB(merge_group[i][j][key])).formatHex()
							)
						);
					} else {

						cuboids.setColorAt
						(
							counter,
							new THREE.Color
							(
								D3.color(cscaleA(merge_group[i][j][key])).formatHex()
							)
						);
					}

					counter++;
				}

				if (key.includes("opm")) {
					dummy.position.x = pX * R - geo_size;
					dummy.position.y = date * H;
					dummy.position.z = pZ * R;

					dummy.scale.x = 1.0;
					dummy.scale.y = 1.0;
					dummy.scale.z = 1.0;

					dummy.updateMatrix();
					cuboids.setMatrixAt(counter, dummy.matrix);

					opacities[counter] = 1.0;

					cuboids.setColorAt
					(
						counter,
						new THREE.Color
						(
							D3.color(cscaleD(merge_group[i][j][key])).formatHex()
						)
					);

					counter++;
				}
				
				if (key.includes("nfl")) {
					let nfl_val = merge_group[i][j]["nfl"] * 0.01;

					dummy.position.x = pX * R + geo_size;
					dummy.position.y = date * H + (nfl_val * geo_size * 0.5) - (geo_size * 0.5);

					dummy.scale.y = nfl_val;
					dummy.scale.x = 1.0;

					dummy.updateMatrix();
					cuboids.setMatrixAt(counter, dummy.matrix);

					cuboids.setColorAt
					(
						counter,
						new THREE.Color
						(
							D3.color(cscaleC(merge_group[i][j]["nfl"])).formatHex()
						)
					);

					// change opacity for nfl
					opacities[counter] = 1.0;

					counter++;
				}
			}
		}
	}

	scene.add(cuboids);

	// Update custom geometry attribute
	geometry.attributes.instanceOpacity.needsUpdate = true;
	///////////////////////////


	///////////////////////////
	/* Camera */

	const aspect = dom_dataviz.clientWidth / dom_dataviz.clientHeight;
	const camera = new THREE.PerspectiveCamera(60, aspect, 1, 100000);

	camera.position.set(0, 0, R * 1.15);
	camera.lookAt(0, 100, 0);
	scene.add(camera);
	////////////////////////////


	////////////////////////////
	/* Renderer */

	const renderer = new THREE.WebGLRenderer(
		{
			antialias: true
		}
	);

	renderer.setSize(
		dom_dataviz.clientWidth,
		dom_dataviz.clientHeight
	);

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	////////////////////////////
	/* DOM placement */

	dom_dataviz.appendChild(renderer.domElement);
	////////////////////////////
	


	////////////////////////////
	/* Window resizing and H/V-switching */

	function onWindowResize() {

		const newAspect = dom_dataviz.clientWidth / dom_dataviz.clientHeight;

		camera.aspect = newAspect;
		camera.updateProjectionMatrix();

		renderer.setSize(dom_dataviz.clientWidth, dom_dataviz.clientHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.render(scene, camera);

	}

	window.addEventListener("resize", onWindowResize);
	////////////////////////////


	////////////////////////////
	/* Opacity UI */

	function opacity_ctrl(o_fsr=1.0, o_opm=1.0, o_nfl=1.0) {
		let counter = 0;
		for (let i = 0; i < merge_group.length; i++) {
			for (let j = 1; j < merge_group[i].length; j++) {
				for (const [key, value] of Object.entries(merge_group[i][j])) {

					if (key.includes("fsr_mean")) {
						dummy.updateMatrix();
						cuboids.setMatrixAt(counter, dummy.matrix);

						opacities[counter] = o_fsr;
						counter++;
					}

					if (key.includes("opm")) {
						dummy.updateMatrix();
						cuboids.setMatrixAt(counter, dummy.matrix);

						opacities[counter] = o_opm;
						counter++;
					}
					
					if (key.includes("nfl")) {
						dummy.updateMatrix();
						cuboids.setMatrixAt(counter, dummy.matrix);

						opacities[counter] = o_nfl;
						counter++;
					}
				}
			}
		}

		geometry.attributes.instanceOpacity.needsUpdate = true;
	}

	// Default values --> full opacity
	const state = {
		A: 0.99,
		B: 0.99,
		C: 0.99,
	};

	// when cb unchecked --> value to 0.0
	function updateValues() {
		GSAP.to
		(
			state,
			{
				A: cb_fsr.checked ? 0.99 : 0.01,
				B: cb_opm.checked ? 0.99 : 0.01,
				C: cb_nfl.checked ? 0.99 : 0.01,

				duration: 0.33,
				ease: "power2.inOut",

				onUpdate: () => {
					opacity_ctrl(state.A, state.B, state.C);
				}
			}
		);
	}

	// EventListener triggering updateValues function
	[cb_fsr, cb_opm, cb_nfl].forEach(cb => cb.addEventListener("change", updateValues));
	////////////////////////////


	////////////////////////////
	/* Animation */

	function animate() {
		requestAnimationFrame(animate);

		cuboids.rotation.y += 0.0005;

		renderer.render(scene, camera);
	}

	animate();

	// Hiding loader
	dom_dataviz_loader.style.display = "none";

	// DV fade in
	GSAP.to(dom_dataviz, {duration: 4.0, opacity: 1, ease: "power2.out"});
	GSAP.to(dom_dataviz_label, {duration: 4.0, background: "#F2F3F4", ease: "power2.out"});

	// Numbers fade in	
	GSAP.to(dom_num_fsr, {duration: 2.0, opacity: 1, ease: "power2.out"});
	GSAP.to(dom_num_opm, {duration: 2.0, opacity: 1, ease: "power2.out"});
	GSAP.to(dom_num_nfl, {duration: 2.0, opacity: 1, ease: "power2.out"});

})();