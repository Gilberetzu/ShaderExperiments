import * as THREE from 'three';

export class Satellite{
	planetId: number;

	orbitStart: number;
	orbitElipse: THREE.Vector2;
	orbitRotation: THREE.Vector2;
	orbitCenter: THREE.Vector3;
	orbitSpeed: number;

	rotationAxis: THREE.Vector2;
	rotationSpeed: number;

	scale: number;
	constructor(planetId){
		this.planetId = planetId;
		this.orbitStart = 0;
		this.orbitElipse = new THREE.Vector2(2,2);
		this.orbitRotation = new THREE.Vector2(0,0);
		this.orbitCenter = new THREE.Vector3(0,0,0);
		this.orbitSpeed = 1;

		this.rotationAxis = new THREE.Vector2(0,0);
		this.rotationSpeed = 1;

		this.scale = 0.25;
	}
};

export default class PlanetSatellite{
	name: string;
	mainPlanetId: number;
	satelites: Array<Satellite>;

	constructor(name){
		this.name = name;
		this.mainPlanetId = -1;
		this.satelites = [];
	}

	copy(){
		let copy = new PlanetSatellite(`${this.name}-copy`);
		copy.mainPlanetId = this.mainPlanetId;
		this.satelites.forEach(satellite => {
			let sat = new Satellite(satellite.planetId);
			Object.keys(sat).forEach(key => {
				sat[key] = satellite[key];
			})
			copy.satelites.push(sat);
		});
		return copy;
	}
}