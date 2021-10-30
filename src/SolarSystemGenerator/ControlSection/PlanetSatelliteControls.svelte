<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Writable, writable, get } from 'svelte/store';
    import ObjectsStore from "../ObjectsStore"
    import * as THREE from 'three';

	import RaymarchQuality from "../RaymarchingQuality";

    import Dropdown from '../DataUI/Dropdown.svelte';
	import CameraControlGroup from "./CameraControlGroup.svelte";
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

	import BackgroundDropdownSelector from "./BackgroundDropdownSelector.svelte";

    export let selectedObject: {
        id;
        key;
    };
    export let selectedSection;
    export let setEditabelUISections = (sections) => {};
    export let setSystemUISections = (sections) => {};

    type planet = {
        name: string;
        id: number;
    };
    let planetList: Array<planet> = [];
    let dropDownOptions: Array<string> = [];

    let dropdownValue = 0;
    let mainPlanetSelect = -1;

    let nameStore: Writable<string> = writable('planetWSatellite');
    let satelliteColl = [];

	let cameraStores;

	let objectStoreUnsub: ()=>void;
	let planetIdStoreUnsub: ()=>void;

	let sceneStores: {
		showGridStore,
		showBackgroundStore,
		backgroundIdStore,
		planetQuality,
		cloudQuality,
		showPath
	}

    onMount(() => {
        //Create dropdown options
        objectStoreUnsub = ObjectsStore.subscribe((state) => {
            planetList = state.planets.map((p) => {
                return {
                    name: p.object.name,
                    id: p.id
                };
            });

            dropDownOptions = planetList.map((p) => p.name);
        });

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
                label: 'Satellites'
            }
        ]);

        window.threeScene.editors.planetSatelliteEditor.startSystem(
            selectedObject.id
        );
		planetIdStoreUnsub = window.threeScene.editors.planetSatelliteEditor.mainPlanetIdStore.subscribe(pId => mainPlanetSelect = pId);
		nameStore = window.threeScene.editors.planetSatelliteEditor.planetWSatelliteNameStore;
        satelliteColl = [
            ...window.threeScene.editors.planetSatelliteEditor
                .satelliteCollection
        ];

		cameraStores =
            window.threeScene.editors.planetSatelliteEditor.cameraControlStores;
		
		sceneStores = {
			showBackgroundStore: null,
			cloudQuality: null,
			planetQuality: null,
			showGridStore: null,
			backgroundIdStore: null,
			showPath: null
		};
		sceneStores.showBackgroundStore = window.threeScene.editors.planetSatelliteEditor.sceneBackground.showBackgroundStore;
		sceneStores.showGridStore = window.threeScene.editors.planetSatelliteEditor.sceneBackground.showGridStore;
		sceneStores.backgroundIdStore = window.threeScene.editors.planetSatelliteEditor.sceneBackground.selectedBackgroundStore;
		sceneStores.planetQuality = window.threeScene.editors.planetSatelliteEditor.planetsRaymarchQualityStore;
		sceneStores.cloudQuality = window.threeScene.editors.planetSatelliteEditor.cloudsRaymarchQualityStore;
		sceneStores.showPath = window.threeScene.editors.planetSatelliteEditor.showPlanetsPath;
    });

	let removeSatellite = (satId)=>{
		window.threeScene.editors.planetSatelliteEditor.deleteSatellite(satId);
		satelliteColl = [
            ...window.threeScene.editors.planetSatelliteEditor
                .satelliteCollection
        ];
	}

    onDestroy(() => {
		objectStoreUnsub();
		planetIdStoreUnsub();
        window.threeScene.editors.planetSatelliteEditor.stopSystem();
    });

    let mainPlanetSelectorDropdownChange = (event) => {
        mainPlanetSelect = event.detail;
        window.threeScene.editors.planetSatelliteEditor.mainPlanetIdStore.set(
            mainPlanetSelect
        );
    };

    let addSatellite = () => {
        let satellitePlanetId = planetList[dropdownValue].id;
        window.threeScene.editors.planetSatelliteEditor.createSatellite(
            satellitePlanetId
        );
        satelliteColl = [
            ...window.threeScene.editors.planetSatelliteEditor
                .satelliteCollection
        ];
    };
</script>

{#if selectedSection.typeIndex == 0 && selectedSection.index == 0}
	<CameraControlGroup bind:cameraControlStores={cameraStores}/>
{/if}

{#if sceneStores!=null && sceneStores!=undefined && selectedSection.typeIndex == 0 && selectedSection.index == 1}
	<ControlGroup label="Scene">
		<Bool label="Show Grid" boolStore={sceneStores.showGridStore}/>
		<Bool label="Show Background" boolStore={sceneStores.showBackgroundStore}/>
		<BackgroundDropdownSelector backgroundSelectStore = {sceneStores.backgroundIdStore}/>
	</ControlGroup>	
	<ControlGroup label="Quality">
		<EnumSelector
			label={"Planet Quality"}
			tooltip={""}
			enumStore={sceneStores.planetQuality}
			enumObject={RaymarchQuality}
		/>
		<EnumSelector
			label={"Cloud Quality"}
			tooltip={""}
			enumStore={sceneStores.cloudQuality}
			enumObject={RaymarchQuality}
		/>
	</ControlGroup>
	<ControlGroup label={"Path"}>
		<Bool boolStore={sceneStores.showPath} label="Show Path"/>
	</ControlGroup>
{/if}

{#if selectedSection.typeIndex == 1 && selectedSection.index == 0}
    <ControlGroup label={'Main Planet'}>
        <String label="Name" stringStore={nameStore} />
        <Dropdown
            possibleOptions={dropDownOptions}
            bind:value={mainPlanetSelect}
            on:click={mainPlanetSelectorDropdownChange}
        />
    </ControlGroup>

    <ControlGroup label={'Satellite Collection'}>
        <div class="addPlanetBar">
            <Dropdown
                possibleOptions={dropDownOptions}
                bind:value={dropdownValue}
                on:click={(event) => {
                    dropdownValue = event.detail;
                }}
            />
            <Button label="Add" on:click={addSatellite} />
        </div>
        {#each satelliteColl as sat, Index (sat.id)}
            <ControlGroup label={`Satelite ${sat.id}`}>
                <div>
					<div>Planet Id</div>
					<Dropdown
						possibleOptions={dropDownOptions}
						value={planetList.findIndex((p) => p.id == sat.planetId)}
						on:click={(event) => {
							let select = event.detail;
							sat.planetIdStore.set(select);
						}}
					/>
				</div>

				<Button label="Remove" on:click={ ()=>{
					removeSatellite(sat.id);
				} }/>

                <Float
                    label={'Orbit Start'}
                    floatStore={sat.orbitStartStore}
                    min={0.0}
                    max={3.14 * 2}
                    addSlider={true}
                />
                <Vector2
                    label={'Orbit Elipse'}
                    vector2Store={sat.orbitElipseStore}
                />
                <Vector2
                    label={'Orbit rotation'}
                    vector2Store={sat.orbitRotationStore}
                />
                <Vector3
                    label={'orbitCenterStore'}
                    vector3Store={sat.orbitCenterStore}
                />
                <Float label={'Orbit Speed'} floatStore={sat.orbitSpeedStore} />

                <Vector2
                    label={'Rotation Axis'}
                    vector2Store={sat.rotationAxisStore}
                />
                <Float
                    label={'Rotation Axis'}
                    floatStore={sat.rotationSpeedStore}
                />

                <Float label={'Size'} floatStore={sat.scaleStore} />
            </ControlGroup>
        {/each}
    </ControlGroup>
{/if}

<style>
    .addPlanetBar {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5em;
    }
</style>
