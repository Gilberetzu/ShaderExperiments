import * as PIXI from 'pixi.js';
import Num from '../Math/Num';
import { commonStyles } from './Styles';
import Vec2 from '../Math/Vec2';

export default class Slider{
	constructor(value, min, max, callback, width, label){
		this.container = new PIXI.Container();
		this.barGraphic = new PIXI.Graphics();

		this.labelText = new PIXI.Text(label, 
			new PIXI.TextStyle({
				fill: commonStyles.baseButton.colorInactive, 
				fontFamily:'Bubblegum Sans', 
				fontSize: commonStyles.baseButton.fontSize})
		);

		this.callback = callback;
		this.min = min;
		this.max = max;
		this.value = value;
		this.width = Math.max(width, this.labelText.width);

		const pos = Num.InverseLerp(this.min,this.max,this.value);

		this.barGraphic.clear();

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorInactive);
		this.barGraphic.drawRoundedRect(0,0,this.width,5);
		this.barGraphic.endFill();

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorActive);
		this.barGraphic.drawCircle(pos * this.width, 10, 4);
		this.barGraphic.endFill();

		this.container.addChild(this.barGraphic);
		const posx = (this.container.width - this.labelText.width)/2;
		this.container.addChild(this.labelText);
		this.barGraphic.position.x -= posx;
		this.barGraphic.position.y += this.labelText.height + 5;
		this.container.getBounds();
	}

	drawActive(){
		this.barGraphic.clear();
		const vpos = Num.InverseLerp(this.min,this.max,this.value);

		console.log(vpos);

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorInactive);
		this.barGraphic.drawRoundedRect(0,0,this.width,5);
		this.barGraphic.endFill();

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorActive);
		this.barGraphic.drawCircle(vpos * this.width, 10, 4);
		this.barGraphic.endFill();
	}

	drawInactive(){
		this.barGraphic.clear();
		const vpos = Num.InverseLerp(this.min,this.max,this.value);

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorActive);
		this.barGraphic.drawRoundedRect(0,0,this.width,5);
		this.barGraphic.endFill();

		this.barGraphic.beginFill(commonStyles.baseButton.bgColorInactive);
		this.barGraphic.drawCircle(vpos * this.width, 10, 4);
		this.barGraphic.endFill();
	}

	update(dt){
		const pos = this.container.getGlobalPosition();

		let inputStore = /** @type {import("../types").Input} */ (window.TowerBuilder.input);
		const mousePos = inputStore.mouse.position;

		const boundingBox = {
			min: new Vec2(pos.x, pos.y),
			max: new Vec2(pos.x + this.container.width, pos.y + this.container.height)
		};

		if(mousePos.x >= boundingBox.min.x && mousePos.x <= boundingBox.max.x && 
			mousePos.y >= boundingBox.min.y && mousePos.y <= boundingBox.max.y){
			if(inputStore.mouse.buttons[0]){
				inputStore.mouse.buttons[0] = false;
				this.value = Num.Lerp(this.min, this.max, Num.InverseLerp(boundingBox.min.x, boundingBox.max.x, mousePos.x));
				this.callback(this.value);
			}
			this.drawActive();
		}else{
			this.drawInactive();
		}
	}
}