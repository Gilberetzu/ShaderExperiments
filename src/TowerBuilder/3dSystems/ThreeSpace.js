import Scene3d from "./Scene3d";
import BuildingGenerator from "./BuildingGenerator";
import Vec2 from "../Math/Vec2";
import VerticalGroup from "../UISystems/VerticalGroup";
import Checkbox, { CheckboxStyle } from "../UISystems/Checkbox";
import Draw from "../Draw";

export default class ThreeSpace{
	/**
	 * @param {HTMLCanvasElement} canvasHTMLElement 
	 */
	constructor(canvasHTMLElement){
		this.scene3d = new Scene3d(canvasHTMLElement);
		this.buildingGenerator = new BuildingGenerator(this.scene3d);
		this.lastTime = performance.now();
	}

	resizeTargets(){
		this.scene3d.resizeTargets();
	}

	enter3dScene(){
		this.scene3d.enter3dScene();
	}

	update(dt){
		this.scene3d.update(dt);
		this.buildingGenerator.update(dt);
	}

	systemUpdate(time){
		const currentTime = time;
		this.update(currentTime - this.lastTime);
		this.lastTime = currentTime;

		this.scene3d.render();
	}
}