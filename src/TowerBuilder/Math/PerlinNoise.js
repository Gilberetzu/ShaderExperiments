import Num from "./Num";
import Vec2 from "./Vec2";
import * as THREE from 'three';

export default class PerlinNoise{
	constructor(textureSize, vecSpaceSize){
		if(textureSize <= vecSpaceSize) {
			throw new Error("The texture size has to be bigger than the vector space size");
		}

		this.texSize = textureSize;
		this.vecSpaceSize = vecSpaceSize;
		
		this.randomVecs = [];
		for (let i = 0; i < this.vecSpaceSize; i++) {
			let row = [];
			if(i == this.vecSpaceSize - 1){
				this.randomVecs[0].forEach(rv => {
					row.push(rv);
				})
			}else{
				for (let j = 0; j < this.vecSpaceSize; j++) {
					if(j == this.vecSpaceSize - 1){
						row.push(row[0]);
					}else{
						row.push(Vec2.RandomUnitVec());
					}
				}
			}
			this.randomVecs.push(row);
		}

		console.log(this.randomVecs)

		const texelSize = (this.vecSpaceSize - 1) / (this.texSize - 1);
		console.log(texelSize);
		this.noiseTexture = [];
		for (let i = 0; i < this.texSize; i++) {
			let row = [];
			for (let j = 0; j < this.texSize; j++) {
				const gridPoint = new Vec2(i * texelSize, j * texelSize);
				const gpFloor = Vec2.Floor(gridPoint);

				const corner00 = Vec2.Copy(gpFloor);
				const corner10 = Vec2.Add(corner00, new Vec2(1,0));
				const corner01 = Vec2.Add(corner00, new Vec2(0,1));
				const corner11 = Vec2.Add(corner00, new Vec2(1,1));

				const c00val = this.dotVecSpace(gridPoint, corner00);
				const c10val = this.dotVecSpace(gridPoint, corner10);
				const c01val = this.dotVecSpace(gridPoint, corner01);
				const c11val = this.dotVecSpace(gridPoint, corner11);

				const hl0 = Num.SmoothstepLerp(c00val, c10val, gridPoint.x - gpFloor.x);
				const hl1 = Num.SmoothstepLerp(c01val, c11val, gridPoint.x - gpFloor.x);
				const val = Num.SmoothstepLerp(hl0, hl1, gridPoint.y - gpFloor.y);

				row.push(val);
			}
			this.noiseTexture.push(row);
		}
	}

	dotVecSpace(point, corner){
		const offset = Vec2.Subtract(point, corner);
		const randVec = this.randomVecs[Num.ModGl(corner.x, this.vecSpaceSize)][Num.ModGl(corner.y, this.vecSpaceSize)];
		return Vec2.Dot(offset, randVec);
	}

	getNearest(point){
		let pixel = Vec2.Floor(Vec2.MultScalar(point, this.texSize - 1));
		return this.noiseTexture[pixel.x][pixel.y];
	}

	generateDataTexture(){
		const noiseData = new Float32Array(this.texSize*this.texSize);
		for (let j = 0; j < this.texSize; j++) {
			for (let i = 0; i < this.texSize; i++) {
				const index = i + j*this.texSize;
				noiseData[index] = this.noiseTexture[j][i];
			}
		}
		const noiseDataTex = new THREE.DataTexture(noiseData, this.texSize, this.texSize, THREE.RedFormat, THREE.FloatType, THREE.UVMapping, THREE.RepeatWrapping,
			THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearFilter);
		return noiseDataTex;
	}
}