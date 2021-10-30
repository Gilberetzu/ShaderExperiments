<script lang="ts">
    import ControlGroup from './ControlGroup.svelte';
    import Bool from '../DataUI/Bool.svelte';
    import Float from '../DataUI/Float.svelte';
    import Vector2 from '../DataUI/Vector2.svelte';
    import Vector2Range from '../DataUI/Vector2Range.svelte';
    import Vector3 from '../DataUI/Vector3.svelte';
    import Vector3Color from '../DataUI/Vector3Color.svelte';
    import String from '../DataUI/String.svelte';
    import EnumSelector from '../DataUI/EnumSelector.svelte';

    import CameraStores from '../SceneSection/CameraStores';

    export let cameraControlStores: CameraStores;
</script>

{#if cameraControlStores}
    <ControlGroup label={'Camera'}>
        <Vector2
            vector2Store={cameraControlStores.cameraRotation}
            tooltip={''}
            label={'Camera Rotation'}
        />
        <Float
            min={0}
            max={0}
            floatStore={cameraControlStores.cameraDistance}
            label={'Camera Distance'}
            addSlider={false}
        />
        <Vector3
            label={'Camera Rotation Center'}
            vector3Store={cameraControlStores.cameraRotationCenter}
            tooltip={''}
        />
        <Float
            floatStore={cameraControlStores.cameraFOV}
            label={'Camera FOV'}
            addSlider={false}
            max={0}
            min={0}
        />
        <Float
            floatStore={cameraControlStores.renderWidth}
            label={'Render Width'}
            addSlider={true}
            max={1080}
            min={256}
        />
        <Bool
            label="Pixel Perfect Viewport"
            boolStore={cameraControlStores.pixelPerfect}
        />
    </ControlGroup>
{/if}

<style>
</style>
