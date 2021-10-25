<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Writable, writable, get } from 'svelte/store';
    import ObjectsStore from '../ObjectsStore';
    import * as THREE from 'three';

    import Dropdown from '../DataUI/Dropdown.svelte';
    import CameraControlGroup from './CameraControlGroup.svelte';
    import ControlGroup from './ControlGroup.svelte';

	import BackgroundDropdownSelector from "./BackgroundDropdownSelector.svelte";

    import Bool from '../DataUI/Bool.svelte';
    import Float from '../DataUI/Float.svelte';
    import Vector2 from '../DataUI/Vector2.svelte';
    import Vector2Range from '../DataUI/Vector2Range.svelte';
    import Vector3 from '../DataUI/Vector3.svelte';
    import Vector3Color from '../DataUI/Vector3Color.svelte';
    import String from '../DataUI/String.svelte';
    import EnumSelector from '../DataUI/EnumSelector.svelte';
    import Button from '../../CommonComponents/Button.svelte';

    export let selectedObject: {
        id;
        key;
    };
    export let selectedSection;
    export let setEditabelUISections = (sections) => {};
    export let setSystemUISections = (sections) => {};

    let cameraStores;
	let editorStores;
	let sceneStores;

    onMount(() => {
        //Create dropdown options
        setSystemUISections([
            {
                typeIndex: 0,
                label: 'Camera'
            },
			{
                typeIndex: 0,
                label: 'Scene'
            }
        ]);

        setEditabelUISections([
            {
                typeIndex: 1,
                label: 'Star'
            }
        ]);

        window.threeScene.editors.starEditor.startSystem(
            selectedObject.id
        );

		cameraStores = window.threeScene.editors.starEditor.cameraControlStores;
		editorStores = window.threeScene.editors.starEditor.editorStores;
		sceneStores = {
			showGridStore: window.threeScene.editors.starEditor.sceneBackground.showGridStore,
			showBackgroundStore: window.threeScene.editors.starEditor.sceneBackground.showBackgroundStore,
			backgroundIdStore: window.threeScene.editors.starEditor.sceneBackground.selectedBackgroundStore
		}
    });

    onDestroy(() => {
        window.threeScene.editors.starEditor.stopSystem();
		cameraStores = null;
		editorStores = null;
    });
</script>

{#if selectedSection.typeIndex == 0 && selectedSection.index == 0}
    <CameraControlGroup bind:cameraControlStores={cameraStores} />
{/if}

{#if sceneStores!=null && sceneStores!=undefined && selectedSection.typeIndex == 0 && selectedSection.index == 1}
	<ControlGroup label="Scene">
		<Bool label="Show Grid" boolStore={sceneStores.showGridStore}/>
		<Bool label="Show Background" boolStore={sceneStores.showBackgroundStore}/>
		<BackgroundDropdownSelector backgroundSelectStore = {sceneStores.backgroundIdStore}/>
	</ControlGroup>	
{/if}

{#if editorStores != undefined && editorStores != null && selectedSection.typeIndex == 1 && selectedSection.index == 0}
	<ControlGroup label={"Name"}>
		<String label={"Name"} stringStore={editorStores.nameStore} />
	</ControlGroup>
    
	<ControlGroup label={"Colors"}>
		<Vector3Color label={"Color 1"} colorStore={editorStores.color1Store}/>
		<Vector3Color label={"Color 2"} colorStore={editorStores.color2Store}/>
		<Vector3Color label={"Fire Color"} colorStore={editorStores.fireColorStore}/>
		<Vector3Color label={"Glow Color"} colorStore={editorStores.outerColorStore}/>
	</ControlGroup>

	<ControlGroup label={"Height Mask (HM)"}>
		<Vector2Range label={"Shape HM Inv. Lerp"} min={0.0} max={1.0} vector2Store={editorStores.heightMaskInvLerpStore}/>
		<Vector2Range label={"Expansion HM Inv. Lerp"} min={0.0} max={2.0} vector2Store={editorStores.heightMaskStore}/>
	</ControlGroup>

	<ControlGroup label={"Expansion"}>
		<Float label={"Speed"} floatStore={editorStores.expansionSpeedStore} />
		<Float label={"Scale"} floatStore={editorStores.expansionScaleStore} />
		<Float label={"Heigh Offset"} floatStore={editorStores.expansionScaleHeightOffsetStore} />
		<Float label={"Distance"} floatStore={editorStores.expansionDistanceStore} />
	</ControlGroup>

	<ControlGroup label={"Screw"}>
		<Float label={"HM Multiplier"} floatStore={editorStores.screwHeightMaskMultiplierStore} />
		<Float label={"Interp. Multiplier"} floatStore={editorStores.screwInterpMultiplierStore} />
		<Float label={"Screw Multiplier"} floatStore={editorStores.screwMultiplierStore} />
	</ControlGroup>

	<ControlGroup label={"Noise"}>
		<Float label={"Voronoi Scale"} floatStore={editorStores.voronoiScaleStore} />
		<Float label={"2nd Smaple Scale"} floatStore={editorStores.noiseSample2ScaleStore} />
	</ControlGroup>

	<ControlGroup label={"Fresnel"}>
		<Float label={"Power"} floatStore={editorStores.fresnelPowerStore} />
		<Vector2Range label={"Remap"} vector2Store={editorStores.fresnelRemapStore} min={0.0} max={1.0}/>
	</ControlGroup>

	<ControlGroup label={"Misc"}>
		<Float label={"Radius"} floatStore={editorStores.radiusStore} />
		<Float label={"Density Multiplier"} floatStore={editorStores.densityMultiplierStore} />
		<Float label={"Fresnel Remap Max"} floatStore={editorStores.fireRemapMaxStore} min={0.0} max={1.0} addSlider={true}/>
		<Float label={"Glow Power"} floatStore={editorStores.outerLightPowerStore} />
	</ControlGroup>
{/if}
