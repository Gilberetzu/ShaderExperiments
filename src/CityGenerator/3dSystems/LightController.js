import * as THREE from 'three';
import Vec3 from '../Math/Vec3';

export default class LightController{
	constructor(scene){
		//Create a DirectionalLight and turn on shadows for the light
		this.light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
		this.light.position.set( 0, 12, 0 ); //default; light shining from top
		this.light.castShadow = true; // default false

		const targetPosition = Vec3.Add(this.light.position, Vec3.MultScalar(Vec3.Normalize(new Vec3(1,1.5,1)), -8));
		Vec3.Copy(targetPosition, this.light.target.position);

		//Set up shadow properties for the light
		this.light.shadow.mapSize.width = 2048; // default
		this.light.shadow.mapSize.height = 2048; // default
		this.light.shadow.camera.left = -8;
		this.light.shadow.camera.top = 8;
		this.light.shadow.camera.right = 8;
		this.light.shadow.camera.bottom = -8;
		this.light.shadow.camera.near = 1; // default
		this.light.shadow.camera.far = 100; // default
		this.light.shadow.normalBias = 0.25;
		this.light.shadow.bias = 0;
		this.light.shadow.needsUpdate = true;

		scene.add( this.light );
		scene.add( this.light.target);

		this.helper = new THREE.CameraHelper( this.light.shadow.camera );
		//scene.add( this.helper );
	}

	getLightDirection(){
		return Vec3.Normalize(Vec3.Subtract(this.light.target.position, this.light.position));
	}

	followCamera(camera){
		const lightDir = this.getLightDirection();
		const dirTarget = new THREE.Vector3(0,0,0);
		camera.getWorldDirection(dirTarget);
		const camDirection = (new THREE.Vector3(dirTarget.x, 0, dirTarget.z)).normalize();
		const targetPosition = Vec3.Add(new Vec3(camera.position.x, 0, camera.position.z), Vec3.MultScalar(camDirection, 6));
		Vec3.Copy(targetPosition, this.light.target.position);
		Vec3.Copy(Vec3.Add(targetPosition, Vec3.MultScalar(lightDir, -30)), this.light.position);
	}
}