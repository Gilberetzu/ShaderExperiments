import FragVaryingsUniforms from "./FragmentVaryingsUniforms.glsl?raw";
import FragmentShader from "./FragShader.glsl?raw";
import VertexShader from "./VertShader.glsl?raw";

import InterleavedGradientNoise from "../Utils/InterleavedGradientNoise.glsl?raw";
import Noise3d from "../Utils/Noise3d.glsl?raw";
import Voronoi3d from "../Utils/Voronoi3d.glsl?raw";
import UnityRotateAboutAxis from "../Utils/UnityRotateAboutAxis.glsl?raw";
import SphereRayIntersection from "../Utils/SphereIntersection.glsl?raw";

import * as THREE from 'three';

const StarFragmentShader = [
	FragVaryingsUniforms,
	SphereRayIntersection,
	UnityRotateAboutAxis,
	InterleavedGradientNoise,
	Noise3d,
	Voronoi3d,
	FragmentShader
]

export default {
	fs: StarFragmentShader.join('\n'),
	vs: VertexShader,
	uniforms: {
		_iTime: {value: 0.0},

		_heightMaskInvLerp: {value: new THREE.Vector2(0.75, 1.0)},
		_heightMask: {value: new THREE.Vector2(0.75, 1.2)},
		_expansionSpeed: {value: 0.25},
		_expansionScale: {value: 14.0},
		_expansionScaleHeightOffset: {value: 2.0},
		_expansionDistance: {value: 4.0},
		
		_screwHeightMaskMultiplier: {value: 0.25},
		_screwInterpMultiplier: {value: 0.5},
		_screwMultiplier: {value: 0.0},

		_voronoiScale: {value: 3.0},
		_noiseSample2Scale: {value: 0.5},
		
		_fresnelPower: {value: 2.5},
		_fresnelRemap: {value: new THREE.Vector2(0.0, 0.5)},
		
		_color1: {value: new THREE.Color(1.0, 0.95, 0.4)},
		_color2: {value: new THREE.Color(1.0,1.0,0.2)},

		_radius: {value: 0.7},

		_densityMultiplier: {value: 0.5},
		
		_fireRemapMax: {value: 0.9},
		_fireColor: {value: new THREE.Color(0.95, 0.4, 0.2)},

		_outerLightPower: {value: 2.0},
		_outerColor: {value: new THREE.Color(1.0, 0.95, 0.8)}
	}
};
// height mask inv lerp || vector 2 (1.0, 0.75) reverse to use with vector 2 range object
// height mask rotaiton || vector 2 (0.75, 1.2)
//expansion speed || float 0.25
// scale || float 14.0
// scale height offset || float 2.0
//flow distance || float 4.0

// screw Height mask multiplier || float 0.25
// screw interp mult || float 0.5
//rot multiplier || float 0.0

//voronoi scale || float 3.0
//secondary noise sample scale || 0.5

//fresnel power || float 2.5
//fresnel remap || vector 2 (0.0, 0.5)

//color 1 || vec3 (1.0,0.95,0.4)
//color 2 || vec3 (1.0,1.0,0.2)

//Star radius || float 0.7

//density multiplier || float 0.5

//Star Fire Height Color Remap smooth step max || float 0.9
//Outer color || vector 3 (0.95,0.4,0.2)

//Outer light power || float 2.0
// Outer color || vector 3 (1.0,0.95,0.8)