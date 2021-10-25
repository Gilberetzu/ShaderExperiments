import * as THREE from "three";
import RaymarchingQuality from "./RaymarchingQuality";

function GetRandomColor(){
	return new THREE.Color(Math.random(), Math.random(), Math.random());
}

function GetRandomVector3(){
	return new THREE.Vector3(Math.random() * 20, Math.random() * 20, Math.random() * 20);
}

function GetCloudColors(){
	let color2 = GetRandomColor();
	let color1 = color2.clone().multiplyScalar(0.5);
	return {
		c1: color1,
		c2: color2
	}
}

export default class ProceduralPlanet {
	name: string;
	_PSNoiseOffset: THREE.Vector3;
	_PSNoiseGlobalScale: number;
	_PSWaterHeight: number;
	_PSWaterDepthOffset: number;
	_PSMaxHeightOffset: number;
	_PlanetColor1: THREE.Color;
	_PlanetColor2: THREE.Color;
	_PlanetHighInterpRange: THREE.Vector2;

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

	_showWater: boolean;
	_WaterColorDepth: THREE.Color;
	_WaterColor: THREE.Color;
	_WaterSpecularColor: THREE.Color;
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
		this._PSNoiseOffset = GetRandomVector3();
		this._PSNoiseGlobalScale = 1;
		this._PSWaterHeight = 0.6;
		this._PSWaterDepthOffset = 0.1;
		this._PSMaxHeightOffset = 0.15 + Math.random() * 0.5;
		this._PlanetColor1 = GetRandomColor();
		this._PlanetColor2 = GetRandomColor();
		this._PlanetHighInterpRange = new THREE.Vector2(0.0, 1.0);
		this._PSNoiseScales = new THREE.Vector2(2, 20);
		this._SecondaryNoiseStrengthGround = 0.07;
		this._MaxScrewTerrain = 0;
		this._PSDensityOffset = 0.05 + Math.random() *  0.4;
		this._SurfaceMinLight = 0.2;
		this._PlanetRaymarchQuality = RaymarchingQuality.medium;
		//Voxels
		this._GridHalfSize = 30;
		this._VoxelNormalInterp = 1.0;
		this._EnableVoxelizer = false;

		//Ocean uniforms
		this._showWater = true;
		this._WaterColorDepth = GetRandomColor();
		this._WaterColor = GetRandomColor();
		this._WaterSpecularColor = GetRandomColor();
		this._WaterMaterialSmoothStep = new THREE.Vector2(4.92, 0);
		this._WaterNormalScale = 12.46;
		this._WaterSurfaceMinLight = 0.44;
		this._WaterNormalStrength = 0.5;
		this._SpecularParams = new THREE.Vector2(3.4, 0.33);
		this._WaterMoveSpeed = 0.2;

		//Cloud uniforms
		let cloudColors = GetCloudColors();

		this._CloudTransparency = 1;
		this._CloudColor1 = cloudColors.c1;
		this._CloudColor2 = cloudColors.c2;
		this._MaxScrewCloud = 0.6;
		this._BreakDistanceCloud = 1.1;
		this._CloudMidDistance = 0.7 + Math.random() * 0.2;
		this._CloudHalfHeight = 0.06;
		this._CloudNoiseScales = new THREE.Vector2(2 + Math.random() * 4, 5 + Math.random() * 25);
		this._CloudNoiseOffset = new THREE.Vector3(Math.random() * 10, Math.random()*10, Math.random()*10);
		this._CloudNoiseGlobalScale = 1.07;
		this._SecondaryNoiseStrength = 0.1 + Math.random() * 0.7;
		this._CloudDensityMultiplier = 1.14;
		this._CloudDensityOffset = -0.1 + Math.random() * 0.5;
		this._CloudMoveSpeed = 0.1;
		this._CloudRaymarchQuality = RaymarchingQuality.medium;
		this._CloudsPosterize = true;
		this._CloudsPosterizeCount = 4;

		//Ambient
		this._AmbientColor = new THREE.Color(0.1, 0.1, 0.3);
		this._AmbientPower = 0.388;
	}

	copy(){
		let copy = new ProceduralPlanet(`${this.name}-copy`);
		Object.keys(copy).forEach(key => {
			if(key == "name"){
				//nothing
			}else{
				copy[key] = this[key];
			}
		});
		return copy;
	}

	static GetGUIStructure() {
		return [
			{
				label: "Object Props",
				groups: [
					{
						label: "Name",
						props: [
							{
								label: "Name", prop: "name", propType: {
									type: "object"
								}
							}
						]
					},
					{
						label: "Render Settings",
						props: [
							{
								label: "Planet Raymarch Quality", prop: "_PlanetRaymarchQuality", overrideType: "enum", enumObject: RaymarchingQuality,
								propType: {
									type: "function",
									func: "setPlanetQuality"
								}
							},
							{
								label: "Clouds Raymarch Quality", prop: "_CloudRaymarchQuality", overrideType: "enum", enumObject: RaymarchingQuality,
								propType: {
									type: "function",
									func: "setCloudQuality"
								}
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
							{ label: "Color Shore", prop: "_PlanetColor1", propType: { type: "uniform" } },
							{ label: "Color Surface", prop: "_PlanetColor2", propType: { type: "uniform" } },
							{ label: "Interpolator Range", prop: "_PlanetHighInterpRange", overrideType: "range", propType: { type: "uniform" },
							extras: { min: 0.0, max: 1.0}}
						]
					},

					{
						label: "Noise Settings",
						props: [
							{ label: "Noise Offset", prop: "_PSNoiseOffset", propType: { type: "uniform" } },
							{
								label: "Noise Global Scale", prop: "_PSNoiseGlobalScale", propType: { type: "uniform" },
								extras: { min: 0.01, max: 20.0, addSlider: true }
							},
							{ label: "Noise Scales", prop: "_PSNoiseScales", propType: { type: "uniform" } },
							{
								label: "Noise 2 Strengh", prop: "_SecondaryNoiseStrengthGround", propType: { type: "uniform" },
								extras: { min: -1.0, max: 1.0, addSlider: true }
							},
						]
					},

					{
						label: "Size",
						props: [
							{
								label: "Water Height", prop: "_PSWaterHeight", propType: { type: "uniform" },
								extras: { min: 0.0, max: 1.0, addSlider: true }
							},
							{
								label: "Water Depth", prop: "_PSWaterDepthOffset", propType: { type: "uniform" },
								extras: { min: 0.0, max: 1.0, addSlider: true }
							},
							{
								label: "Noise Value Offset", prop: "_PSDensityOffset", propType: { type: "uniform" },
								extras: { min: 0.0, max: 0.9, addSlider: true }
							},
							{
								label: "Max Height", prop: "_PSMaxHeightOffset", propType: { type: "uniform" },
								tooltip: "From Water Height", extras: { min: -1.0, max: 1.0, addSlider: true }
							},
						]
					},

					{
						label: "Misc",
						props: [
							{ label: "Max Screw", prop: "_MaxScrewTerrain", propType: { type: "uniform" }, extras: { min: 0.0, max: 0.5, addSlider: true } },
							{ label: "Min Light", prop: "_SurfaceMinLight", propType: { type: "uniform" } },
						]
					},

					{
						label: "Voxelizer",
						props: [
							{ label: "Enable Voxels", prop: "_EnableVoxelizer", propType: { type: "uniform" } },
							{ label: "Grid Half Size", prop: "_GridHalfSize", propType: { type: "uniform" } },
							{ label: "Normal Interpolator", prop: "_VoxelNormalInterp", propType: { type: "uniform" } },
						]
					}
				]
			},
			{
				label: "Water",
				groups: [
					{
						label: "Enable",
						props: [
							{ label: "Show water", prop: "_showWater", propType: { type: "uniform" } },
						]
					},
					{
						label: "Color",
						props: [
							{ label: "Color 1 - Depth 0", prop: "_WaterColor", propType: { type: "uniform" } },
							{ label: "Color 2 - Depth 1", prop: "_WaterColorDepth", propType: { type: "uniform" } },
							{ label: "Specular Color", prop: "_WaterSpecularColor", propType: { type: "uniform" } },
							{ label: "Depth Remap", prop: "_WaterMaterialSmoothStep", propType: { type: "uniform" } },
						]
					},
					{
						label: "Lighting",
						props: [
							{ label: "Min Light", prop: "_WaterSurfaceMinLight", propType: { type: "uniform" }, extras: { min: 0.0, max: 0.5, addSlider: true }},
							{ label: "Specular Pow - Mult", prop: "_SpecularParams", propType: { type: "uniform" } },
						]
					},
					{
						label: "Normal",
						props: [
							{ label: "Normal Scale", prop: "_WaterNormalScale", propType: { type: "uniform" } },
							{ label: "Normal Strength", prop: "_WaterNormalStrength", propType: { type: "uniform" } }
						]
					},
					{
						label: "Misc",
						props: [
							{ label: "Speed", prop: "_WaterMoveSpeed", propType: { type: "uniform" } }
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
							{ label: "Color Shadowed", prop: "_CloudColor1", tooltip: "Color of the shadowed areas", propType: { type: "uniform" } },
							{ label: "Color Lit", prop: "_CloudColor2", propType: { type: "uniform" } },
							{ label: "Transparency", prop: "_CloudTransparency", propType: { type: "uniform" }, extras: { min: 0.0, max: 1.0, addSlider: true } },
						]
					},
					{
						label: "Size",
						props: [
							{ label: "Cloud Height", prop: "_CloudMidDistance", propType: { type: "uniform" }, extras: { min: 0.0, max: 1.0, addSlider: true } },
							{ label: "Half Height", prop: "_CloudHalfHeight", propType: { type: "uniform" }, extras: { min: 0.0, max: 0.2, addSlider: true } }
						]
					},
					{
						label: "Noise Settings",
						props: [
							{ label: "Noise Scales", prop: "_CloudNoiseScales", propType: { type: "uniform" } },
							{ label: "Noise Offset", prop: "_CloudNoiseOffset", propType: { type: "uniform" } },
							{ label: "Global Noise", prop: "_CloudNoiseGlobalScale", propType: { type: "uniform" } },
							{ label: "Secondary Noise", prop: "_SecondaryNoiseStrength", propType: { type: "uniform" } },
							{ label: "Noise Multiplier", prop: "_CloudDensityMultiplier", propType: { type: "uniform" } },
							{ label: "Noise Value Offset", prop: "_CloudDensityOffset", propType: { type: "uniform" } },
						]
					},
					{
						label: "Posterize",
						props: [
							{ label: "Posterize", prop: "_CloudsPosterize", propType: { type: "uniform" } },
							{ label: "Count", prop: "_CloudsPosterizeCount", propType: { type: "uniform" } }
						]
					},
					{
						label: "Misc",
						props: [
							{ label: "Max Screw", prop: "_MaxScrewCloud", propType: { type: "uniform" }, extras: { min: 0.0, max: 10.0, addSlider: true } },
							{ label: "Cloud Move Speed", prop: "_CloudMoveSpeed", propType: { type: "uniform" }, extras: { min: -1.0, max: 1.0, addSlider: true } },
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
							{ label: "Color", prop: "_AmbientColor", propType: { type: "uniform" } },
							{ label: "Power", prop: "_AmbientPower", propType: { type: "uniform" } }
						]
					}
				]
			}
		];
	}
}