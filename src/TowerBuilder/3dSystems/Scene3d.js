import * as THREE from 'three';
import CameraController from "./CameraController";
import Num from '../Math/Num';
import Draw from '../Draw';
import LightController from './LightController';
import Vec3 from '../Math/Vec3';
import Vec2 from '../Math/Vec2';

import CloudRenderer from './CloudRenderer';

import BGFragmentShader from 	"../Shaders/BackgroundShader/FragmentShader.glsl?raw";
import BGVertexShader from 		"../Shaders/BackgroundShader/VertexShader.glsl?raw";

import TestPSFragmentShader from 	"../Shaders/TestPostProcess/FragmentShader.glsl?raw";
import TestPSVertexShader from 		"../Shaders/TestPostProcess/VertexShader.glsl?raw";
import VerticalGroup from '../UISystems/VerticalGroup';

import Checkbox, {CheckboxStyle} from '../UISystems/Checkbox';
import PixiButton, { ButtonStyle } from '../UISystems/Button';
import { commonStyles } from '../UISystems/Styles';
import CollapsableSection from '../UISystems/CollapsableSection';
import Slider from '../UISystems/Slider';

export default class Scene3d{
	constructor(canvasHTMLElement){
		this.size = window.TowerBuilder.getContainerSize();
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( Draw.HexColor(0.05,0.05,0.1) );
		
		this.saveNextRender = false;

		this.renderer = new THREE.WebGLRenderer({
			canvas: canvasHTMLElement,
		});
		this.renderer.autoClearColor = false;

		this.renderer.setSize( this.size.width, this.size.height);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.cameraController = new CameraController(this.scene);
		this.lightController = new LightController(this.scene);

		this.postProcessCamera = new THREE.OrthographicCamera(-1,1,1,-1, 0, 1);
		this.postProcessGeometry = new THREE.BufferGeometry();
		this.postProcessGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 
			-1,  1, 0, 
			-1, -1, 0,
			 1, -1, 0,

			-1,  1, 0, 
			 1, -1, 0,
			 1,  1, 0,], 3 ) );
		this.postProcessGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 
			0, 1, 
			0, 0, 
			1, 0,
			
			0, 1,
			1, 0,
			1, 1], 2 ) );

		this.colorTexture = new THREE.WebGLRenderTarget(this.size.width, this.size.height, {
			depthBuffer: true,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		this.colorTexture.depthTexture = new THREE.DepthTexture();
		this.colorTexture.depthTexture.format = THREE.DepthFormat;
		this.colorTexture.depthTexture.type = THREE.FloatType;

		this.colorCloudMergeTexture = new THREE.WebGLRenderTarget(this.size.width, this.size.height, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});

		this.cloudRenderer = new CloudRenderer(
			this.postProcessGeometry, this.colorTexture, this.cameraController, this.lightController, this.renderer, this.postProcessCamera);

		this.postPRocessMaterial = new THREE.ShaderMaterial({
			vertexShader: TestPSVertexShader,
			fragmentShader: TestPSFragmentShader,
			uniforms: {
				texelSize: {
					value: new THREE.Vector2(1/this.size.width, 1/this.size.height)
				},
				colorTexture: {
					value: this.colorTexture.texture
				},
				dTex: {
					value: this.colorTexture.depthTexture
				},
				cameraNear: {
					value: this.cameraController.camera.near
				},
				cameraFar: {
					value: this.cameraController.camera.far
				},
				camProjectionInverse:{
					value: this.cameraController.camera.projectionMatrixInverse
				},
				camMatrixWorld:{
					value: this.cameraController.camera.matrixWorld
				},
				camPosition:{
					value: this.cameraController.camera.position
				},
				outputState:{
					value: 0
				}
			}
		});
		
		this.postProcessMesh = new THREE.Mesh(this.postProcessGeometry, this.postPRocessMaterial);

		/*this.postProcess = new THREE.WebGLRenderTarget(this.size.width, this.size.height, {
			depthBuffer: false,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		})*/

		

		const gridHelper = new THREE.GridHelper( 10, 10, Draw.HexColor(1.0,0.2,0.2), Draw.HexColor(0.3,1.0,0.2));
		gridHelper.position.y = -0.01;
		const gridHelperVertical = new THREE.GridHelper( 10, 10, Draw.HexColor(1.0,0.2,0.2), Draw.HexColor(0.3,1.0,0.2));
		gridHelperVertical.rotateX(Num.DegToRad(90));

		//this.scene.add( gridHelper );
		//this.scene.add( gridHelperVertical );

		this.backgroundMaterial = new THREE.ShaderMaterial(
			{
				side: THREE.BackSide,
				vertexShader: BGVertexShader,
				fragmentShader: BGFragmentShader,
				uniforms: {
					seaColor: {
						value: new THREE.Color(0x007FC7)
					},
					skyColor: {
						value: new THREE.Color(0xDCFAFC)
					},
					sunColor: {
						value: new THREE.Color(0xF2F2B1)
					},
					lightDirection: {
						value: this.lightController.getLightDirection()
					}
				}
			}
		);
		const bgGeometry = new THREE.SphereGeometry(400, 16, 16);
		this.bgMesh = new THREE.Mesh(
			bgGeometry,
			this.backgroundMaterial
		);

		this.scene.add(this.bgMesh);
	}

	resizeTargets(){
		this.size = window.TowerBuilder.getContainerSize();
		this.renderer.setSize(this.size.width, this.size.height, false);
		this.colorTexture.setSize(this.size.width, this.size.height);
		this.colorCloudMergeTexture.setSize(this.size.width, this.size.height);
		this.postPRocessMaterial.uniforms.texelSize.value = new THREE.Vector2(1/this.size.width, 1/this.size.height);
		this.cameraController.resize();
		this.cloudRenderer.resizeTargets();
	}

	enter3dScene(){
		console.log("add called");
		window.TowerBuilder.addUIElement((container)=>{
			const options = new CollapsableSection("Options",container, Draw.HexColor(0.1,0.1,0.1), new Vec2(25,10), 0, 0x000000, 5);
			
			const normalCheck = new Checkbox("Normal", commonStyles.baseCheckbox, (state)=>{}, true);
			const outlineCheck = new Checkbox("Only outlines", commonStyles.baseCheckbox, (state)=>{}, false);
			const colorCheck = new Checkbox("Only color", commonStyles.baseCheckbox, (state)=>{}, false);
			const outlineWB = new Checkbox("Only Outline WB", commonStyles.baseCheckbox, (state)=>{}, false);
			const outlineBW = new Checkbox("Only Outline BW", commonStyles.baseCheckbox, (state)=>{}, false);
			
			const saveRender = new PixiButton("Render", commonStyles.baseButton, ()=>{
				this.saveNextRender = true;
			});

			const sliderTest = new Slider(0.0,-1.0,1.0,(v)=>{
				this.cloudRenderer.cloudRenderMaterial.uniforms.cloudCoverage.value = v;
			}, 100, "Cloud coverage");

			const resetOptions = new PixiButton("Reset", commonStyles.baseButton, ()=>{
				this.cloudRenderer.cloudRenderMaterial.uniforms.cloudCoverage.value = 0.0;
				sliderTest.value = 0.0;
				outlineCheck.state = false;
				colorCheck.state = false;
				outlineBW.state = false;
				outlineWB.state = false;
				normalCheck.state = true;
				this.postPRocessMaterial.uniforms.outputState.value = 0;
			});

			normalCheck.callback = (state)=>{
				if(!state){
					normalCheck.state = true;
					this.postPRocessMaterial.uniforms.outputState.value = 0;
				}else{
					this.postPRocessMaterial.uniforms.outputState.value = 0;
					outlineCheck.state = false;
					colorCheck.state = false;
					outlineBW.state = false;
					outlineWB.state = false;
				}
			}

			outlineCheck.callback = (state)=>{
				if(!state){
					this.postPRocessMaterial.uniforms.outputState.value = 0;
					normalCheck.state = true;
				}else{
					this.postPRocessMaterial.uniforms.outputState.value = 1;
					normalCheck.state = false;
					colorCheck.state = false;
					outlineBW.state = false;
					outlineWB.state = false;
				}
			}

			colorCheck.callback = (state)=>{
				if(!state){
					this.postPRocessMaterial.uniforms.outputState.value = 0;
					normalCheck.state = true;
				}else{
					this.postPRocessMaterial.uniforms.outputState.value = 2;
					normalCheck.state = false;
					outlineCheck.state = false;
					outlineBW.state = false;
					outlineWB.state = false;
				}
			}

			outlineWB.callback = (state)=>{
				if(!state){
					this.postPRocessMaterial.uniforms.outputState.value = 0;
					normalCheck.state = true;
				}else{
					this.postPRocessMaterial.uniforms.outputState.value = 3;
					normalCheck.state = false;
					outlineCheck.state = false;
					colorCheck.state = false;
					outlineBW.state = false;
				}
			}

			outlineBW.callback = (state)=>{
				if(!state){
					this.postPRocessMaterial.uniforms.outputState.value = 0;
					normalCheck.state = true;
				}else{
					this.postPRocessMaterial.uniforms.outputState.value = 4;
					normalCheck.state = false;
					outlineCheck.state = false;
					colorCheck.state = false;
					outlineWB.state = false;
				}
			}
			
			options.addElement(normalCheck, normalCheck.container, 0);
			options.addElement(outlineCheck, outlineCheck.container, 10);
			options.addElement(colorCheck, colorCheck.container, 10);
			options.addElement(outlineWB, outlineWB.container, 10);
			options.addElement(outlineBW, outlineBW.container, 10);
			options.addElement(saveRender, saveRender.container, 20);
			options.addElement(sliderTest, sliderTest.container, 10);
			options.addElement(resetOptions, resetOptions.container, 10);
			options.sectionContainer.position.set(options.container.width/2 + 10, options.bgPadding.y / 2 + 10);
			return options;
		});
	}

	getCloudUniforms(){
		const cloudUniforms = {
			cloudShapeTex:{
				value: null
			},
			cloudBoundsMin:{
				value: null
			},
			cloudBoundsMax:{
				value: null
			},
			cloudTime:{
				value: null
			},
			cloudCoverage:{
				value: null
			}
		};
		this.updateCloudUniforms(cloudUniforms);
		return cloudUniforms;
	}

	updateCloudUniforms(uniforms){
		uniforms.cloudShapeTex.value = this.cloudRenderer.shapeNoiseTex;
		uniforms.cloudBoundsMin.value = this.cloudRenderer.cloudRenderMaterial.uniforms.boundsMin.value;
		uniforms.cloudBoundsMax.value = this.cloudRenderer.cloudRenderMaterial.uniforms.boundsMax.value;
		uniforms.cloudTime.value = this.cloudRenderer.cloudRenderMaterial.uniforms.time.value;
		uniforms.cloudCoverage.value = this.cloudRenderer.cloudRenderMaterial.uniforms.cloudCoverage.value;
	}

	getDirectionalLightUniforms(){
		const lightUniform ={
			directionalLightShadow:{
				value:null
			},
			directionalShadowMatrix:{
				value: null
			},
			directionalShadowMap: {
				value: null
			},
			lightDirection: {
				value: null
			}
		};
		this.updateLightUniforms(lightUniform);
		return lightUniform;
	}

	updateLightUniforms(uniforms){
		uniforms.directionalLightShadow.value = {
			shadowBias: this.lightController.light.shadow.bias,
			shadowNormalBias: this.lightController.light.shadow.normalBias,
			shadowRadius: this.lightController.light.shadow.radius,
			shadowMapSize: this.lightController.light.shadow.mapSize
		};
		uniforms.directionalShadowMatrix.value = this.lightController.light.shadow.matrix;
		uniforms.directionalShadowMap.value = this.lightController.light.shadow.map;
		uniforms.lightDirection.value = this.lightController.getLightDirection();
	}

	update(dt){
		Vec3.Copy(this.cameraController.camera.position, this.bgMesh.position);
		this.backgroundMaterial.uniforms.lightDirection.value = this.lightController.getLightDirection();
		let inputStore = window.TowerBuilder.input;
		this.cameraController.cameraMovementAndRotation(inputStore, dt);
		this.lightController.followCamera(this.cameraController.camera);

		this.postPRocessMaterial.uniforms.colorTexture.value = this.colorCloudMergeTexture.texture;
		this.postPRocessMaterial.uniforms.dTex.value = this.colorTexture.depthTexture;
		this.postPRocessMaterial.uniforms.camProjectionInverse.value = this.cameraController.camera.projectionMatrixInverse;
		this.postPRocessMaterial.uniforms.camMatrixWorld.value = this.cameraController.camera.matrixWorld;
		this.postPRocessMaterial.uniforms.camPosition.value = this.cameraController.camera.position;

		this.cloudRenderer.update(dt, this.cameraController, this.colorTexture, this.lightController);
	}

	setCloudRenderSpace(boundsMin, boundsMax){
		this.cloudRenderer.setCloudRenderSpace(boundsMin, boundsMax);
	}

	render(){
		if (window.spector) {
			spector.setMarker("Render Scene");
		}
		
		this.renderer.setRenderTarget(this.colorTexture);
		this.renderer.clear(true, true);
		this.renderer.render(this.scene, this.cameraController.camera);

		if (window.spector) {
			spector.clearMarker();
		}

		this.cloudRenderer.render(this.renderer, this.postProcessCamera);
		this.cloudRenderer.mergeColorCloud(this.renderer, this.postProcessCamera, this.colorCloudMergeTexture);

		if (window.spector) {
			spector.setMarker("Render outline and scene");
		}
		this.renderer.setRenderTarget(null);
		this.renderer.clear(true, true);
		this.renderer.render(this.postProcessMesh, this.postProcessCamera);

		if (window.spector) {
			spector.clearMarker();
		}

		if(this.saveNextRender){
			this.saveNextRender = false;
			window.TowerBuilder.saveThreeRender();
		}
	}
}