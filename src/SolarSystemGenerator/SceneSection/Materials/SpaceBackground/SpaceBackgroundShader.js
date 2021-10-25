import FragVaryingsUniforms from "./FragmentVaryingsUniforms.glsl?raw";
import FragmentShader from "./FragShader.glsl?raw";
import VertexShader from "./VertShader.glsl?raw";

import InterleavedGradientNoise from "../Utils/InterleavedGradientNoise.glsl?raw";
import Noise3d from "../Utils/Noise3d.glsl?raw";
import Voronoi3d from "../Utils/Voronoi3d.glsl?raw";
import UnityRotateAboutAxis from "../Utils/UnityRotateAboutAxis.glsl?raw";

import * as THREE from 'three';

const SpaceBackgroundFragmentShader = [
	FragVaryingsUniforms,
	InterleavedGradientNoise,
	Noise3d,
	Voronoi3d,
	UnityRotateAboutAxis,
	FragmentShader
]

export default {
	fs: SpaceBackgroundFragmentShader.join('\n'),
	vs: VertexShader,
	uniforms: {
		_iTime: {value: 0.0},
		_color0: {value: new THREE.Color(0.0,0.0,0.0)},
		_color1: {value: new THREE.Color(0.5,0.0,0.0)},
		_color2: {value: new THREE.Color(0.0,0.0,0.5)},
		_colorStars: {value: new THREE.Color(1.0,1.0,1.0)},

		_densityMult: {value: 1.0},

		_mainNoiseScale: {value: 0.08},
		_mainNoiseScrew: {value: 0.0},

		_noise1Mult: {value: 1.0},
		_noise1Scale: {value: 0.1},
		_noise1Screw: {value: 0.0},
		_noise1Speed: {value: 1.0},

		_noise2Mult: {value: 1.0},
		_noise2Scale: {value: 0.1},
		_noise2Screw: {value: 0.0},
		_noise2Speed: {value: 1.0},

		_noiseMaskSmoothStep: {value: new THREE.Vector2(-0.4, 0.8)},
		_noiseMaskOffset: {value: new THREE.Vector3(0.0, 0.0, 0.0)},
		_noiseMaskScale: {value: 0.02},		

		_noiseStarSmoothStep: {value: new THREE.Vector2(0.2,0.0)},
		_noiseStarScale: {value: 0.5},
		_noiseStarMaskSpeed: {value: 0.4},

		_stepSize: {value: 1.0},
		_noiseOffset: {value: new THREE.Vector3(0.0,0.0,0.0)}
	}
};