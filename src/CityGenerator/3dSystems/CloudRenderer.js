import * as THREE from 'three';
import PerlinNoise from '../Math/PerlinNoise';
import Vec2 from '../Math/Vec2';
import Vec3 from '../Math/Vec3';

import VoronoiNoise3D from '../GPUNoise/Voronoi3D';

import CloudRenderFragmentShader from 	"../Shaders/CloudRenderShader/FragmentShader.glsl?raw";
import CloudRenderVertexShader from 	"../Shaders/CloudRenderShader/VertexShader.glsl?raw";

import CloudPassthroughTestFragmentShader from 	"../Shaders/CloudPassthroughTest/FragmentShader.glsl?raw";
import CloudPassthroughTestVertexShader from 	"../Shaders/CloudPassthroughTest/VertexShader.glsl?raw";

import BlurUpsampleVertexShader from 	"../Shaders/CloudBlurUpsampleShader/VertexShader.glsl?raw";
import BlurFragmentShader from 	"../Shaders/CloudBlurUpsampleShader/BlurShader/FragmentShader.glsl?raw";
import UpsampleFragmentShader from 	"../Shaders/CloudBlurUpsampleShader/BlurShader/FragmentShader.glsl?raw";

import KawaseBlurFragmentShader from 	"../Shaders/KawaseBlur/FragmentShader.glsl?raw";
import KawaseBlurVertexShader from 	"../Shaders/KawaseBlur/VertexShader.glsl?raw";

export default class CloudRenderer{
	constructor(postProcessGeometry, colorTexture, cameraController, lightController, renderer, postProcessCamera){
		this.shapeNoise = new PerlinNoise(256,8);
		this.shapeNoiseTex = this.shapeNoise.generateDataTexture();
		this.currentTime = 0;

		this.voronoiNoise = new VoronoiNoise3D(renderer, postProcessGeometry, postProcessCamera);

		this.size = window.CityGenerator.getContainerSize();
		
		this.cloudTextureBlur1 = new THREE.WebGLRenderTarget(this.size.width/2, this.size.height/2, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		this.cloudTextureBlur2 = new THREE.WebGLRenderTarget(this.size.width/4, this.size.height/4, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		this.cloudTextureBlur3 = new THREE.WebGLRenderTarget(this.size.width/8, this.size.height/8, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});

		this.cloudTexture = new THREE.WebGLRenderTarget(this.size.width, this.size.height, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		this.cloudTexture1 = new THREE.WebGLRenderTarget(this.size.width/2, this.size.height/2, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		this.cloudTexture2 = new THREE.WebGLRenderTarget(this.size.width/4, this.size.height/4, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});

		this.cloudRenderTexture = new THREE.WebGLRenderTarget(this.size.width / 8, this.size.height / 8, { //Over 8
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});

		this.cloudKawaseTexture = new THREE.WebGLRenderTarget(this.size.width, this.size.height, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});

		this.cloudRenderMaterial = new THREE.ShaderMaterial({
			vertexShader: CloudRenderVertexShader,
			fragmentShader: CloudRenderFragmentShader,
			uniforms: {
				dTex: {
					value: colorTexture.depthTexture
				},
				cameraNear: {
					value: cameraController.camera.near
				},
				cameraFar: {
					value: cameraController.camera.far
				},
				camProjectionInverse:{
					value: cameraController.camera.projectionMatrixInverse
				},
				camMatrixWorld:{
					value: cameraController.camera.matrixWorld
				},
				camPosition:{
					value: cameraController.camera.position
				},
				boundsMin:{
					value: new THREE.Vector3(3,5,3)
				},
				boundsMax:{
					value: new THREE.Vector3(15,8,15)
				},
				maxStepCount:{
					value: 64
				},
				maxStepCountSun:{
					value: 12
				},
				
				stepSize:{
					value: 0.025
				},
				stepSizeSun:{
					value: 0.2
				},

				densityMultiplier:{
					value: 1.0
				},
				densityMultiplierSun:{
					value: 1.0,
				},

				depthBias:{
					value: 1.0
				},
				lightDirection:{
					value: lightController.getLightDirection()
				},
				shapeNoise:{
					value: this.shapeNoiseTex
				},
				scatteringConstant:{
					value: 0.60
				},
				voronoiTex:{
					value: this.voronoiNoise.texture
				},
				time:{
					value: 0
				}
			}
		});

		this.cloudPassthroughTestMaterial = new THREE.ShaderMaterial({
			fragmentShader: CloudPassthroughTestFragmentShader,
			vertexShader: CloudPassthroughTestVertexShader,
			uniforms: {
				colorTexture: {
					value: colorTexture.texture
				},
				cloudTexture:{
					value: this.cloudKawaseTexture.texture
				}
			}
		});

		this.cloudBlurShaderMaterial = new THREE.ShaderMaterial({
			fragmentShader: BlurFragmentShader,
			vertexShader: BlurUpsampleVertexShader,
			uniforms: {
				cloudTex:{
					value: this.cloudRenderTexture.texture
				},
				mipLevel:{
					value: 0
				},
				texelSize: {
					value: new THREE.Vector2(8/this.size.width, 8/this.size.height)
				}
			}
		});
		this.cloudUpsampleShaderMaterial = new THREE.ShaderMaterial({
			fragmentShader: UpsampleFragmentShader,
			vertexShader: BlurUpsampleVertexShader,
			uniforms: {
				cloudTex:{
					value: this.cloudTextureBlur3.texture
				},
				mipLevel:{
					value: 3
				}
			}
		});

		this.kawaseBlurShaderMaterial = new THREE.ShaderMaterial({
			fragmentShader: KawaseBlurFragmentShader,
			vertexShader: KawaseBlurVertexShader,
			uniforms: {
				colorTexture:{
					value: this.cloudTexture.texture
				},
				windowSize:{
					value: 2
				},
				mulOffset:{
					value: 1.5
				},
				texelSize:{
					value: new THREE.Vector2(1/this.size.width, 1/this.size.height)
				}
			}
		})

		this.boundsMinXZ = new Vec3(0,0,0);
		this.boundsMaxXZ = new Vec3(0,0,0);

		this.cloudHeights = new Vec2(5,10);

		this.cloudRenderMesh = new THREE.Mesh(postProcessGeometry, this.cloudRenderMaterial);
		this.cloudBlurRenderMesh = new THREE.Mesh(postProcessGeometry, this.cloudBlurShaderMaterial);
		this.cloudUpsampleRenderMesh = new THREE.Mesh(postProcessGeometry, this.cloudUpsampleShaderMaterial);
		this.cloudPassthroughTestMesh = new THREE.Mesh(postProcessGeometry, this.cloudPassthroughTestMaterial);
		this.kawaseBlurRenderMesh = new THREE.Mesh(postProcessGeometry, this.kawaseBlurShaderMaterial);
	}

	update(dt, cameraController, colorTexture, lightController){
		this.currentTime += dt;
		this.cloudRenderMaterial.uniforms.dTex.value = colorTexture.depthTexture;
		this.cloudRenderMaterial.uniforms.camProjectionInverse.value = cameraController.camera.projectionMatrixInverse;
		this.cloudRenderMaterial.uniforms.camMatrixWorld.value = cameraController.camera.matrixWorld;
		this.cloudRenderMaterial.uniforms.camPosition.value = cameraController.camera.position;
		this.cloudRenderMaterial.uniforms.lightDirection.value = lightController.getLightDirection();
		this.cloudRenderMaterial.uniforms.time.value = this.currentTime / 1000;
	}
	
	setCloudRenderSpace(boundsMin, boundsMax){
		this.boundsMinXZ = boundsMin;
		this.boundsMaxXZ = boundsMax;

		this.setCloudBounds();
	}

	setCloudBounds(){
		this.cloudRenderMaterial.uniforms.boundsMin.value = new THREE.Vector3(this.boundsMinXZ.x, this.cloudHeights.x, this.boundsMinXZ.z);
		this.cloudRenderMaterial.uniforms.boundsMax.value = new THREE.Vector3(this.boundsMaxXZ.x, this.cloudHeights.y, this.boundsMaxXZ.z);
		const stepSize = Vec2.Length(
			Vec2.Subtract(
				new Vec2(this.boundsMaxXZ.x, this.boundsMaxXZ.z),
				new Vec2(this.boundsMinXZ.x, this.boundsMinXZ.z) 
			)
		) / 64;
		this.cloudRenderMaterial.uniforms.stepSize.value = stepSize;
		this.cloudRenderMaterial.uniforms.stepSizeSun.value = stepSize * 2;
	}

	render(renderer, postProcessCamera){
		if (window.spector) {
			spector.setMarker("Render Cloud");
		}
		renderer.setRenderTarget(this.cloudRenderTexture, undefined, 0);
		renderer.clear(true, true);
		renderer.render(this.cloudRenderMesh, postProcessCamera);
		if (window.spector) {
			spector.clearMarker();
		}

		if (window.spector) {
			spector.setMarker("First Blur");
		}
		
		renderer.setRenderTarget(this.cloudTextureBlur3);
		this.cloudBlurShaderMaterial.uniforms.cloudTex.value = this.cloudRenderTexture.texture;
		this.cloudBlurShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudBlurShaderMaterial.uniforms.texelSize.value = new THREE.Vector2(7/this.size.width, 7/this.size.height);
		this.cloudBlurShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudBlurRenderMesh, postProcessCamera);
		
		if (window.spector) {
			spector.clearMarker();
		}

		renderer.setRenderTarget(this.cloudTexture2);
		this.cloudUpsampleShaderMaterial.uniforms.cloudTex.value = this.cloudTextureBlur3.texture;
		this.cloudUpsampleShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudUpsampleShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudUpsampleRenderMesh, postProcessCamera);

		renderer.setRenderTarget(this.cloudTextureBlur2);
		this.cloudBlurShaderMaterial.uniforms.cloudTex.value = this.cloudTexture2.texture;
		this.cloudBlurShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudBlurShaderMaterial.uniforms.texelSize.value = new THREE.Vector2(3.5/this.size.width, 3.5/this.size.height);
		this.cloudBlurShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudBlurRenderMesh, postProcessCamera);

		renderer.setRenderTarget(this.cloudTexture1);
		this.cloudUpsampleShaderMaterial.uniforms.cloudTex.value = this.cloudTextureBlur2.texture;
		this.cloudUpsampleShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudUpsampleShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudUpsampleRenderMesh, postProcessCamera);

		renderer.setRenderTarget(this.cloudTextureBlur1);
		this.cloudBlurShaderMaterial.uniforms.cloudTex.value = this.cloudTexture1.texture;
		this.cloudBlurShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudBlurShaderMaterial.uniforms.texelSize.value = new THREE.Vector2(1.75/this.size.width, 1.75/this.size.height);
		this.cloudBlurShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudBlurRenderMesh, postProcessCamera);

		if (window.spector) {
			spector.setMarker("Final Upsample");
		}

		renderer.setRenderTarget(this.cloudTexture);
		this.cloudUpsampleShaderMaterial.uniforms.cloudTex.value = this.cloudTextureBlur1.texture;
		this.cloudUpsampleShaderMaterial.uniforms.mipLevel.value = 0;
		this.cloudUpsampleShaderMaterial.needsUpdate = true;
		renderer.render(this.cloudUpsampleRenderMesh, postProcessCamera);

		if (window.spector) {
			spector.clearMarker();
		}

		if (window.spector) {
			spector.setMarker("Kawase Blur");
		}
		renderer.setRenderTarget(this.cloudKawaseTexture);
		this.kawaseBlurShaderMaterial.uniforms.colorTexture.value = this.cloudTexture.texture;
		this.kawaseBlurShaderMaterial.needsUpdate = true;
		renderer.render(this.kawaseBlurRenderMesh, postProcessCamera);

		if (window.spector) {
			spector.clearMarker();
		}
	}

	mergeColorCloud(renderer, postProcessCamera, colorCloudMergeTexture){
		renderer.setRenderTarget(colorCloudMergeTexture);
		renderer.render(this.cloudPassthroughTestMesh, postProcessCamera);
	}
}