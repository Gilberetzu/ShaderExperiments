<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Writable, writable, get } from 'svelte/store';
    import ObjectsStore from '../ObjectsStore';
    import * as THREE from 'three';

	import CameraStores from "../SceneSection/CameraStores";
    import ControlGroup from './ControlGroup.svelte';
    import ProceduralPlanet from '../ProceduralPlanet';
	import CameraControlGroup from "./CameraControlGroup.svelte";

	import BackgroundDropdownSelector from "./BackgroundDropdownSelector.svelte";

    let getUIStore = (index) => {
        return editableObjectUIStores[index].store;
    };

    //DataUI
    import Bool from '../DataUI/Bool.svelte';
    import Float from '../DataUI/Float.svelte';
    import Vector2 from '../DataUI/Vector2.svelte';
    import Vector2Range from '../DataUI/Vector2Range.svelte';
    import Vector3 from '../DataUI/Vector3.svelte';
    import Vector3Color from '../DataUI/Vector3Color.svelte';
    import String from '../DataUI/String.svelte';
    import EnumSelector from '../DataUI/EnumSelector.svelte';

    let editableObjectUIStores = [];
    let editableUISections = [];
    let planetEditorControlStores: CameraStores;

    export let selectedObject: {
        id;
        key;
    };
    export let selectedSection;
    export let setEditabelUISections = (sections) => {};
    export let setSystemUISections = (sections) => {};

	type backgroundElements = {
		showBackgroundStore: Writable<boolean>,
		backgroundIdStore: Writable<number>
		showGridStore: Writable<boolean>,
	}
	let backgroundElementStores: backgroundElements;

    let getEditableObject = (id, key) => {
        let objectStoreData = get(ObjectsStore);
        return objectStoreData[key].find((obj) => {
            return obj.id == id;
        });
    };

    export const saveObject = (loadedEditableObject: { id; key }) => {
        //Before the store is create the current edited object needs to be transfered to the store
        if (editableObjectUIStores.length > 0) {
            let editableObjectToSave = getEditableObject(
                loadedEditableObject.id,
                loadedEditableObject.key
            );

            if (
                editableObjectToSave != null &&
                editableObjectToSave != undefined
            ) {
                editableObjectUIStores.forEach((UIStore) => {
                    editableObjectToSave.object[UIStore.propName] = get(
                        UIStore.store
                    );
                });
                ObjectsStore.updateObject(
                    editableObjectToSave,
                    loadedEditableObject.key,
                    loadedEditableObject.id
                );
            }
        }
    };

    let createEditableUI = (editableObject) => {
        let guiStructure = ProceduralPlanet.GetGUIStructure();
        //The UI state reconstruction needs to be propagated to the three js system
        //The writables are generated using the current object data
        let newEditableUISections = [];
        let newEditableStores = [];
        for (let i = 0; i < guiStructure.length; i++) {
            const UIElement = guiStructure[i];
            newEditableUISections.push({
                typeIndex: 1,
                label: UIElement.label,
                groups: UIElement.groups.map((group) => {
                    return {
                        label: group.label,
                        props: group.props.map((prop) => {
                            newEditableStores.push({
                                propName: prop.prop,
                                propType: prop.propType,
                                store: writable(editableObject[prop.prop])
                            });

                            let storeIndex = newEditableStores.length - 1;
                            return {
                                label: prop.label,
                                overrideType: prop.overrideType,
                                enumObject: prop.enumObject,
                                typeName:
                                    editableObject[prop.prop].constructor.name,
                                storeIndex: storeIndex,
                                extras: prop.extras,
                                tooltip: prop.tooltip
                            };
                        })
                    };
                })
            });
        }
        return {
            sections: newEditableUISections,
            stores: newEditableStores
        };
    };

    onMount(() => {
        let editableObject = getEditableObject(
            selectedObject.id,
            selectedObject.key
        );

        let sectionStores = createEditableUI(editableObject.object);

        editableObjectUIStores = [];
        setEditabelUISections([]);
        setSystemUISections([]);

        planetEditorControlStores =
            window.threeScene.editors.planetEditor.cameraControlStores;
        //console.log(planetEditorControlStores);

        if (sectionStores != null) {
            requestAnimationFrame(() => {
                setEditabelUISections(sectionStores.sections);
                setSystemUISections([{ label: 'Camera', typeIndex: 0 }, { label: 'Scene', typeIndex: 0 }]);
                editableUISections = sectionStores.sections;
                editableObjectUIStores = sectionStores.stores;

                window.threeScene.editors.planetEditor.subscribeToStores({
                    editableObject: sectionStores.stores,
                    sceneControls: []
                });
            });
        }

		backgroundElementStores = {
			backgroundIdStore: window.threeScene.editors.planetEditor.sceneBackground.selectedBackgroundStore,
			showBackgroundStore: window.threeScene.editors.planetEditor.sceneBackground.showBackgroundStore,
			showGridStore: window.threeScene.editors.planetEditor.sceneBackground.showGridStore,
		};
    });

    onDestroy(() => {
        saveObject(selectedObject);
        window.threeScene.editors.planetEditor.unsubscribeFromStores();
        setEditabelUISections([]);
        setSystemUISections([]);
    });
</script>

{#if planetEditorControlStores != undefined && selectedSection.typeIndex == 0 && selectedSection.index == 0}
	<CameraControlGroup bind:cameraControlStores={planetEditorControlStores}/>
{/if}

{#if backgroundElementStores != undefined && selectedSection.typeIndex == 0 && selectedSection.index == 1}
	<ControlGroup label={"Scene"}>
		<Bool label="Show Grid" boolStore={backgroundElementStores.showGridStore}/>
		<Bool label="Show Background" boolStore={backgroundElementStores.showBackgroundStore}/>
		<BackgroundDropdownSelector backgroundSelectStore = {backgroundElementStores.backgroundIdStore}/>
	</ControlGroup>
{/if}

{#each editableUISections as section, index}
    {#if selectedSection.typeIndex == section.typeIndex && selectedSection.index == index}
        {#each section.groups as { label, props }}
            <ControlGroup {label}>
                {#each props as { label, typeName, storeIndex, tooltip, extras, overrideType, enumObject }, index}
                    {#if overrideType == 'enum'}
                        <EnumSelector
                            {label}
                            {tooltip}
                            enumStore={getUIStore(storeIndex)}
                            {enumObject}
                        />
                    {:else if overrideType == 'range'}
                        <Vector2Range
                            {label}
                            {tooltip}
                            vector2Store={getUIStore(storeIndex)}
                            {...extras}
                        />
                    {:else if typeName.toLowerCase() == 'boolean'}
                        <Bool
                            boolStore={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                        />
                    {:else if typeName.toLowerCase() == 'number'}
                        <Float
                            floatStore={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                            {...extras}
                        />
                    {:else if typeName.toLowerCase() == 'vector2'}
                        <Vector2
                            vector2Store={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                            {...extras}
                        />
                    {:else if typeName.toLowerCase() == 'vector3'}
                        <Vector3
                            vector3Store={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                            {...extras}
                        />
                    {:else if typeName.toLowerCase() == 'color'}
                        <Vector3Color
                            colorStore={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                            {...extras}
                        />
                    {:else if typeName.toLowerCase() == 'string'}
                        <String
                            stringStore={getUIStore(storeIndex)}
                            {tooltip}
                            {label}
                            {...extras}
                        />
                    {/if}
                {/each}
            </ControlGroup>
        {/each}
        <div style="width: 100%; height: 2em;" />
    {/if}
{/each}

<style>
</style>
