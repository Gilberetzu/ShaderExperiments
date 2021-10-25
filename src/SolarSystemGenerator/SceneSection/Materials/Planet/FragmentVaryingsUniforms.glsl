varying vec3 vPosition;
varying vec3 viewVector;
varying mat4 modelMatrixFrag;
//varying vec3 vNormal;

uniform float iTime;

//Planet parameters
uniform vec3 _PSNoiseOffset;
uniform float _PSNoiseGlobalScale;
uniform float _PSWaterHeight;
uniform float _PSWaterDepthOffset;
uniform float _PSMaxHeightOffset;

uniform vec3 _PlanetColor1;
uniform vec3 _PlanetColor2;
uniform vec2 _PlanetHighInterpRange;

uniform vec2 _PSNoiseScales;
uniform float _SecondaryNoiseStrengthGround;
uniform float _MaxScrewTerrain;
uniform float _PSDensityOffset;
uniform float _SurfaceMinLight;

uniform float _GridHalfSize;
uniform float _VoxelNormalInterp;
uniform bool _EnableVoxelizer;

uniform float _PlanetSurfaceWaterStepSize;
uniform float _PlanetSurfaceWaterMaxStepCount;

//Ocean uniforms
uniform bool _showWater;
uniform vec3 _WaterColorDepth;
uniform vec3 _WaterColor;
uniform vec3 _WaterSpecularColor;
uniform vec2 _WaterMaterialSmoothStep;
uniform float _WaterNormalScale;
uniform float _WaterSurfaceMinLight;
uniform float _WaterNormalStrength;
uniform vec2 _SpecularParams;
uniform float _WaterMoveSpeed;

//Cloud parameters
uniform float _CloudTransparency;
uniform vec3 _CloudColor1;
uniform vec3 _CloudColor2;
uniform float _MaxScrewCloud;
uniform float _BreakDistanceCloud;
uniform float _CloudMidDistance;
uniform float _CloudHalfHeight;
uniform vec2 _CloudNoiseScales;
uniform vec3 _CloudNoiseOffset;
uniform float _CloudNoiseGlobalScale;
uniform float _SecondaryNoiseStrength;
uniform float _CloudDensityMultiplier;
uniform float _CloudDensityOffset;
uniform float _CloudMoveSpeed;

uniform float _CloudsStepSize;
uniform float _CloudsMaxStepCount;

uniform bool _CloudsPosterize;
uniform float _CloudsPosterizeCount;

//Ambient Parameters
uniform vec3 _AmbientColor;
uniform float _AmbientPower;

//Misc
uniform float _CylinderHeight;
uniform float _CylinderRad;

const vec3 lDirection = normalize(vec3(1,0,1));