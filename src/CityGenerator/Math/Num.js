export default class Num{
	static RadToDeg(rad){
		return (rad * 180) / Math.PI;
	}
	static DegToRad(deg){
		return (deg * Math.PI) / 180;
	}
	static ModGl(a, b){
		return a - b * Math.floor(a / b);
	}
}