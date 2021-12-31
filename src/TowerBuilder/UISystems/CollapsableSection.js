import VerticalGroup from "./VerticalGroup";
import * as PIXI from 'pixi.js';
import PixiButton from "./Button";
import Vec2 from "../Math/Vec2";
import { commonStyles } from "./Styles";
import Triangle2D from "../Geometry/Triangle2D";

export default class CollapsableSection extends VerticalGroup{
	constructor(label, contianer, bgColor, bgPadding, bgLineWidth, bgLineColor, bgRadius){
		const secContainer = new PIXI.Container();
		super(secContainer, bgColor, bgPadding, bgLineWidth, bgLineColor, bgRadius);
		this.sectionContainer = secContainer;
		contianer.addChild(this.sectionContainer);

		const textStyle =  new PIXI.TextStyle({
			fill: 0xFFFFFF,
			fontFamily:'Bubblegum Sans',
			fontSize: 20
		});
		this.topText = new PIXI.Text(label,textStyle);
		this.topButton = new PIXI.Graphics();
		this.topContainer = new PIXI.Container();

		this.btnSize = 30;
		this.padBtn = 20;

		this.triOpen = Triangle2D.PushVertices(
			new Vec2(0,0),
			new Vec2(this.btnSize,0),
			new Vec2(this.btnSize/2,this.btnSize),
			10
		);

		this.triClose = Triangle2D.PushVertices(
			new Vec2(0,this.btnSize),
			new Vec2(this.btnSize,this.btnSize),
			new Vec2(this.btnSize/2,0),
			10
		);

		this.state = true;

		for (let i = 0; i < this.triOpen.length; i++) {
			this.triOpen[i].y += 4;
			this.triClose[i].y -= 4;
		}
		const totalSize = this.btnSize + this.padBtn + this.topText.width;

		this.topText.position.set(this.btnSize+this.padBtn - totalSize/2, 0);
		this.topButton.position.set(-totalSize/2, -5);

		this.topContainer.addChild(this.topText);
		this.topContainer.addChild(this.topButton);

		this.sectionContainer.addChild(this.topContainer);
		this.topContainer.updateTransform();

		const height = this.sectionContainer.height;
		this.sectionContainer.addChild(this.container);
		this.container.position.set(0, height + 20);
	}

	addElement(element, elementContainer, separation = 0){
		this.sectionContainer.removeChild(this.container);
		super.addElement(element, elementContainer, separation);

		const height = this.sectionContainer.height;
		this.sectionContainer.addChild(this.container);
		this.container.position.set(0, height + 20);
	}

	drawActive(){
		this.topButton.clear();
		this.topButton.beginFill(commonStyles.baseButton.bgColorActive);
		this.topButton.drawRoundedRect(0,0,this.btnSize, this.btnSize, this.btnSize*0.1);
		this.topButton.endFill();

		this.topButton.beginFill(commonStyles.baseButton.bgColorInactive);
		this.topButton.drawPolygon(this.state ? this.triOpen : this.triClose);
		this.topButton.endFill();
	}

	drawInactive(){
		this.topButton.clear();
		this.topButton.beginFill(commonStyles.baseButton.bgColorInactive);
		this.topButton.drawRoundedRect(0,0,this.btnSize, this.btnSize, this.btnSize*0.1);
		this.topButton.endFill();

		this.topButton.beginFill(commonStyles.baseButton.bgColorActive);
		this.topButton.drawPolygon(this.state ? this.triOpen : this.triClose);
		this.topButton.endFill();
	}

	update(dt){
		if(this.state){
			super.update(dt);
		}
		
		const pos = this.topContainer.getGlobalPosition();
		pos.x -= this.topContainer.width/2;
		pos.y -= 5;

		let inputStore = /** @type {import("../types").Input} */ (window.TowerBuilder.input);
		const mousePos = inputStore.mouse.position;

		const boundingBox = {
			min: new Vec2(pos.x, pos.y),
			max: new Vec2(pos.x + this.topContainer.width, pos.y + this.topContainer.height)
		};

		if(mousePos.x >= boundingBox.min.x && mousePos.x <= boundingBox.max.x && 
			mousePos.y >= boundingBox.min.y && mousePos.y <= boundingBox.max.y){
			this.drawActive();

			if(inputStore.mouse.buttons[0]){
				inputStore.mouse.buttons[0] = false;
				this.state = !this.state;
				if(!this.state){
					this.sectionContainer.removeChild(this.container);
				}else{
					this.sectionContainer.addChild(this.container);
				}
			}
		}else{
			this.drawInactive();
		}
	}
}