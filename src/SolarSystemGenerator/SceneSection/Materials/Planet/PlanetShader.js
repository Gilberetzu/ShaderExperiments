import FragmentShader from "./FragmentShader.glsl?raw";
import VertexShader from "./VertexShader.glsl?raw";



import Uniforms from "./FragmentVaryingsUniforms.glsl?raw";
import InterleavedGradientNoise from "../Utils/InterleavedGradientNoise.glsl?raw";
import UnityRotateAboutAxis from "../Utils/UnityRotateAboutAxis.glsl?raw";
import Noise3d from "../Utils/Noise3d.glsl?raw";
import SphereRayIntersection from "../Utils/SphereIntersection.glsl?raw";
import SpherePlanarMapping from "../Utils/SpherePlanarMapping.glsl?raw";
import Specular from "../Utils/Specular.glsl?raw";
import ShaderMain from "./FragShader.glsl?raw";

//Uniforms > InterleavedNoise > UnityRotateAxis > 3d noise > sph intersection > sphere planar mapping > specular > shader main

const planetFragmentShader = [
	Uniforms,
	InterleavedGradientNoise,
	UnityRotateAboutAxis,
	Noise3d,
	SphereRayIntersection,
	SpherePlanarMapping,
	Specular,
	ShaderMain
]

export default {
	fs: planetFragmentShader.join("\n"),
	vs: VertexShader
};