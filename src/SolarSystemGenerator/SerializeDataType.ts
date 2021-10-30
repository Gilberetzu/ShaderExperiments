import * as THREE from "three";
export default {
	SBool: (paramName, value)=>{return {paramName, value, type:"bool"}},
	SString: (paramName, value)=>{return {paramName, value, type:"string"}},
	SNumber: (paramName, value)=>{return {paramName, value, type:"number"}},
	SVector2: (paramName, value)=>{return {paramName, value:{x:value.x, y:value.y}, type:"vector2"}},
	SVector3: (paramName, value)=>{return {paramName, value:{x:value.x, y:value.y, z:value.z}, type:"vector3"}},
	SVector3Color: (paramName, value)=>{return {paramName, value:value.getHexString(), type:"vector3color"}},

	DeserializeData: (paramObj)=>{
		if(paramObj.type == "bool"){
			return paramObj.value;
		}else if(paramObj.type == "string"){
			return paramObj.value;
		}else if(paramObj.type == "number"){
			return paramObj.value;
		}else if(paramObj.type == "vector2"){
			return new THREE.Vector2(paramObj.value.x, paramObj.value.y);
		}else if(paramObj.type == "vector3"){
			return new THREE.Vector3(paramObj.value.x, paramObj.value.y, paramObj.value.z);
		}else if(paramObj.type == "vector3color"){
			return new THREE.Color(`#${paramObj.value}`);
		}
	}
}