import * as THREE from 'three';
import PlanetFragmentShader from "./PlanetShader/FragmentShader.glsl?raw";
import PlanetVertexShader from "./PlanetShader/VertexShader.glsl?raw";

const RaymarchSettingType = {
	NORMAL: 'NORMAL',
	LOW: 'LOW',
	HIGH: 'HIGH'
};

export default class SinglePlanetGen{
    constructor(canvasHtmlElement){
		this.enabled = false;
        this.canvasElement = canvasHtmlElement;

        this.lowFidelityParameters = {
            PSW_StepSize: 0.015,
            PSW_MaxStepCount: 60,
            C_StepSize: 0.05,
            C_StepCount: 60
        }
        
        this.normalFidelityParameters = {
            PSW_StepSize: 0.005,
            PSW_MaxStepCount: 100,
            C_StepSize: 0.01,
            C_StepCount: 100
        };
        
        this.highFidelityParameters = {
            PSW_StepSize: 0.0015,
            PSW_MaxStepCount: 300,
            C_StepSize: 0.0025,
            C_StepCount: 400
        };

        this.startTime = (new Date()).getTime();

        let cWidth = this.canvasElement.clientWidth;
        let cHeight = this.canvasElement.clientHeight;
        this.renderScale = 0.25;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, cWidth / cHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvasElement});

        this.renderer.setSize( cWidth, cHeight, false);

        this.planetGeometry = new THREE.SphereGeometry(1, 24, 24);

        this.uniforms = {
            iTime: { value: 1 },
            iResolution:  { value: new THREE.Vector3() },
            //Planet uniforms
            _PSNoiseOffset: {value: new THREE.Vector3(10.62, 0, 0)},
            _PSNoiseGlobalScale: {value: 1},
            _PSWaterHeight: {value: 0.5},
            _PSWaterDepthOffset: {value: 0.069},
            _PSMaxHeightOffset: {value: 0.1},
            _PlanetColor1: {value: new THREE.Color(0,0.4,0.3)},
            _PlanetColor2: {value: new THREE.Color(0.2,1,0.8)},
            _PSNoiseScales: {value: new THREE.Vector2(2,20)}, 
            _SecondaryNoiseStrengthGround: {value: 0.07},
            _MaxScrewTerrain: {value: 0},
            _PSDensityOffset: {value: 0},
            _SurfaceMinLight: {value: 0.2},
            _PlanetSurfaceWaterStepSize: {value: 0.005},
            _PlanetSurfaceWaterMaxStepCount: {value: 100},
            _GridHalfSize: {value: 30.0},
            _VoxelNormalInterp: {value: 1.0},
            _EnableVoxelizer: {value: false},
            //Ocean uniforms
            _WaterColorDepth: {value: new THREE.Color(0.1,0.1,0.3)},
            _WaterColor: {value: new THREE.Color(0.6,0.8,1)},
            _WaterMaterialSmoothStep: {value: new THREE.Vector2(4.92, 0)},
            _WaterNormalScale: {value: 12.46},
            _WaterSurfaceMinLight: {value: 0.44},
            _WaterNormalStrength: {value: 0.5},
            _SpecularParams: {value: new THREE.Vector2(3.4, 0.33)},
            _WaterMoveSpeed: {value: 0.2},
            //Cloud uniforms
            _CloudTransparency: {value: 1},
            _CloudColor1: {value: new THREE.Color(0, 0.5, 0.8)},
            _CloudColor2: {value: new THREE.Color(1, 1, 1)},
            _MaxScrewCloud: {value: 0.6},
            _BreakDistanceCloud: {value: 1.1},
            _CloudMidDistance: {value: 0.8},
            _CloudHalfHeight: {value: 0.053},
            _CloudNoiseScales: {value: new THREE.Vector2(3, 30)},
            _CloudNoiseOffset: {value: new THREE.Vector3(0,0,0)},
            _CloudNoiseGlobalScale: {value: 1.07},
            _SecondaryNoiseStrength: {value: 0.1},
            _CloudDensityMultiplier: {value: 1.14},
            _CloudDensityOffset: {value: -0.1},
            _CloudMoveSpeed: {value: 0.1},
            _CloudsStepSize: {value: 0.01},
            _CloudsMaxStepCount: {value: 100},
            _CloudsPosterize: {value: true},
            _CloudsPosterizeCount: {value: 4},
            //Ambient
            _AmbientColor: {value: new THREE.Color(0.1,0.1,0.3)},
            _AmbientPower: {value: 4.0},
            //Misc
            _CylinderHeight: {value: 5.0},
            _CylinderRad: {value: 2.88}
        };
        
        this.material = new THREE.ShaderMaterial({
            vertexShader: PlanetVertexShader,
            fragmentShader: PlanetFragmentShader,
            uniforms: this.uniforms,
        });

        this.planetMesh = new THREE.Mesh( this.planetGeometry, this.material );
        this.scene.add( this.planetMesh );

        this.camera.position.z = 2;

        this.planarMultiplier = 1;
        this.planarRotation = 0;
        this.verticalRotation = 0;
        this.cameraDistance = 2;
        
        this.desiredWidth = 300;
    }

    setRaymarchSetting(setting){
        if(this.uniforms){
            this.uniforms._PlanetSurfaceWaterStepSize.value = setting.PSW_StepSize;
            this.uniforms._PlanetSurfaceWaterMaxStepCount.value = setting.PSW_MaxStepCount;
            this.uniforms._CloudsStepSize.value = setting.C_StepSize;
            this.uniforms._CloudsMaxStepCount.value = setting.C_StepCount;
        }
    }

    setRenderScale(scale){
        //this.renderScale = scale;
        //this.resizeRenderer();
    }

    resizeRendererWH(resolution){
        this.renderer.setSize(resolution.x, resolution.y, false);
        this.camera.aspect = resolution.x / resolution.y;
        this.camera.updateProjectionMatrix();
    }

    resizeRenderer(desiredWidth){
        /*this.renderer.setSize(this.canvasElement.clientWidth * this.renderScale, this.canvasElement.clientHeight * this.renderScale, false);
        this.camera.aspect = this.canvasElement.clientWidth / this.canvasElement.clientHeight;
        this.camera.updateProjectionMatrix();*/
        let newWidth = desiredWidth;
        let newHeight = desiredWidth * (this.canvasElement.clientHeight / this.canvasElement.clientWidth);

        this.renderer.setSize(newWidth, newHeight, false);
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
    }

    shouldResize(){
        /*let cWidth = this.canvasElement.clientWidth * this.renderScale;
        let cHeight = this.canvasElement.clientHeight * this.renderScale;*/

        let dWidth = this.desiredWidth;
        let dHeight = this.desiredWidth * (this.canvasElement.clientHeight / this.canvasElement.clientWidth);

        //http://localhost:3000/PlanetGenerator

        let rWidth = this.canvasElement.width;
        let rHeight = this.canvasElement.height;

        //console.log("delta width ", Math.abs(cWidth - rWidth));
        //console.log("delta height: ", Math.abs(cHeight - rHeight));

        if(Math.abs(dWidth - rWidth) > 1 || Math.abs(dHeight - rHeight) > 1){
            /*console.log("shouldResize");
            console.log("delta width ", Math.abs(cWidth - rWidth), "width scaled", cWidth, "render width", rWidth);
            console.log("delta height: ", Math.abs(cHeight - rHeight));*/
            return true;
        }
        return false;
    }

    updateCameraRotation(){
        let x = this.cameraDistance * Math.cos(this.verticalRotation) * Math.sin(this.planarRotation);
        let z = this.cameraDistance * Math.cos(this.verticalRotation) * Math.cos(this.planarRotation);
        let y = this.cameraDistance * Math.sin(this.verticalRotation);

        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
        //this.camera.position =
        this.camera.lookAt(new THREE.Vector3(0,0,0));
        this.camera.updateProjectionMatrix();
    }

    setRenderWidth(value){
        this.desiredWidth = value;
        this.resizeRenderer(this.desiredWidth);
    }

    setCameraFOV(value){
        this.camera.fov = value;
        this.camera.updateProjectionMatrix();
    }

    setCameraDistance(value){
        this.cameraDistance = value;
        this.updateCameraRotation();
    }

    cameraRotationPlanar(value){
        this.planarRotation = value;
        this.updateCameraRotation();
    }

    cameraRotationVertical(value){
        this.verticalRotation= value;
        this.updateCameraRotation();
    }

    animate() {
		if(!this.enabled) return;
        requestAnimationFrame( (this.animate).bind(this) );

        if(this.shouldResize()){
            this.resizeRenderer(this.desiredWidth);
        }
        
        this.uniforms.iTime.value = ((new Date()).getTime() - this.startTime) / 1000;

        this.renderer.render( this.scene, this.camera );
    };

    renderForFile(resolution, currentRaymarchRuntimeSetting){
        this.setRaymarchSetting(this.highFidelityParameters);

        this.resizeRendererWH(resolution);
        this.renderer.render( this.scene, this.camera );

		if(currentRaymarchRuntimeSetting == RaymarchSettingType.NORMAL){
			this.setRaymarchNormalSettings();
		}else if(currentRaymarchRuntimeSetting == RaymarchSettingType.LOW){
			this.setRaymarchLowSettings();
		}else{
			this.setRaymarchHighSettings();
		}
    }

    renderForFileCurrent(){
        this.renderer.render( this.scene, this.camera );
    }

    setRaymarchLowSettings(){
        this.setRaymarchSetting(this.lowFidelityParameters);
    }
    setRaymarchNormalSettings(){
        this.setRaymarchSetting(this.normalFidelityParameters);
    }
    setRaymarchHighSettings(){
        this.setRaymarchSetting(this.highFidelityParameters);
    }
}