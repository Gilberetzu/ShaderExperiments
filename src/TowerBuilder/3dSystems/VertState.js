import * as THREE from 'three';

export default {
	0: {
		name: "Water",
		color: new THREE.Color(0.2,0.2,0.9),
		scale: 1
	},
	1: {
		name: "Air",
		color: new THREE.Color(0.75,0.85,0.95),
		scale: 0.0
	},
	2: {
		name: "Building",
		color: new THREE.Color(0.8, 0.5, 0.5),
		scale: 2
	},
	"WATER": 0,
	"AIR": 1,
	"BUILDING": 2
}