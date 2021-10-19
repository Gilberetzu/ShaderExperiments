<script lang="ts">
	import {onMount} from "svelte";
	import ObjectsStore from "../ObjectsStore"; 
	import ControlSelector from "./ControlSelector.svelte";
	import ControlGroup from "./ControlGroup.svelte";
	import SelectionState from "../SelectionState";
	import ProceduralPlanet from "../ProceduralPlanet";
	import { writable, get } from "svelte/store";

	//DataUI
	import Bool from "../DataUI/Bool.svelte";
	import Float from "../DataUI/Float.svelte";
	import Vector2 from "../DataUI/Vector2.svelte";
	import Vector3 from "../DataUI/Vector3.svelte";
	import Vector3Color from "../DataUI/Vector3Color.svelte";
	import String from "../DataUI/String.svelte";
	import EnumSelector from "../DataUI/EnumSelector.svelte";

	let editableUISections = [];

	let selectedSection = {
		typeIndex: -1,
		index: 0
	};

	let editableObjectUIStores = [];

	let getUIStore = (index)=>{
		return editableObjectUIStores[index].store;
	}

	let editableSelectionChange = (state:any) => {
		if(state >= 0){
			let objectStoreData = get(ObjectsStore);

			let getEditableObject = (objId)=>{
				const editableLists = [
					"planets",
					"combinedPlanets",
					"stars",
					"planetarySystems",
					"galaxies"
				];
				let editableObject = null;
				let objIndex = -1;
				let listName= "";

				for (let i = 0; i < editableLists.length; i++) {
					listName = editableLists[i];
					objIndex = objectStoreData[listName].findIndex(elem => {
						return elem.id == objId;
					});
					if(objIndex >= 0){
						break;
					}
				}
				return {
					editableObject: objectStoreData[listName][objIndex],
					index: objIndex,
					listName: listName
				};
			}

			let editableObject = getEditableObject(state).editableObject;

			if(editableObjectUIStores.length > 0){
				//Before the store is create the current edited object needs to be transfered to the store
				let editableObjectToSave = getEditableObject(editableObjectUIStores[0].id);
				editableObjectUIStores.forEach(UIStore => {
					editableObjectToSave.editableObject.object[UIStore.propName] = get(UIStore.store);
				});
				//console.log(editableObjectToSave.editableObject);
				ObjectsStore.updateObject(editableObjectToSave.editableObject, editableObjectToSave.listName, editableObjectToSave.index);
			}
			

			let sectionStores = createEditableTypeUI(editableObject.object, editableObject.id);

			editableUISections = [];
			editableObjectUIStores = [];

			requestAnimationFrame(()=>{
				editableUISections = sectionStores.sections;
				editableObjectUIStores = sectionStores.stores;
			})
		}
	}

	let createEditableTypeUI = (editableObject, objId) =>{
		if(editableObject instanceof ProceduralPlanet){
			//The UI state reconstruction needs to be propagated to the three js system
			let newEditableUISections = [];
			let newEditableStores = [];
			let UIStructure = ProceduralPlanet.GetGUIStructure();
			for (let i = 0; i < UIStructure.length; i++) {
				const UIElement = UIStructure[i];
				newEditableUISections.push({
					typeIndex: 1,
					label: UIElement.label,
					groups: UIElement.groups.map((group)=>{
						return {
							label: group.label,
							props: group.props.map((prop)=>{
								newEditableStores.push({
									id: objId,
									propName: prop.prop,
									store: writable(editableObject[prop.prop]),
								});
								return {
									label: prop.label,
									overrideType: prop.overrideType,
									enumObject: prop.enumObject,
									typeName: editableObject[prop.prop].constructor.name,
									storeIndex: newEditableStores.length - 1,
									extras: prop.extras,
									tooltip: prop.tooltip
								}
							})
						};
					})
				});
			}
			return {
				sections: newEditableUISections,
				stores: newEditableStores
			};
		}
	}

	onMount(()=>{
		SelectionState.editable.subscribe(editableSelectionChange);
		//SelectionState.editable.set(new ProceduralPlanet());
	})
</script>

<style>
	.controlSelect{
		grid-area: select;
		background-color: var(--cs2_1);
	}
	
	.controlSelectSeparator{
		width: 2em;
		height: 0.5em;
	}
	.controls{
		grid-area: controls;
		overflow: auto;
	}
	.innerWindowTop{
		font-weight: bold;
		padding: 0.1em 1em;
		background-color: var(--cs2_2);
		color: var(--cs2_6);
		grid-area: top;
	}
</style>

<div class="innerWindowTop">Controls</div>
<div class="controlSelect">
	<div class="controlSelectSeparator" ></div>
	<ControlSelector label={"Render"}/>
	<ControlSelector label={"Camera"}/>
	<div class="controlSelectSeparator"></div>
	{#each editableUISections as {label, typeIndex, groups}, index}
		<ControlSelector label={label} selected={
			selectedSection.typeIndex == typeIndex && selectedSection.index == index
		} on:click={()=>{
			selectedSection = {
				typeIndex: typeIndex,
				index
			}
		}}/>
	{/each}
</div>
<div class="controls">
	{#each editableUISections as section, index}
		{#if selectedSection.typeIndex == section.typeIndex && selectedSection.index == index}
			{#each section.groups as {label, props}}
				<ControlGroup label={label}>
					{#each props as {label, typeName, storeIndex, tooltip, extras, overrideType, enumObject}, index}
						<div style={`margin-bottom: ${index == props.length-1 ? 0 : 1}em;`}>
							{#if overrideType == "enum"}
								<EnumSelector label={label} tooltip={tooltip} enumStore={getUIStore(storeIndex)} enumObject={enumObject} />
							{:else if typeName.toLowerCase() == "boolean"}
								<Bool boolStore={getUIStore(storeIndex)} tooltip={tooltip} label={label}/>
							{:else if typeName.toLowerCase() == "number"}
								<Float floatStore={getUIStore(storeIndex)} tooltip={tooltip} label={label} {...extras}/>
							{:else if typeName.toLowerCase() == "vector2"}
								<Vector2 vector2Store={getUIStore(storeIndex)} tooltip={tooltip} label={label} {...extras}/>
							{:else if typeName.toLowerCase() == "vector3"}
								<Vector3 vector3Store={getUIStore(storeIndex)} tooltip={tooltip} label={label} {...extras}/>
							{:else if typeName.toLowerCase() == "color"}
								<Vector3Color colorStore={getUIStore(storeIndex)} tooltip={tooltip} label={label} {...extras}/>
							{:else if typeName.toLowerCase() == "string"}
								<String stringStore={getUIStore(storeIndex)} tooltip={tooltip} label={label} {...extras}/>
							{/if}
						</div>
					{/each}
				</ControlGroup>
			{/each}
			<div style="width: 100%; height: 2em;"/>
		{/if}
	{/each}
</div>