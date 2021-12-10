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
	static Clamp(v, min, max){
		return Math.max(min, Math.min(max, v));
	}
	static InverseLerp(a, b, t)
	{
		return (t - a)/(b - a);
	}
	static ClampedInverseLerp(a,b,t){
		return Num.Clamp(Num.InverseLerp(a,b,t), 0, 1);
	}
	static Lerp(a, b, t){
		return a + t * (b - a);
	}
	static Smoothstep(t){
		return 6 * Math.pow(t, 5) - 15 * Math.pow(t, 4) + 10 * Math.pow(t, 3);
	}
	static SmoothstepLerp(a, b, t){
		return a + Num.Smoothstep(t) * (b - a);
	}
}