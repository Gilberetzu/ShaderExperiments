import * as THREE from "three";
import SerializeDataType from "./SerializeDataType";

export default class ProceduralStar{
	name:string;

	heightMaskInvLerp: THREE.Vector2;
	heightMask: THREE.Vector2;
	expansionSpeed: number;
	expansionScale: number;
	expansionScaleHeightOffset: number;
	expansionDistance: number;

	screwHeightMaskMultiplier: number;
	screwInterpMultiplier: number;
	screwMultiplier: number;

	voronoiScale: number;
	noiseSample2Scale: number;

	fresnelPower: number;
	fresnelRemap: THREE.Vector2;
	
	color1: THREE.Color;
	color2: THREE.Color;

	radius: number;

	densityMultiplier: number;

	fireRemapMax: number;
	fireColor: THREE.Color;

	outerLightPower: number;
	outerColor: THREE.Color;

	constructor(name: string){
		this.name = name;

		this.heightMaskInvLerp = new THREE.Vector2(0.75, 1.0);
		this.heightMask = new THREE.Vector2(0.75, 1.2);
		this.expansionSpeed = 0.25;
		this.expansionScale = 14.0;
		this.expansionScaleHeightOffset = 2.0;
		this.expansionDistance = 4.0;
		
		this.screwHeightMaskMultiplier = 0.25;
		this.screwInterpMultiplier = 0.5;
		this.screwMultiplier = 0.0;

		this.voronoiScale = 3.0;
		this.noiseSample2Scale = 0.5;
		
		this.fresnelPower = 2.5;
		this.fresnelRemap = new THREE.Vector2(0.0, 0.5);
		
		this.color1 = new THREE.Color(1.0, 0.95, 0.4);
		this.color2 = new THREE.Color(1.0,1.0,0.2);

		this.radius = 0.7;

		this.densityMultiplier = 0.5;
		
		this.fireRemapMax = 0.9;
		this.fireColor = new THREE.Color(0.95, 0.4, 0.2);

		this.outerLightPower = 2.0;
		this.outerColor = new THREE.Color(1.0, 0.95, 0.8);
	}

	copy(){
		let copy = new ProceduralStar(`${this.name}-copy`);
		Object.keys(copy).forEach(key => {
			if(key == "name"){
				//nothing
			}else{
				copy[key] = this[key];
			}
		});
		return copy;
	}

	createSerializableObject(){
		let serializableObject = [
			SerializeDataType.SString("name", this.name),
			SerializeDataType.SVector2("heightMaskInvLerp", this.heightMaskInvLerp),
			SerializeDataType.SVector2("heightMask", this.heightMask),
			SerializeDataType.SNumber("expansionSpeed", this.expansionSpeed),
			SerializeDataType.SNumber("expansionScale", this.expansionScale),
			SerializeDataType.SNumber("expansionScaleHeightOffset",this.expansionScaleHeightOffset),
			SerializeDataType.SNumber("expansionDistance",this.expansionDistance),
			
			SerializeDataType.SNumber("screwHeightMaskMultiplier",this.screwHeightMaskMultiplier),
			SerializeDataType.SNumber("screwInterpMultiplier",this.screwInterpMultiplier),
			SerializeDataType.SNumber("screwMultiplier", this.screwMultiplier),

			SerializeDataType.SNumber("voronoiScale", this.voronoiScale),
			SerializeDataType.SNumber("noiseSample2Scale",this.noiseSample2Scale),
			
			SerializeDataType.SNumber("fresnelPower", this.fresnelPower),
			SerializeDataType.SVector2("fresnelRemap", this.fresnelRemap),
			
			SerializeDataType.SVector3Color("color1", this.color1),
			SerializeDataType.SVector3Color("color2", this.color2),

			SerializeDataType.SNumber("radius", this.radius),

			SerializeDataType.SNumber("densityMultiplier", this.densityMultiplier),
			
			SerializeDataType.SNumber("fireRemapMax", this.fireRemapMax),
			SerializeDataType.SVector3Color("fireColor", this.fireColor),

			SerializeDataType.SNumber("outerLightPower", this.outerLightPower),
			SerializeDataType.SVector3Color("outerColor", this.outerColor)
		];

		return serializableObject;
	}

	static createFromSerializableObject(obj){
		let nStar = new ProceduralStar("newBackground");
		obj.forEach(param => {
			nStar[param.paramName] = SerializeDataType.DeserializeData(param);
		});
		return nStar;
	}
}