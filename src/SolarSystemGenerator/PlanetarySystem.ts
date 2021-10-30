import * as THREE from 'three';
import SerializeDataType from "./SerializeDataType";

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
		this.orbitElipse = new THREE.Vector2(4,4);
		this.orbitRotation = new THREE.Vector2(0,0);
		this.orbitCenter = new THREE.Vector3(0,0,0);
		this.orbitSpeed = 1;

		this.scale = 0.5;
	}
}

export default class PlanetarySystem{
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

	copy(){
		let copy = new PlanetarySystem(`${this.name}-copy`);
		copy.starId = this.starId;
		copy.starScale = this.starScale;

		this.planets.forEach(p => {
			let pl = new PlanetPS(p.planetSatelliteId);
			pl.orbitCenter = p.orbitCenter;
			pl.orbitElipse = p.orbitElipse;
			pl.orbitRotation = p.orbitRotation;
			pl.orbitSpeed = p.orbitSpeed;
			pl.orbitStart = p.orbitStart;
			pl.scale = p.scale;
			copy.planets.push(pl);
		});
		return copy;
	}

	createSerializableObject(){
		let serializableObject = [
			SerializeDataType.SString("name", this.name),
			SerializeDataType.SNumber("starId", this.starId),
			SerializeDataType.SNumber("starScale", this.starScale),
			{
				paramName: "planets",
				data: this.planets.map((pl) => {
					let data = [
						SerializeDataType.SNumber("planetSatelliteId", pl.planetSatelliteId),

						SerializeDataType.SNumber("orbitStart", pl.orbitStart),
						SerializeDataType.SVector2("orbitElipse", pl.orbitElipse),
						SerializeDataType.SVector2("orbitRotation", pl.orbitRotation),
						SerializeDataType.SVector3("orbitCenter", pl.orbitCenter),
						SerializeDataType.SNumber("orbitSpeed", pl.orbitSpeed),

						SerializeDataType.SNumber("scale", pl.scale)
					];
					return data;
				})
			}
		];

		return serializableObject;
	}

	static createFromSerializableObject(obj){
		let nPlanetarySytstem = new PlanetarySystem("newPlanetraySystem");
		obj.forEach(param => {
			if(param.paramName == "planets"){
				param.data.forEach(ps => {
					let newPS = new PlanetPS(-1);
					ps.forEach(psParam => {
						newPS[psParam.paramName] = SerializeDataType.DeserializeData(psParam);
					});
					nPlanetarySytstem.planets.push(newPS);
				});
			}else{
				nPlanetarySytstem[param.paramName] = SerializeDataType.DeserializeData(param);
			}
		});
		return nPlanetarySytstem;
	}
}