import * as PIXI from 'pixi.js';
import Vec2 from '../Math/Vec2';

export class ButtonStyle{
	constructor(borderRadius, fontSize, padding, bgColorInactive, bgColorActive, colorActive, colorInactive){
		this.fontSize = fontSize;
		this.borderRadius = borderRadius;
		
		this.bgColorActive = bgColorActive;
		this.bgColorInactive = bgColorInactive;

		this.colorActive = colorActive;
		this.colorInactive = colorInactive;

		this.padding = padding;
	}
}
export default class PixiButton{
	constructor(label, buttonStyle, callback){
		this.callback = callback;
		this.style = buttonStyle;
		this.labelText = new PIXI.Text(label, 
			new PIXI.TextStyle({
				fill: this.style.colorInactive, 
				fontFamily:'Bubblegum Sans', 
				fontSize: this.style.fontSize})
		);
		this.background = new PIXI.Graphics();
		this.drawInactive();

		this.container = new PIXI.Container();
		this.container.addChild(this.background);
		this.container.addChild(this.labelText);

		this.labelText.position.set(this.background.width/2 - this.labelText.width/2, this.style.padding.y/2);
	}

	drawInactive(){
		this.background.clear();
		this.background.beginFill(this.style.bgColorInactive);
		this.background.drawRoundedRect(0, 0, 
			this.labelText.width + this.style.padding.x, this.labelText.height + this.style.padding.y, this.style.borderRadius);
		this.background.endFill();

		this.labelText.style.fill = this.style.colorInactive;
	}

	drawActive(){
		this.background.clear();
		this.background.beginFill(this.style.bgColorActive);
		this.background.drawRoundedRect(0, 0, 
			this.labelText.width + this.style.padding.x, this.labelText.height + this.style.padding.y, this.style.borderRadius);
		this.background.endFill();

		this.labelText.style.fill = this.style.colorActive;
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
			this.drawActive();

			if(inputStore.mouse.buttons[0]){
				inputStore.mouse.buttons[0] = false;
				this.callback();
			}
		}else{
			this.drawInactive();
		}
	}
}