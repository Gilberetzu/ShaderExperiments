import * as THREE from "three";
import RaymarchingQuality from "./RaymarchingQuality";

export default class ProceduralPlanet {
	name: string;
	_PSNoiseOffset: THREE.Vector3;
	_PSNoiseGlobalScale: number;
	_PSWaterHeight: number;
	_PSWaterDepthOffset: number;
	_PSMaxHeightOffset: number;
	_PlanetColor1: THREE.Color;
	_PlanetColor2: THREE.Color;
	_PSNoiseScales: THREE.Vector2;
	_SecondaryNoiseStrengthGround: number;
	_MaxScrewTerrain: number;
	_PSDensityOffset: number;
	_SurfaceMinLight: number;

	_PlanetRaymarchQuality: RaymarchingQuality;
	//_PlanetSurfaceWaterStepSize: number;
	//_PlanetSurfaceWaterMaxStepCount: number;

	_GridHalfSize: number;
	_VoxelNormalInterp: number;
	_EnableVoxelizer: boolean;

	_WaterColorDepth: THREE.Color;
	_WaterColor: THREE.Color;
	_WaterMaterialSmoothStep: THREE.Vector2;
	_WaterNormalScale: number;
	_WaterSurfaceMinLight: number;
	_WaterNormalStrength: number;
	_SpecularParams: THREE.Vector2;
	_WaterMoveSpeed: number;

	_CloudTransparency: number;
	_CloudColor1: THREE.Color;
	_CloudColor2: THREE.Color;
	_MaxScrewCloud: number;
	_BreakDistanceCloud: number;
	_CloudMidDistance: number;
	_CloudHalfHeight: number;
	_CloudNoiseScales: THREE.Vector2;
	_CloudNoiseOffset: THREE.Vector3;
	_CloudNoiseGlobalScale: number;
	_SecondaryNoiseStrength: number;
	_CloudDensityMultiplier: number;
	_CloudDensityOffset: number;
	_CloudMoveSpeed: number;

	_CloudRaymarchQuality: RaymarchingQuality;
	//_CloudsStepSize: number;
	//_CloudsMaxStepCount: number;

	_CloudsPosterize: boolean;
	_CloudsPosterizeCount: number;

	_AmbientColor: THREE.Color;
	_AmbientPower: number;

	constructor(name) {
		this.name = name;
		//Surface
		this._PSNoiseOffset = new THREE.Vector3(10.62, 0, 0);
		this._PSNoiseGlobalScale = 1;
		this._PSWaterHeight = 0.5;
		this._PSWaterDepthOffset = 0.069;
		this._PSMaxHeightOffset = 0.1;
		this._PlanetColor1 = new THREE.Color(0, 0.4, 0.3);
		this._PlanetColor2 = new THREE.Color(0.2, 1, 0.8);
		this._PSNoiseScales = new THREE.Vector2(2, 20);
		this._SecondaryNoiseStrengthGround = 0.07;
		this._MaxScrewTerrain = 0;
		this._PSDensityOffset = 0;
		this._SurfaceMinLight = 0.2;
		this._PlanetRaymarchQuality = RaymarchingQuality.medium;
		//Voxels
		this._GridHalfSize = 30;
		this._VoxelNormalInterp = 1.0;
		this._EnableVoxelizer = false;

		//Ocean uniforms
		this._WaterColorDepth = new THREE.Color(0.1, 0.1, 0.3);
		this._WaterColor = new THREE.Color(0.6, 0.8, 1);
		this._WaterMaterialSmoothStep = new THREE.Vector2(4.92, 0);
		this._WaterNormalScale = 12.46;
		this._WaterSurfaceMinLight = 0.44;
		this._WaterNormalStrength = 0.5;
		this._SpecularParams = new THREE.Vector2(3.4, 0.33);
		this._WaterMoveSpeed = 0.2;

		//Cloud uniforms
		this._CloudTransparency = 1;
		this._CloudColor1 = new THREE.Color(0, 0.5, 0.8);
		this._CloudColor2 = new THREE.Color(1, 1, 1);
		this._MaxScrewCloud = 0.6;
		this._BreakDistanceCloud = 1.1;
		this._CloudMidDistance = 0.8;
		this._CloudHalfHeight = 0.053;
		this._CloudNoiseScales = new THREE.Vector2(3, 30);
		this._CloudNoiseOffset = new THREE.Vector3(0, 0, 0);
		this._CloudNoiseGlobalScale = 1.07;
		this._SecondaryNoiseStrength = 0.1;
		this._CloudDensityMultiplier = 1.14;
		this._CloudDensityOffset = -0.1;
		this._CloudMoveSpeed = 0.1;
		this._CloudRaymarchQuality = RaymarchingQuality.medium;
		this._CloudsPosterize = true;
		this._CloudsPosterizeCount = 4;

		//Ambient
		this._AmbientColor = new THREE.Color(0.1, 0.1, 0.3);
		this._AmbientPower = 4.0;
	}

	/*static GetPropType(propName: string){
		this[propName]
	}*/

	static GetGUIStructure() {
		return [
			{
				label: "Object Props",
				groups: [
					{
						label: "Name",
						props: [
							{
								label:"Name", prop: "name"
							}
						]
					},
					{
						label: "Render Settings",
						props: [
							{
								label:"Planet Raymarch Quality", prop: "_PlanetRaymarchQuality", overrideType: "enum", enumObject: RaymarchingQuality
							},
							{
								label:"Clouds Raymarch Quality", prop: "_CloudRaymarchQuality", overrideType: "enum", enumObject: RaymarchingQuality
							}
						]
					}
				]
			},
			{
				label: "Surface",
				groups: [
					{
						label: "Color",
						props: [
							{ label: "Color Shore", prop: "_PlanetColor1" },
							{ label: "Color Surface", prop: "_PlanetColor2" },
						]
					},

					{
						label: "Noise Settings",
						props: [
							{ label: "Noise Offset", prop: "_PSNoiseOffset"},
							{ label: "Noise Global Scale", prop: "_PSNoiseGlobalScale",
							extras: {min: 0.01, max: 20.0, addSlider:true} },
							{ label: "Noise Scales", prop: "_PSNoiseScales" },
							{ label: "Noise 2 Strengh", prop: "_SecondaryNoiseStrengthGround",
							extras: {min: -1.0, max: 1.0, addSlider:true}},
							{ label: "Noise Value Offset", prop: "_PSDensityOffset" },
						]
					},

					{
						label: "Size",
						props: [
							{ label: "Water Height", prop: "_PSWaterHeight",
							extras: {min: 0.0, max: 1.0, addSlider:true}},
							{ label: "Water Depth", prop: "_PSWaterDepthOffset",
							extras: {min: 0.0, max: 1.0, addSlider:true}},
							{ label: "Max Height", prop: "_PSMaxHeightOffset", 
							tooltip: "From Water Height", extras: {min: -1.0, max: 1.0, addSlider:true}},
						]
					},

					{
						label: "Misc",
						props: [
							{ label: "Max Screw", prop: "_MaxScrewTerrain" },
							{ label: "Min Light", prop: "_SurfaceMinLight" },
							{ label: "Raymarch Quality", prop: "_PlanetRaymarchQuality" },
						]
					},

					{
						label: "Voxelizer",
						props: [
							{ label: "Enable Voxels", prop: "_EnableVoxelizer" },
							{ label: "Grid Half Size", prop: "_GridHalfSize" },
							{ label: "Normal Interpolator", prop: "_VoxelNormalInterp" },
						]
					}
				]
			},
			{
				label: "Water",
				groups: [
					{
						label: "Color",
						props: [
							{ label: "Color 1 - Depth 1", prop: "_WaterColor" },
							{ label: "Color 2 - Depth 0", prop: "_WaterColorDepth" },
							{ label: "Depth Remap", prop: "_WaterMaterialSmoothStep" },
						]
					},
					{
						label: "Lighting",
						props: [
							{ label: "Min Light", prop: "_WaterSurfaceMinLight" },
							{ label: "Specular Pow - Mult", prop: "_SpecularParams" },
						]
					},
					{
						label: "Normal",
						props: [
							{ label: "Normal Scale", prop: "_WaterNormalScale" },
							{ label: "Normal Strength", prop: "_WaterNormalStrength" }
						]
					},
					{
						label: "Misc",
						props: [
							{ label: "Speed", prop: "_WaterMoveSpeed" }
						]
					}
				]
			},
			{
				label: "Cloud",
				groups: [
					{
						label: "Color",
						props: [
							{ label: "Color Shadowed", prop: "_CloudColor1", tooltip: "Color of the shadowed areas" },
							{ label: "Color Lit", prop: "_CloudColor2" },
							{ label: "Transparency", prop: "_CloudTransparency", extras: {min: 0.0, max: 1.0, addSlider:true} },
						]
					},
					{
						label: "Size",
						props: [
							{ label: "Cloud Height", prop: "_CloudMidDistance", extras: {min: 0.0, max: 1.0, addSlider:true} },
							{ label: "Half Height", prop: "_CloudHalfHeight", extras: {min: 0.0, max: 1.0, addSlider:true} }
						]
					},
					{
						label: "Noise Settings",
						props:[
							{label: "Noise Scales", prop: "_CloudNoiseScales"},
							{label: "Noise Offset", prop: "_CloudNoiseOffset"},
							{label: "Global Noise", prop: "_CloudNoiseGlobalScale"},
							{label: "Secondary Noise", prop: "_SecondaryNoiseStrength"},
							{label: "Noise Multiplier", prop: "_CloudDensityMultiplier"},
							{label: "Noise Value Offset", prop: "_CloudDensityOffset"},
						]
					},
					{
						label: "Posterize",
						props:[
							{label: "Posterize", prop: "_CloudsPosterize"},
							{label: "Count", prop: "_CloudsPosterizeCount"}
						]
					},
					{
						label: "Misc",
						props: [
							{ label: "Max Screw", prop: "_MaxScrewCloud", extras: {min: 0.0, max: 10.0, addSlider:true} },
							{ label: "Cloud Move Speed", prop: "_CloudMoveSpeed", extras: {min: -1.0, max: 1.0, addSlider:true} },
						]
					}
				]
			},
			{
				label: "Atmosphere",
				groups: [
					{
						label: "Atmosphere",
						props: [
							{ label: "Color", prop: "_AmbientColor" },
							{ label: "Power", prop: "_AmbientPower" }
						]
					}
				]
			}
		];
	}
}

/*
this._BreakDistanceCloud = 1.1;
this._CloudRaymarchQuality = RaymarchingQuality.medium;
*/