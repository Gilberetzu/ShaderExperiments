import * as THREE from 'three';

const tableIndexCount = 256;

function inverseLerp(min,max,val){
	return (val - min) / (max - min);
}

function lerp(min, max, val){
	return min + val * (max - min);
}

export default class OrbitController{
	startParam: number;
	ellipse: THREE.Vector2;
	rotation: THREE.Vector2;
	center: THREE.Vector3;
	speed: number;

	movementTable: Array<number>;

	currentParam: {current: number, next: number};
	currentDistance: number;

	holderObject: THREE.Object3D;
	lineloop: THREE.LineLoop;
	showLineLoop: boolean;

	constructor(start:number, ellipse: THREE.Vector2, rotation: THREE.Vector2, center: THREE.Vector3, speed: number, holderObject: THREE.Object3D){
		this.startParam = start;
		this.ellipse = ellipse;
		this.rotation = rotation;
		this.center = center;
		this.speed = speed;
		this.movementTable= new Array(tableIndexCount);
		this.holderObject = holderObject;
		
		this.computeMovementTable();
		let startFract = start - Math.floor(this.startParam);
		let possibleCurrentParam = Math.floor(startFract * (tableIndexCount - 1));

		if(possibleCurrentParam == tableIndexCount - 1){
			this.currentParam = {current: possibleCurrentParam - 1, next: possibleCurrentParam};
			this.currentDistance = this.movementTable[possibleCurrentParam];
			console.error("This should not have happened");
		}else{
			this.currentParam = {current: possibleCurrentParam, next: possibleCurrentParam + 1};
			let floatingParam = startFract * (tableIndexCount - 1);
			let interp = floatingParam - possibleCurrentParam;
			this.currentDistance = lerp(this.movementTable[this.currentParam.current], this.movementTable[this.currentParam.next], interp);
		}

		this.lineloop = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial( {
			color: 0xffffff,
			linewidth: 20,
			linecap: 'round', //ignored by WebGLRenderer
			linejoin: 'round' //ignored by WebGLRenderer
		}));

		this.updateLineLoop();
		this.showEllipse();
	}

	showEllipse(){
		this.showLineLoop = true;
		this.updateLineLoop();
		this.holderObject.add(this.lineloop);
	}

	hideEllipse(){
		this.showLineLoop = false;
		this.holderObject.remove(this.lineloop);
	}

	updateLineLoop(){
		if(this.showLineLoop){
			this.lineloop.geometry.setFromPoints(this.createPointsForHelplerLineLoop());
		}
	}

	computeElipsePosition(param:number){
		let x = this.ellipse.x * Math.cos(param * Math.PI * 2.0);
		let y = this.ellipse.y * Math.sin(param * Math.PI * 2.0);
		
		return new THREE.Vector2(x, y);
	}

	computeMovementTable(){
		//console.log("Compute movement table");
		this.movementTable[0] = 0;
		for (let i = 1; i < tableIndexCount; i++) {
			let pt = (i-1) / (tableIndexCount - 1);
			let t = (i) / (tableIndexCount - 1);

			let prevPos = this.computeElipsePosition(pt);
			let currentPos = this.computeElipsePosition(t);

			let distance = prevPos.distanceTo(currentPos);

			this.movementTable[i] = this.movementTable[i-1] + distance;
		}
	}

	createPointsForHelplerLineLoop(){
		let helperPoints = [];
		for (let i = 0; i < tableIndexCount ; i++) {
			let param = i / (tableIndexCount - 1);
			helperPoints.push(this.compute3dPointFromEllipsePos(this.computeElipsePosition(param)));
		}

		return helperPoints;
	}

	compute3dPointFromEllipsePos(posOnEllipse){
		let orbitAxis1: THREE.Vector3 = new THREE.Vector3(1,0,0);
		let orbitAxis2: THREE.Vector3 = new THREE.Vector3(0,0,1);

		let pos3d = orbitAxis1.multiplyScalar(posOnEllipse.x).add(orbitAxis2.multiplyScalar(posOnEllipse.y));
		
		pos3d.applyAxisAngle(new THREE.Vector3(1,0,0), this.rotation.x);
		pos3d.applyAxisAngle(new THREE.Vector3(0,1,0), this.rotation.y);
		
		pos3d.add(this.center);

		return pos3d;
	}

	computeOrbit(deltaTime: number):THREE.Vector3{
		let movement = this.speed * deltaTime;
		let newDistance = this.currentDistance + movement;

		let lookUpIndex = this.currentParam.next;
		let posOnEllipse = new THREE.Vector2(0,0);
		//console.log("entered compute orbit??", this);
		while(true){
			if(newDistance < this.movementTable[lookUpIndex]){

				let innerInterpolator = inverseLerp(this.movementTable[lookUpIndex - 1], this.movementTable[lookUpIndex], newDistance);
				let maxCount = tableIndexCount - 1;
				let ellipseInterp = lerp( (lookUpIndex - 1)/maxCount, lookUpIndex/maxCount, innerInterpolator);
				posOnEllipse = this.computeElipsePosition(ellipseInterp);
				this.currentParam = {
					current: lookUpIndex - 1,
					next: lookUpIndex
				};
				
				this.currentDistance = newDistance;
				break;
			}else{
				lookUpIndex ++;
				if(lookUpIndex >= tableIndexCount){
					newDistance -= this.movementTable[tableIndexCount - 1];
					lookUpIndex = 1;
				}
			}
		}
		return this.compute3dPointFromEllipsePos(posOnEllipse);
		//return new THREE.Vector3(0,0,0);
	}
}