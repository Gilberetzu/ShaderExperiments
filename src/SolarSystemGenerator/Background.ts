import * as THREE from 'three';
import SerializeDataType from "./SerializeDataType";

type noiseParams = {
	scale: number;
	mult: number;
	screw: number;
	speed: number;
}

export default class Background{
	name: string;
	color0: THREE.Color;
	color1: THREE.Color;
	color2: THREE.Color;

	colorStars: THREE.Color;
	noiseStarScale: number;
	noiseStarSmoothStep: THREE.Vector2;
	noiseStarMaskSpeed: number;
	
	noise1: noiseParams;
	noise2: noiseParams;

	mainNoiseScale:number;
	mainNoiseScrew: number;

	noiseMaskSmoothStep: THREE.Vector2;
	noiseMaskOffset: THREE.Vector3;
	noiseMaskScale: number;
	
	stepSize: number;

	densityMult: number;

	constructor(name:string){
		this.name = name;
		this.color0 = new THREE.Color(0.0,0.0,0.0);
		this.color1 = new THREE.Color(0.05,0.1,0.3);
		this.color2 = new THREE.Color(0.0,0.0,0.0);

		this.colorStars = new THREE.Color(1,1,0.8);
		this.noiseStarMaskSpeed = 0.0;
		this.noiseStarScale = 0.5;
		this.noiseStarSmoothStep = new THREE.Vector2(0.1, 0.18);

		this.stepSize = 8.5;

		this.noise1 = {
			scale: 85,
			mult: -13,
			screw: 0.0,
			speed: 0.01
		};

		this.noise2 = {
			scale: 22.0,
			mult: 15.0,
			screw: 0.0,
			speed: 0.09
		};

		this.mainNoiseScale = 20.0;
		this.mainNoiseScrew = 0.0;

		this.noiseMaskSmoothStep = new THREE.Vector2(-0.04, 1.0);
		this.noiseMaskScale = 16.7;
		this.noiseMaskOffset = new THREE.Vector3(8.5,0.0,0.0);

		this.densityMult = 0.04;
	}

	copy(){
		let copy = new Background(`${this.name}-copy`);
		Object.keys(copy).forEach(key => {
			if(key == "name"){
				//nothing;
			}else if(key == "noise1" || key == "noise2"){
				copy[key].scale == this[key].scale;
				copy[key].mult == this[key].mult;
				copy[key].screw == this[key].screw;
				copy[key].speed == this[key].speed;
			}else{
				copy[key] = this[key];
			}
		});
		return copy;
	}

	createSerializableObject(){
		let serializableObject = [
			SerializeDataType.SString("name", this.name),
			SerializeDataType.SVector3Color("color0", this.color0),
			SerializeDataType.SVector3Color("color1", this.color1),
			SerializeDataType.SVector3Color("color2", this.color2),

			SerializeDataType.SVector3Color("colorStars", this.colorStars),
			SerializeDataType.SNumber("noiseStarMaskSpeed", this.noiseStarMaskSpeed),
			SerializeDataType.SNumber("noiseStarScale", this.noiseStarScale),
			SerializeDataType.SVector2("noiseStarSmoothStep", this.noiseStarSmoothStep),

			SerializeDataType.SNumber("stepSize", this.stepSize),

			{
				paramName: "noise1",
				params:[
					SerializeDataType.SNumber("scale", this.noise1.scale),
					SerializeDataType.SNumber("mult", this.noise1.mult),
					SerializeDataType.SNumber("screw", this.noise1.screw),
					SerializeDataType.SNumber("speed", this.noise1.speed),
				]
			},
			{
				paramName: "noise2",
				params:[
					SerializeDataType.SNumber("scale", this.noise2.scale),
					SerializeDataType.SNumber("mult", this.noise2.mult),
					SerializeDataType.SNumber("screw", this.noise2.screw),
					SerializeDataType.SNumber("speed", this.noise2.speed),
				]
			},

			SerializeDataType.SNumber("mainNoiseScale", this.mainNoiseScale),
			SerializeDataType.SNumber("mainNoiseScrew", this.mainNoiseScrew),

			SerializeDataType.SVector2("noiseMaskSmoothStep", this.noiseMaskSmoothStep),
			SerializeDataType.SNumber("noiseMaskScale", this.noiseMaskScale),
			SerializeDataType.SVector3("noiseMaskOffset", this.noiseMaskOffset),

			SerializeDataType.SNumber("densityMult", this.densityMult)
		];

		return serializableObject;
	}

	static createFromSerializableObject(obj){
		let nBackground = new Background("newBackground");
		obj.forEach(param => {
			if(param.paramName == "noise1"){
				param.params.forEach(p => {
					nBackground.noise1[p.paramName] = SerializeDataType.DeserializeData(p);
				});
			}else if(param.paramName == "noise2"){
				param.params.forEach(p => {
					nBackground.noise2[p.paramName] = SerializeDataType.DeserializeData(p);
				});
			}else{
				nBackground[param.paramName] = SerializeDataType.DeserializeData(param);
			}
		});
		return nBackground;
	}
}