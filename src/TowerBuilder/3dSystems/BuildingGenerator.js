import * as THREE from 'three';
import ModelManager from './ModelManager';
import ExtraPropLoader from './ExtraPropLoader';
import Draw from '../Draw';
import Num from '../Math/Num';
import Vec2 from '../Math/Vec2';
import Vec3 from '../Math/Vec3';
import GenerationSpace from './GenerationSpace';

import BGFragmentShader from 	"../Shaders/BackgroundShader/FragmentShader.glsl?raw";
import BGVertexShader from 		"../Shaders/BackgroundShader/VertexShader.glsl?raw";

export default class BuildingGenerator{
	constructor(scene3d){
		this.scene3d = scene3d;
		this.lastTime = performance.now();
		this.generationSpaces = [];

		this.mouseRaycaster = new THREE.Raycaster();
		const mouseRayTestGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5, 1, 1, 1);
		const mouseRayTestMat = new THREE.MeshBasicMaterial({color: Draw.HexColor(0.5,0.5,1.0)});
		this.mouseRayTestMesh = new THREE.Mesh(mouseRayTestGeom, mouseRayTestMat);

		this.mouseRayMeshTargetPos = Vec3.Zero();
		this.scene3d.scene.add(this.mouseRayTestMesh);

		this.hoveredVertex = {
			spaceIndex: 0,
			layerIndex: -1,
			vertIndex: -1,
			adjacentIndex: -1
		};

		this.hoveredPositionBuffer = new THREE.Float32BufferAttribute(new Float32Array( 12 * 8 * 3 ) , 3);
		this.hoveredColorBuffer = new THREE.Float32BufferAttribute(new Float32Array( 12 * 8 * 4 ) ,4);

		this.hoveredGeometryBuffer = new THREE.BufferGeometry();
		this.hoveredGeometryBuffer.setAttribute( 'position', this.hoveredPositionBuffer );
		this.hoveredGeometryBuffer.setAttribute( 'color', this.hoveredColorBuffer );
		
		this.hoveredMaterial = new THREE.MeshBasicMaterial({
			color: Draw.HexColor(1, 1, 1)/*, side: THREE.DoubleSide*/, vertexColors: true, transparent: true
		});
		
		this.hoveredMesh = new THREE.Mesh(this.hoveredGeometryBuffer, this.hoveredMaterial);
		this.scene3d.scene.add(this.hoveredMesh);

		this.canEditSpace = true;
		this.modelManager = new ModelManager();
		this.extraPropLoader = new ExtraPropLoader();
	}

	updateHoveredGeometryBuffer(){
		const geomBuffers = 
				this.generationSpaces[this.hoveredVertex.spaceIndex].generateVertPositionColorBuffer(
					this.hoveredVertex.layerIndex, this.hoveredVertex.adjacentIndex != -1 ? this.hoveredVertex.adjacentIndex : this.hoveredVertex.vertIndex,
					this.hoveredVertex.adjacentIndex != -1);
			
		this.hoveredPositionBuffer.copyArray(geomBuffers.position);
		this.hoveredPositionBuffer.needsUpdate = true;
		this.hoveredColorBuffer.copyArray(geomBuffers.color);
		this.hoveredColorBuffer.needsUpdate = true;
	}

	rayFromCameraToSpace(inputStore){
		const mousePos = Vec2.Copy(inputStore.mouse.position);

		mousePos.x = 	( mousePos.x / this.scene3d.size.width 	) * 2 - 1;
		mousePos.y =  - ( mousePos.y / this.scene3d.size.height ) * 2 + 1;

		this.mouseRaycaster.setFromCamera(mousePos, this.scene3d.cameraController.camera);

		if(this.generationSpaces.length > 0){
			const hitData = this.generationSpaces[0].raycastToSpace(this.mouseRaycaster.ray);
			//console.log(hitData);
			if(hitData.layerIndex == -1 || inputStore.keyboard.ControlLeft){
				Vec3.Zero(this.mouseRayMeshTargetPos);

				if(this.hoveredVertex.layerIndex != -1){
					Vec3.Zero(this.hoveredMesh.position);
					for (let i = 0; i < this.hoveredPositionBuffer.array.length; i++) {
						this.hoveredPositionBuffer.array[i] = 0;
					}
					for (let i = 0; i < this.hoveredColorBuffer.array.length; i++) {
						this.hoveredPositionBuffer.array[i] = 0;
					}
					this.hoveredPositionBuffer.needsUpdate = true;
					this.hoveredColorBuffer.needsUpdate = true;

					this.hoveredVertex.spaceIndex = 0;
					if(inputStore.keyboard.ControlLeft){
						this.hoveredVertex.layerIndex = -1;
						this.hoveredVertex.vertIndex = -1;
						this.hoveredVertex.adjacentIndex = -1;
					}else{
						this.hoveredVertex.layerIndex = hitData.layerIndex;
						this.hoveredVertex.vertIndex = hitData.vertIndex;
						this.hoveredVertex.adjacentIndex = hitData.adjacentIndex;
					}
				}
			}else if(this.hoveredVertex.layerIndex != hitData.layerIndex || this.hoveredVertex.vertIndex != hitData.vertIndex || this.hoveredVertex.adjacentIndex != hitData.adjacentIndex){
				this.hoveredVertex.spaceIndex = 0;
				this.hoveredVertex.layerIndex = hitData.layerIndex;
				this.hoveredVertex.vertIndex = hitData.vertIndex;
				this.hoveredVertex.adjacentIndex = hitData.adjacentIndex;

				this.updateHoveredGeometryBuffer();

				const vertIndex = hitData.adjacentIndex != -1 ? hitData.adjacentIndex : hitData.vertIndex;

				const vertPos = 
					this.generationSpaces[this.hoveredVertex.spaceIndex].vertices[vertIndex].pos;
				const centerPos =
					this.generationSpaces[this.hoveredVertex.spaceIndex].centerPosition;

				this.hoveredMesh.position.z = vertPos.x + centerPos.x;
				this.hoveredMesh.position.x = vertPos.y + centerPos.y;
				this.hoveredMesh.position.y = this.hoveredVertex.layerIndex;
				
				this.mouseRayMeshTargetPos.z = vertPos.x + centerPos.x;
				this.mouseRayMeshTargetPos.x = vertPos.y + centerPos.y;
				this.mouseRayMeshTargetPos.y = this.hoveredVertex.layerIndex + 0.5;
			}
		}

		Vec3.Lerp(this.mouseRayTestMesh.position, this.mouseRayMeshTargetPos, 0.2, this.mouseRayTestMesh.position);
	}

	addGenerationSpace(triangulatedSpace){
		const newGenSpace = new GenerationSpace(triangulatedSpace, this.scene3d);
		newGenSpace.addSpaceToScene(this.scene);
		this.generationSpaces.push(newGenSpace);
		const centerPos = this.generationSpaces[0].centerPosition;
		this.scene3d.cameraController.setToCenterPosition(centerPos);
	}

	update(dt){
		let inputStore = window.TowerBuilder.input;
		this.rayFromCameraToSpace(inputStore);

		if(inputStore.mouse.buttons[2] && this.canEditSpace && this.hoveredVertex.layerIndex != -1){
			this.generationSpaces[this.hoveredVertex.spaceIndex].clearVertState(this.hoveredVertex);
			this.generationSpaces[this.hoveredVertex.spaceIndex].updateSpaceGeometry(this.modelManager, this.extraPropLoader);
			this.canEditSpace = false;
		}else if(inputStore.mouse.buttons[0] && this.canEditSpace && this.hoveredVertex.layerIndex != -1){
			this.generationSpaces[this.hoveredVertex.spaceIndex].setVertStateToBuilding(this.hoveredVertex);
			this.updateHoveredGeometryBuffer();
			this.generationSpaces[this.hoveredVertex.spaceIndex].updateSpaceGeometry(this.modelManager, this.extraPropLoader);
			this.canEditSpace = false;
		}else if(!inputStore.mouse.buttons[2] && !inputStore.mouse.buttons[0] && !this.canEditSpace){
			this.canEditSpace = true;
		}

		this.generationSpaces.forEach(ge =>{
			ge.update(dt);
		})
	}
}