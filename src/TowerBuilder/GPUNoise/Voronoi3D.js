import * as THREE from 'three';
import { DataTexture } from 'three';
import Num from '../Math/Num';
import Vec3 from '../Math/Vec3';

import VoronoiFragmentShader from 	"./Shader/FragmentShader.glsl?raw";
import VoronoiVertexShader from 	"./Shader/VertexShader.glsl?raw";

export default class VoronoiNoise3D{
	constructor(renderer, postProcessingGeometry, postProcessCamera){
		//2048 - 16
		//1024 - 8

		const pArray0 = new Float32Array(8*8*8 *3);
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				for (let k = 0; k < 8; k++) {
					const index = (i + j*8 + k*8*8) * 3;
					const randVec = Vec3.Random();
					pArray0[index] = randVec.x;
					pArray0[index + 1] = randVec.x;
					pArray0[index + 2] = randVec.x;
				}
			}
		}

		const points0Tex = new DataTexture(pArray0, 512, 1, THREE.RGBFormat, THREE.FloatType, THREE.UVMapping, THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,
			THREE.NearestFilter, THREE.NearestFilter);

		/*const pArray1 = new Array(16*16*16);
		for (let i = 0; i < 16; i++) {
			for (let j = 0; j < 16; j++) {
				for (let k = 0; k < 16; k++) {
					const index = i + j*16 + k*16*16;
					pArray1[index] = (new THREE.Vector3()).random();
				}
			}
		}*/

		this.voronoiRenderTarget = new THREE.WebGLRenderTarget(2048, 1024,{
			depthTexture: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});

		this.voronoiRenderMaterial = new THREE.ShaderMaterial({
			vertexShader: VoronoiVertexShader,
			fragmentShader: VoronoiFragmentShader,
			uniforms:{
				points0Tex:{
					value: points0Tex
				},
				/*points1:{
					value: pArray1
				},*/
				texelSize:{
					value: new THREE.Vector2(1/2048, 1/1024)
				}
			}
		});

		this.voronoiRenderMesh = new THREE.Mesh(postProcessingGeometry, this.voronoiRenderMaterial);
		renderer.setRenderTarget(this.voronoiRenderTarget);
		renderer.render(this.voronoiRenderMesh, postProcessCamera);

		const pixelBuffer = new Float32Array(2048*1024*4);
		renderer.readRenderTargetPixels(this.voronoiRenderTarget, 0, 0, 2048, 1024, pixelBuffer);
		
		//console.log(pixelBuffer);

		const voronoiBuffer = new Float32Array(128*128*128);
		for (let i = 0; i < 128; i++) {
			for (let j = 0; j < 128; j++) {
				for (let k = 0; k < 128; k++) {
					const pixelBufferIndex = (i + (k % 16) * 128 + j * 2048 + Math.floor(k / 16) * 128 * 2048) * 4;
					//console.log(pixelBufferIndex);
					const bufferIndex = i + j * 128 + k *128 * 128;
					voronoiBuffer[bufferIndex] = pixelBuffer[pixelBufferIndex];
				}
			}
		}

		//console.log(voronoiBuffer);

		this.texture = new THREE.DataTexture3D(voronoiBuffer, 128, 128, 128);
		this.texture.format = THREE.RedFormat;
		this.texture.type = THREE.FloatType;
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.wrapR = THREE.RepeatWrapping;
		this.texture.wrapS = THREE.RepeatWrapping;
		this.texture.wrapT = THREE.RepeatWrapping;
	}
}