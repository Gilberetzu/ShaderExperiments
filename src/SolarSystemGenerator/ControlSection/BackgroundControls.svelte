<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Writable, writable, get } from 'svelte/store';
    import ObjectsStore from '../ObjectsStore';
    import * as THREE from 'three';

    import Dropdown from '../DataUI/Dropdown.svelte';
    import CameraControlGroup from './CameraControlGroup.svelte';
    import ControlGroup from './ControlGroup.svelte';

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
    let backgroundMaterialStores;

    onMount(() => {
        //Create dropdown options
        setSystemUISections([
            {
                typeIndex: 0,
                label: 'Camera'
            }
        ]);

        setEditabelUISections([
            {
                typeIndex: 1,
                label: 'Background'
            }
        ]);

        window.threeScene.editors.backgroundEditor.startSystem(
            selectedObject.id
        );

        if (window.threeScene.editors.backgroundEditor.enabled) {
            backgroundMaterialStores =
                window.threeScene.editors.backgroundEditor.editorStores;
            cameraStores =
                window.threeScene.editors.backgroundEditor.cameraControlStores;
        }
    });

    onDestroy(() => {
        window.threeScene.editors.backgroundEditor.stopSystem();
    });
</script>

{#if selectedSection.typeIndex == 0 && selectedSection.index == 0}
    <CameraControlGroup bind:cameraControlStores={cameraStores} />
{/if}

{#if backgroundMaterialStores != undefined && backgroundMaterialStores != null}
    {#if selectedSection.typeIndex == 1 && selectedSection.index == 0}
        <ControlGroup label={'Colors'}>
            <Vector3Color
                label="Color 1"
                colorStore={backgroundMaterialStores.color0Store}
            />
            <Vector3Color
                label="Color 2"
                colorStore={backgroundMaterialStores.color1Store}
            />
            <Vector3Color
                label="Color 3"
                colorStore={backgroundMaterialStores.color2Store}
            />
        </ControlGroup>

        <ControlGroup label={'Stars'}>
            <Vector3Color
                label="Color"
                colorStore={backgroundMaterialStores.colorStarStore}
            />
            <Float
                label="Noise Scale"
                floatStore={backgroundMaterialStores.noiseStarScaleStore}
                addSlider={false}
            />
            <Float
                label="Mask Speed"
                floatStore={backgroundMaterialStores.noiseStarMaskSpeedStore}
            />
            <Vector2Range
                label="Noise Smooth Step"
                vector2Store={backgroundMaterialStores.noiseStarSmoothStepStore}
                min={0.0}
                max={1.0}
            />
        </ControlGroup>

        <ControlGroup label={'Noise Mask'}>
            <Vector2Range
                label="Smooth Step"
                min={-1.0}
                max={1.0}
                vector2Store={backgroundMaterialStores.noiseMaskSmoothStepStore}
            />
            <Float
                label="Scale"
                floatStore={backgroundMaterialStores.noiseMaskScaleStore}
            />
            <Vector3
                label="Offset"
                vector3Store={backgroundMaterialStores.noiseMaskOffsetStore}
            />
        </ControlGroup>

        <ControlGroup label={'Background Noise'}>
            <Float
                label="Step Size"
                floatStore={backgroundMaterialStores.rayStepSizeStore}
            />
            <Float
                label="DensityMult"
                floatStore={backgroundMaterialStores.densityMultStore}
            />
            <ControlGroup label={'Main Noise'}>
                <Float
                    label="Scale"
                    floatStore={backgroundMaterialStores.mainNoiseScaleStore}
                    min={0.0}
                    max={10}
                    addSlider={true}
                />
                <Float
                    label="Screw"
                    floatStore={backgroundMaterialStores.mainNoiseScrewStore}
                />
            </ControlGroup>

            <ControlGroup label={'Noise 1'}>
                <Float
                    label="Scale"
                    floatStore={backgroundMaterialStores.noise1ScaleStore}
                    min={0.0}
                    max={10}
                    addSlider={true}
                />
                <Float
                    label="Speed"
                    floatStore={backgroundMaterialStores.noise1SpeedStore}
                />
                <Float
                    label="Screw"
                    floatStore={backgroundMaterialStores.noise1ScrewStore}
                />
                <Float
                    label="Multiplier"
                    floatStore={backgroundMaterialStores.noise1MultStore}
                    min={0.0}
                    max={1.0}
                    addSlider={true}
                />
            </ControlGroup>

            <ControlGroup label={'Noise 2'}>
                <Float
                    label="Scale"
                    floatStore={backgroundMaterialStores.noise2ScaleStore}
                    min={0.0}
                    max={10}
                    addSlider={true}
                />
                <Float
                    label="Speed"
                    floatStore={backgroundMaterialStores.noise2SpeedStore}
                />
                <Float
                    label="Screw"
                    floatStore={backgroundMaterialStores.noise2ScrewStore}
                />
                <Float
                    label="Multiplier"
                    floatStore={backgroundMaterialStores.noise2MultStore}
                    min={0.0}
                    max={1.0}
                    addSlider={true}
                />
            </ControlGroup>
        </ControlGroup>
    {/if}
{/if}

<style>
</style>
