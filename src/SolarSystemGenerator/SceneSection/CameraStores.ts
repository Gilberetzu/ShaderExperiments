import * as THREE from 'three';
import { Writable } from 'svelte/store';

type CameraStores = {
	cameraRotation: Writable<THREE.Vector2>,
	cameraDistance: Writable<number>,
	cameraRotationCenter: Writable<THREE.Vector3>,
	cameraFOV: Writable<number>,
	renderWidth: Writable<number>,
	pixelPerfect: Writable<boolean>
};

export default CameraStores;