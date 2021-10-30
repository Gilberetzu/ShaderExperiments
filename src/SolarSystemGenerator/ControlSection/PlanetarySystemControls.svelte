<script lang="ts">
    import PlanetsWwoSatellitesDropdown from './PlanetarySystem/PlanetsWWOSatellitesDropdown.svelte';
    import { ManagedPlanetStore } from '../SceneSection/PlanetarySystemEditor';
    import StarDropdown from './PlanetarySystem/StarDropdown.svelte';
    import { onDestroy, onMount } from 'svelte';
	import BackgroundDropdownSelector from './BackgroundDropdownSelector.svelte';

    import { get, writable } from 'svelte/store';

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

    let loaded = false;
    let selectedStarStore;
    let starScaleStore;
    let managedPlanetsStores: Array<ManagedPlanetStore>;
    let cameraStores;
	let sceneStores : {
		showGridStore,
		showBackgroundStore,
		backgroundIdStore,
		showPath
	}
    let selectedNewPlanet = writable(-1);

    onMount(() => {
        window.threeScene.editors.planetarySystemEditor.startSystem(
            selectedObject.id
        );
        selectedStarStore =
            window.threeScene.editors.planetarySystemEditor.selectedStar;
        starScaleStore =
            window.threeScene.editors.planetarySystemEditor.starScale;

        cameraStores =
            window.threeScene.editors.planetarySystemEditor.cameraControlStores;

		sceneStores = {
			showGridStore: window.threeScene.editors.planetarySystemEditor.sceneBackground.showGridStore,
			backgroundIdStore: window.threeScene.editors.planetarySystemEditor.sceneBackground.selectedBackgroundStore,
			showBackgroundStore: window.threeScene.editors.planetarySystemEditor.sceneBackground.showBackgroundStore,
			showPath: window.threeScene.editors.planetarySystemEditor.showPlanetsPath
		}

        managedPlanetsStores =
            window.threeScene.editors.planetarySystemEditor
                .managedPlanetsStores;
        loaded = true;

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
                label: 'Planetary System'
            }
        ]);
    });

    onDestroy(() => {
        loaded = false;
        window.threeScene.editors.planetarySystemEditor.stopSystem();
    });

    let removePlanet = (index) => {
        window.threeScene.editors.planetarySystemEditor.removePlanet(index);

        managedPlanetsStores =
            window.threeScene.editors.planetarySystemEditor
                .managedPlanetsStores;
    };

    let addPlanet = () => {
        let planetId = get(selectedNewPlanet);
        window.threeScene.editors.planetarySystemEditor.addPlanetFromId(
            planetId
        );

        managedPlanetsStores =
            window.threeScene.editors.planetarySystemEditor
                .managedPlanetsStores;
    };
</script>

{#if loaded}
    {#if selectedSection.typeIndex == 0 && selectedSection.index == 0}
        <CameraControlGroup bind:cameraControlStores={cameraStores} />
    {/if}
    {#if sceneStores != null && sceneStores != undefined && selectedSection.typeIndex == 0 && selectedSection.index == 1}
        <ControlGroup label="Scene">
            <Bool label="Show Grid" boolStore={sceneStores.showGridStore} />
            <Bool
                label="Show Background"
                boolStore={sceneStores.showBackgroundStore}
            />
            <BackgroundDropdownSelector
                backgroundSelectStore={sceneStores.backgroundIdStore}
            />
        </ControlGroup>
		<ControlGroup label="Path">
			<Bool
                label="Show Path"
                boolStore={sceneStores.showPath}
            />
		</ControlGroup>
    {/if}
    {#if selectedSection.typeIndex == 1 && selectedSection.index == 0}
        <ControlGroup label={'Star'}>
            <StarDropdown selectedIdStore={selectedStarStore} />
            <Float label={'Star Scale'} floatStore={starScaleStore} />
        </ControlGroup>

        <ControlGroup label={'Planets'}>
            <div>
                <div>Select Planet</div>
                <div class="addPlanetBar">
                    <PlanetsWwoSatellitesDropdown
                        selectedIdStore={selectedNewPlanet}
                    />
                    <Button label="Add" on:click={addPlanet} />
                </div>
            </div>

            {#each managedPlanetsStores as mpStores, index}
                <ControlGroup label={`Planet - ${index}`}>
                    <Button
                        label="Remove"
                        on:click={() => {
                            removePlanet(index);
                        }}
                    />

                    <Float
                        label={'Orbit Start'}
                        floatStore={mpStores.orbitStartStore}
                        min={0.0}
                        max={3.14 * 2}
                        addSlider={true}
                    />
                    <Vector2
                        label={'Orbit Elipse'}
                        vector2Store={mpStores.orbitElipseStore}
                    />
                    <Vector2
                        label={'Orbit rotation'}
                        vector2Store={mpStores.orbitRotationStore}
                    />
                    <Vector3
                        label={'orbitCenterStore'}
                        vector3Store={mpStores.orbitCenterStore}
                    />
                    <Float
                        label={'Orbit Speed'}
                        floatStore={mpStores.orbitSpeedStore}
                    />

                    <Float label={'Size'} floatStore={mpStores.scaleStore} />
                </ControlGroup>
            {/each}
        </ControlGroup>
    {/if}
{/if}

<style>
    .addPlanetBar {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5em;
    }
</style>
