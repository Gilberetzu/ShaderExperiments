import { ButtonStyle } from "./Button";
import { CheckboxStyle } from "./Checkbox";
import Vec2 from "../Math/Vec2";
import Draw from "../Draw";

export const commonStyles = {
	baseButton: new ButtonStyle(5, 20, new Vec2(20, 10), 
				Draw.HexColor(1,0.2,0.4),
				Draw.HexColor(1,1,1),
				Draw.HexColor(1,0.2,0.4),
				Draw.HexColor(1,1,1)),
	baseCheckbox: new CheckboxStyle(20, 20, 5, 
		Draw.HexColor(1,0.2,0.4),
		Draw.HexColor(1,1,1),
		Draw.HexColor(1,0.2,0.4),
		Draw.HexColor(1,1,1)),
	verticalGroupBG: Draw.HexColor(0.1,0.1,0.1)
}