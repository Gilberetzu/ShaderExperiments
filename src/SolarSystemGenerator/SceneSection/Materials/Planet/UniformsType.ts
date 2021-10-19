import * as THREE from "three";

type PlanetUniforms = {
	iTime: { value: number },
	iResolution: { value: THREE.Vector3 },
	//Planet uniforms
	_PSNoiseOffset: { value: THREE.Vector3 },
	_PSNoiseGlobalScale: { value: number },
	_PSWaterHeight: { value: number },
	_PSWaterDepthOffset: { value: number },
	_PSMaxHeightOffset: { value: number },
	_PlanetColor1: { value: THREE.Color },
	_PlanetColor2: { value: THREE.Color },
	_PSNoiseScales: { value: THREE.Vector2 },
	_SecondaryNoiseStrengthGround: { value: number },
	_MaxScrewTerrain: { value: number },
	_PSDensityOffset: { value: number },
	_SurfaceMinLight: { value: number },
	_PlanetSurfaceWaterStepSize: { value: number },
	_PlanetSurfaceWaterMaxStepCount: { value: number },
	_GridHalfSize: { value: number },
	_VoxelNormalInterp: { value: number },
	_EnableVoxelizer: { value: boolean },
	//Ocean uniforms
	_WaterColorDepth: { value: THREE.Color },
	_WaterColor: { value: THREE.Color },
	_WaterMaterialSmoothStep: { value: THREE.Vector2 },
	_WaterNormalScale: { value: number },
	_WaterSurfaceMinLight: { value: number },
	_WaterNormalStrength: { value: number },
	_SpecularParams: { value: THREE.Vector2 },
	_WaterMoveSpeed: { value: number },
	//Cloud uniforms
	_CloudTransparency: { value: number },
	_CloudColor1: { value: THREE.Color },
	_CloudColor2: { value: THREE.Color },
	_MaxScrewCloud: { value: number },
	_BreakDistanceCloud: { value: number },
	_CloudMidDistance: { value: number },
	_CloudHalfHeight: { value: number },
	_CloudNoiseScales: { value: THREE.Vector2 },
	_CloudNoiseOffset: { value: THREE.Vector3 },
	_CloudNoiseGlobalScale: { value: number },
	_SecondaryNoiseStrength: { value: number },
	_CloudDensityMultiplier: { value: number },
	_CloudDensityOffset: { value: number },
	_CloudMoveSpeed: { value: number },
	_CloudsStepSize: { value: number },
	_CloudsMaxStepCount: { value: number },
	_CloudsPosterize: { value: boolean },
	_CloudsPosterizeCount: { value: number },
	//Ambient
	_AmbientColor: { value: THREE.Color },
	_AmbientPower: { value: number },
	//Misc
	_CylinderHeight: { value: number },
	_CylinderRad: { value: number }
}
export default PlanetUniforms;