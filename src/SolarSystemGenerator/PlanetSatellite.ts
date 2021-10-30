import * as THREE from 'three';
import SerializeDataType from "./SerializeDataType";

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

	createSerializableObject(){
		let serializableObject = [
			SerializeDataType.SString("name", this.name),
			SerializeDataType.SNumber("mainPlanetId", this.mainPlanetId),
			{
				paramName: "satellites",
				data: this.satelites.map((sat) => {
					let data = [
						SerializeDataType.SNumber("planetId", sat.planetId),

						SerializeDataType.SNumber("orbitStart", sat.orbitStart),
						SerializeDataType.SVector2("orbitElipse", sat.orbitElipse),
						SerializeDataType.SVector2("orbitRotation", sat.orbitRotation),
						SerializeDataType.SVector3("orbitCenter", sat.orbitCenter),
						SerializeDataType.SNumber("orbitSpeed", sat.orbitSpeed),

						SerializeDataType.SVector2("rotationAxis", sat.rotationAxis),
						SerializeDataType.SNumber("rotationSpeed", sat.rotationSpeed),

						SerializeDataType.SNumber("scale", sat.scale)
					];
					return data;
				})
			}
		];

		return serializableObject;
	}

	static createFromSerializableObject(obj){
		let nPlanetSatellite = new PlanetSatellite("newPlanetSatellite");
		obj.forEach(param => {
			if(param.paramName == "satellites"){
				param.data.forEach(sat => {
					let newSat = new Satellite(-1);
					sat.forEach(satParam => {
						newSat[satParam.paramName] = SerializeDataType.DeserializeData(satParam);
					});
					nPlanetSatellite.satelites.push(newSat);
				});
			}else{
				nPlanetSatellite[param.paramName] = SerializeDataType.DeserializeData(param);
			}
		});
		return nPlanetSatellite;
	}
}