import * as THREE from 'three';

export class PlanetPS{
	planetSatelliteId: number;

	orbitStart: number;
	orbitElipse: THREE.Vector2;
	orbitRotation: THREE.Vector2;
	orbitCenter: THREE.Vector3;
	orbitSpeed: number;

	scale: number;

	constructor(ps:number){
		this.planetSatelliteId = ps;

		this.orbitStart = 0;
		this.orbitElipse = new THREE.Vector2(2,2);
		this.orbitRotation = new THREE.Vector2(0,0);
		this.orbitCenter = new THREE.Vector3(0,0,0);
		this.orbitSpeed = 1;

		this.scale = 1;
	}
}

export default class PlanetarySystems{
	name: string;
	starId: number;
	starScale: number;
	planets: Array<PlanetPS>
	constructor(name: string){
		this.name = name;
		this.starId = -1;
		this.starScale = 1;
		this.planets = [];
	}
}