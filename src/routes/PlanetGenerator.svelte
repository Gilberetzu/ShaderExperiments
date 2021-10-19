<script context="module">
</script>

<script>
    import { onMount } from 'svelte';
    import SinglePlanetGen from '../PlanetGenerator/SinglePlanetGen';
    import SliderFloat from '../PlanetGenerator/UniformsUI/SliderFloat.svelte';
    import Vec2 from '../PlanetGenerator/UniformsUI/Vec2.svelte';
    import Vec3Color from '../PlanetGenerator/UniformsUI/Vec3Color.svelte';
    import Vec3 from '../PlanetGenerator/UniformsUI/Vec3.svelte';
    import ByMeIcon from '../CommonComponents/ByMeIcon.svelte';
    import ControlHeader from '../PlanetGenerator/UniformsUI/ControlHeader.svelte';
    import Boolean from '../PlanetGenerator/UniformsUI/Boolean.svelte';
    import SocialLinks from '../CommonComponents/SocialLinks.svelte';

	const RaymarchSettingType = {
        NORMAL: 'NORMAL',
        LOW: 'LOW',
        HIGH: 'HIGH'
    };

    let canvasElement;
    let planetGenerator;
	let canvasNearestFiltering = false;

    let currentResolution = {
        width: 1,
        height: 1
    };
    let renderScale = 1;

    let exampleList = [
        {
            name: 'WhiteGreen',
            url: '/Examples/WhiteAndGreen.txt'
        },
        {
            name: 'Earthy',
            url: '/Examples/Earthy.txt'
        },
        {
            name: 'Spiky',
            url: '/Examples/Spiky.txt'
        },
        {
            name: 'Purple',
            url: '/Examples/Purple.txt'
        },
        {
            name: 'RedAndBlue',
            url: '/Examples/RedAndBlue.txt'
        }
    ];

    let renderResolution = { x: 800, y: 450 };
	let renderRaymarchSetting = RaymarchSettingType.HIGH;
    let updateShaderUniform = () => {};

    let controls = [];
    let fileInput;

    const ControlTypes = {
        CONTROL: 'CONTROL',
        HEADER: 'HEADER',
        DIVISOR: 'DIVISOR',
        SYSTEM: 'SYSTEM'
    };

    let downloadAElement;
    let uploadJsonElement;

    let saveImage = () => {
        planetGenerator.renderForFile(
            renderResolution,
            currentRaymarchRuntimeSetting,
			renderRaymarchSetting
        );
        canvasElement.toBlob((blob) => {
            saveRenderToImage(
                blob,
                `PlanetRender_${renderResolution.x}_${renderResolution.y}.png`
            );
        });
    };

    let saveImageCurrent = () => {
        planetGenerator.renderForFileCurrent();
        canvasElement.toBlob((blob) => {
            saveRenderToImage(blob, `PlanetRender.png`);
        });
    };

    let saveRenderToImage = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        downloadAElement.href = url;
        downloadAElement.download = filename;
        downloadAElement.click();

        planetGenerator.resizeRenderer(planetGenerator.desiredWidth);
    };

    
    let currentRaymarchRuntimeSetting = RaymarchSettingType.NORMAL;

    let convertJSONtoControls = () => {
        uploadJsonElement.click();
    };

    let exampleWindowOpen = false;

    let loadExamples = () => {
        exampleWindowOpen = true;
    };

    let convertControlsToJSON = () => {
        let controlsJSON = [];
        for (let i = 0; i < controls.length; i++) {
            const control = controls[i];

            if (control.type == ControlTypes.CONTROL) {
                let val = null;
                let uniformVal =
                    planetGenerator.uniforms[control.params.uniformName].value;
                if (control.dataType == 'vec3Color') {
                    val = uniformVal.convert.convertLinearToSRGB().getHexString();
                } else if (control.dataType == 'float') {
                    val = uniformVal;
                } else if (control.dataType == 'vec2') {
                    val = { x: uniformVal.x, y: uniformVal.y };
                } else if (control.dataType == 'vec3') {
                    val = { x: uniformVal.x, y: uniformVal.y, z: uniformVal.z };
                } else if (control.dataType == 'bool') {
                    val = uniformVal;
                } else {
                    val = JSON.stringify(
                        planetGenerator.uniforms[control.params.uniformName]
                            .value
                    );
                }
                controlsJSON.push({
                    type: ControlTypes.CONTROL,
                    dataType: control.dataType,
                    uniformName: control.params.uniformName,
                    value: val
                });
            }
        }

        downloadAElement.href = URL.createObjectURL(
            new Blob([JSON.stringify(controlsJSON, null, 2)], {
                type: 'text/plain'
            })
        );
        downloadAElement.download = 'planetParams.txt';
        downloadAElement.click();
        console.log('done');
    };

    let fileChanged = (event) => {
        if (event.target.files.length == 0) return;
        let eTarget = event.target;
        let reader = new FileReader();
        reader.onload = (event) => {
            let jsonData = JSON.parse(event.target.result);
            setJSONDataToControls(jsonData);
            eTarget.value = '';
        };
        reader.readAsText(event.target.files[0]);
    };

    let setJSONDataToControls = (jsonData) => {
        let newControls = [];
        for (let i = 0; i < controls.length; i++) {
            const controlElement = controls[i];
            if (controlElement.type == ControlTypes.CONTROL) {
                let data = jsonData.find(
                    (element) =>
                        element.uniformName == controlElement.params.uniformName
                );
                controlElement.params.defaultValue =
                    data != undefined && data != null
                        ? data.value
                        : controlElement.params.defaultValue;
                newControls.push(controlElement);
            } else {
                newControls.push(controlElement);
            }
        }
        controls = [];
        requestAnimationFrame(() => {
            controls = newControls;
        });
    };

    let readJson = (exampleURL) => {
        fetch(exampleURL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }
                return response.json();
            })
            .then((json) => {
                console.log(json);
                try {
                    setJSONDataToControls(json);
                } catch (e) {
                    console.log(e);
                }
                exampleWindowOpen = false;
            })
            .catch(function () {
                this.dataError = true;
            });
    };

    let setRenderResolution = (name, value) => {
        renderResolution.x = value.x;
        renderResolution.y = value.y;
    };

    onMount(() => {
        planetGenerator = new SinglePlanetGen(canvasElement);
        planetGenerator.animate();

        renderScale = planetGenerator.renderScale;

        updateShaderUniform = (uniformName, newValue) => {
            planetGenerator.uniforms[uniformName].value = newValue;
        };

        let newControls = [
            {
                type: ControlTypes.HEADER,
                label: 'Camera Controls'
            },
            {
                type: ControlTypes.SYSTEM,
                component: SliderFloat,
                params: {
                    min: -3.14,
                    max: 3.14,
                    step: 0.01,
                    label: 'Camera Rotation Planar',
                    uniformName: 'cameraRotationPlanar',
                    defaultValue: 0
                }
            },
            {
                type: ControlTypes.SYSTEM,
                component: SliderFloat,
                params: {
                    min: -3.14 / 2,
                    max: 3.14 / 2,
                    step: 0.01,
                    label: 'Camera Rotation Vertical',
                    uniformName: 'cameraRotationVertical',
                    defaultValue: 0
                }
            },
            {
                type: ControlTypes.SYSTEM,
                component: SliderFloat,
                params: {
                    min: 1.2,
                    max: 2.5,
                    step: 0.01,
                    label: 'Camera Distance',
                    uniformName: 'setCameraDistance',
                    defaultValue: 2
                }
            },
			{
                type: ControlTypes.SYSTEM,
                component: Boolean,
                params: {
                    label: 'Tone mapping',
                    uniformName: 'setToneMapping',
                    defaultValue: false
                }
            },
            {
                type: ControlTypes.SYSTEM,
                component: SliderFloat,
                params: {
                    min: 40,
                    max: 90,
                    step: 0.01,
                    label: 'Camera FOV',
                    uniformName: 'setCameraFOV',
                    defaultValue: 60
                }
            },
            {
                type: ControlTypes.SYSTEM,
                component: SliderFloat,
                params: {
                    min: 246,
                    max: 1080,
                    step: 0.01,
                    label: 'Render Width',
                    uniformName: 'setRenderWidth',
                    defaultValue: 300
                }
            },
            {
                type: ControlTypes.HEADER,
                label: 'Planet Surface Parameters'
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3,
                dataType: 'vec3',
                params: {
                    label: 'Noise Offset',
                    uniformName: '_PSNoiseOffset',
                    defaultValue:
                        planetGenerator.uniforms['_PSNoiseOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.01,
                    max: 20.0,
                    step: 0.01,
                    label: 'Noise Global Scale',
                    uniformName: '_PSNoiseGlobalScale',
                    defaultValue:
                        planetGenerator.uniforms['_PSNoiseGlobalScale'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.01,
                    max: 1.0,
                    step: 0.01,
                    label: 'Water Height',
                    uniformName: '_PSWaterHeight',
                    defaultValue:
                        planetGenerator.uniforms['_PSWaterHeight'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.01,
                    max: 1.0,
                    step: 0.01,
                    label: 'Water Depth',
                    uniformName: '_PSWaterDepthOffset',
                    defaultValue:
                        planetGenerator.uniforms['_PSWaterDepthOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.01,
                    max: 1.0,
                    step: 0.01,
                    label: 'Height Over Water',
                    uniformName: '_PSMaxHeightOffset',
                    defaultValue:
                        planetGenerator.uniforms['_PSMaxHeightOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec2,
                dataType: 'vec2',
                params: {
                    label: 'Noise Scales',
                    uniformName: '_PSNoiseScales',
                    defaultValue:
                        planetGenerator.uniforms['_PSNoiseScales'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -1.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Secondary Noise Strength',
                    uniformName: '_SecondaryNoiseStrengthGround',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_SecondaryNoiseStrengthGround'
                        ].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -10.0,
                    max: 10.0,
                    step: 0.01,
                    label: 'Max Screw Terrain',
                    uniformName: '_MaxScrewTerrain',
                    defaultValue:
                        planetGenerator.uniforms['_MaxScrewTerrain'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -1.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Density Offset',
                    uniformName: '_PSDensityOffset',
                    defaultValue:
                        planetGenerator.uniforms['_PSDensityOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Surface Min Light',
                    uniformName: '_SurfaceMinLight',
                    defaultValue:
                        planetGenerator.uniforms['_SurfaceMinLight'].value
                }
            },
            {
                type: ControlTypes.DIVISOR
            },
            {
                type: ControlTypes.CONTROL,
                component: Boolean,
                dataType: 'bool',
                params: {
                    label: 'Enable Voxel',
                    uniformName: '_EnableVoxelizer',
                    defaultValue:
                        planetGenerator.uniforms['_EnableVoxelizer'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 1.0,
                    max: 100.0,
                    step: 1,
                    label: 'Grid Half Size',
                    uniformName: '_GridHalfSize',
                    defaultValue:
                        planetGenerator.uniforms['_GridHalfSize'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Voxel Normal Interp',
                    uniformName: '_VoxelNormalInterp',
                    defaultValue:
                        planetGenerator.uniforms['_VoxelNormalInterp'].value
                }
            },

            {
                type: ControlTypes.DIVISOR
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: '_Planet Color 1',
                    uniformName: '_PlanetColor1',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_PlanetColor1'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: '_Planet Color 2',
                    uniformName: '_PlanetColor2',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_PlanetColor2'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.HEADER,
                label: 'Ocean Parameters'
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: 'Water Color Depth',
                    uniformName: '_WaterColorDepth',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_WaterColorDepth'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: 'Water Color Surface',
                    uniformName: '_WaterColor',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_WaterColor'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.DIVISOR
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec2,
                dataType: 'vec2',
                params: {
                    label: 'Water Depth Smooth Step',
                    uniformName: '_WaterMaterialSmoothStep',
                    defaultValue:
                        planetGenerator.uniforms['_WaterMaterialSmoothStep']
                            .value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 20.0,
                    step: 0.01,
                    label: 'Water Normal Scale',
                    uniformName: '_WaterNormalScale',
                    defaultValue:
                        planetGenerator.uniforms['_WaterNormalScale'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Water Min Light',
                    uniformName: '_WaterSurfaceMinLight',
                    defaultValue:
                        planetGenerator.uniforms['_WaterSurfaceMinLight'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Water Normal Strength',
                    uniformName: '_WaterNormalStrength',
                    defaultValue:
                        planetGenerator.uniforms['_WaterNormalStrength'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec2,
                dataType: 'vec2',
                params: {
                    label: 'Specular Params',
                    uniformName: '_SpecularParams',
                    defaultValue:
                        planetGenerator.uniforms['_SpecularParams'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Water Move Speed',
                    uniformName: '_WaterMoveSpeed',
                    defaultValue:
                        planetGenerator.uniforms['_WaterMoveSpeed'].value
                }
            },
            {
                type: ControlTypes.HEADER,
                label: 'Cloud Parameters'
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1,
                    step: 0.01,
                    label: 'Cloud Transparency',
                    uniformName: '_CloudTransparency',
                    defaultValue:
                        planetGenerator.uniforms['_CloudTransparency'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: 'Cloud Color 1',
                    uniformName: '_CloudColor1',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_CloudColor1'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: 'Cloud Color 2',
                    uniformName: '_CloudColor2',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_CloudColor2'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -10.0,
                    max: 10.0,
                    step: 0.01,
                    label: 'Cloud Max Screw',
                    uniformName: '_MaxScrewCloud',
                    defaultValue:
                        planetGenerator.uniforms['_MaxScrewCloud'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Cloud Mid Distance',
                    uniformName: '_CloudMidDistance',
                    defaultValue:
                        planetGenerator.uniforms['_CloudMidDistance'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 0.5,
                    step: 0.01,
                    label: 'Cloud Half Height',
                    uniformName: '_CloudHalfHeight',
                    defaultValue:
                        planetGenerator.uniforms['_CloudHalfHeight'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec2,
                dataType: 'vec2',
                params: {
                    label: 'Cloud Noise Scales',
                    uniformName: '_CloudNoiseScales',
                    defaultValue:
                        planetGenerator.uniforms['_CloudNoiseScales'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3,
                dataType: 'vec3',
                params: {
                    label: 'Cloud Noise Offset',
                    uniformName: '_CloudNoiseOffset',
                    defaultValue:
                        planetGenerator.uniforms['_CloudNoiseOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 20,
                    step: 0.01,
                    label: 'Cloud Noise Global Scale',
                    uniformName: '_CloudNoiseGlobalScale',
                    defaultValue:
                        planetGenerator.uniforms['_CloudNoiseGlobalScale'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -1.0,
                    max: 1.0,
                    step: 0.01,
                    label: 'Cloud Secondary Noise Strength',
                    uniformName: '_SecondaryNoiseStrength',
                    defaultValue:
                        planetGenerator.uniforms['_SecondaryNoiseStrength']
                            .value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.0,
                    max: 20,
                    step: 0.01,
                    label: 'Cloud Noise Multiplier',
                    uniformName: '_CloudDensityMultiplier',
                    defaultValue:
                        planetGenerator.uniforms['_CloudDensityMultiplier']
                            .value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -10.0,
                    max: 10.0,
                    step: 0.01,
                    label: 'Cloud Noise Offset',
                    uniformName: '_CloudDensityOffset',
                    defaultValue:
                        planetGenerator.uniforms['_CloudDensityOffset'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: -2.0,
                    max: 2.0,
                    step: 0.01,
                    label: 'Cloud Move Speeed',
                    uniformName: '_CloudMoveSpeed',
                    defaultValue:
                        planetGenerator.uniforms['_CloudMoveSpeed'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: Boolean,
                dataType: 'bool',
                params: {
                    label: 'Cloud Posterize',
                    uniformName: '_CloudsPosterize',
                    defaultValue:
                        planetGenerator.uniforms['_CloudsPosterize'].value
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 1.0,
                    max: 10.0,
                    step: 1.0,
                    label: 'Posterize Count',
                    uniformName: '_CloudsPosterizeCount',
                    defaultValue:
                        planetGenerator.uniforms['_CloudsPosterizeCount'].value
                }
            },
            {
                type: ControlTypes.HEADER,
                label: 'Atmosphere Parameters'
            },
            {
                type: ControlTypes.CONTROL,
                component: Vec3Color,
                dataType: 'vec3Color',
                params: {
                    label: 'Atmosphere Color',
                    uniformName: '_AmbientColor',
                    defaultValue:
                        planetGenerator.uniforms[
                            '_AmbientColor'
                        ].value.getHexString()
                }
            },
            {
                type: ControlTypes.CONTROL,
                component: SliderFloat,
                dataType: 'float',
                params: {
                    min: 0.5,
                    max: 10.0,
                    step: 0.01,
                    label: 'Atmosphere Power',
                    uniformName: '_AmbientPower',
                    defaultValue:
                        planetGenerator.uniforms['_AmbientPower'].value
                }
            },

            {
                type: ControlTypes.DIVISOR
            }
        ];

        controls = newControls;
    });
</script>

<a style="display: none;" bind:this={downloadAElement}>download</a>
<div class="container">
    <div class="canvasRenderHolder">
        <canvas class:crispCanvas={canvasNearestFiltering} class="canvasRender" bind:this={canvasElement} />
    </div>
    <div class="sideControls">
        <h1>Raymarching Planet Generator</h1>
        <div class="iconHolder">
            <div class="pageLinkHolder">
                <ByMeIcon />
                <a class="pageLink" href="https://www.euriherasme.com/" />
            </div>
        </div>

        <div class="DoubleButtons">
            <div class="RButton" on:click={convertControlsToJSON}>
                Save to JSON
            </div>
            <div class="RButton" on:click={convertJSONtoControls}>
                Load from JSON
            </div>
        </div>
        <input
            style="display: none;"
            bind:this={uploadJsonElement}
            type="file"
            on:change={fileChanged}
            bind:value={fileInput}
        />

        <div class="RButton" on:click={loadExamples}>Load Example</div>

        <ControlHeader HeaderLabel={'Render Settings'} />
        <Vec2
            label={'Render Resolution'}
            uniformName={''}
            defaultValue={{ x: 800, y: 450 }}
            updateShaderUniform={setRenderResolution}
        />
        <div class="DoubleButtons">
            <div class="RButton" on:click={saveImage}>Render</div>
            <div class="RButton" on:click={saveImageCurrent}>
                Render Current
            </div>
        </div>
		<div class="TripleButtons">
            <div
                class:RButton={renderRaymarchSetting !=
                    RaymarchSettingType.LOW}
                class:RButtonSelected={renderRaymarchSetting ==
                    RaymarchSettingType.LOW}
                on:click={() => {
                    renderRaymarchSetting = RaymarchSettingType.LOW;
                }}
            >
                Low
            </div>
            <div
                class:RButton={renderRaymarchSetting !=
                    RaymarchSettingType.NORMAL}
                class:RButtonSelected={renderRaymarchSetting ==
                    RaymarchSettingType.NORMAL}
                on:click={() => {
                    renderRaymarchSetting = RaymarchSettingType.NORMAL;
                }}
            >
                Normal
            </div>
            <div
                class:RButton={renderRaymarchSetting !=
                    RaymarchSettingType.HIGH}
                class:RButtonSelected={renderRaymarchSetting ==
                    RaymarchSettingType.HIGH}
                on:click={() => {
                    renderRaymarchSetting = RaymarchSettingType.HIGH;
                }}
            >
                High
            </div>
        </div>
        <ControlHeader HeaderLabel={'Raymarching Settings'} />
        <div class="TripleButtons">
            <div
                class:RButton={currentRaymarchRuntimeSetting !=
                    RaymarchSettingType.LOW}
                class:RButtonSelected={currentRaymarchRuntimeSetting ==
                    RaymarchSettingType.LOW}
                on:click={() => {
                    currentRaymarchRuntimeSetting = RaymarchSettingType.LOW;
                    planetGenerator.setRaymarchLowSettings();
                }}
            >
                Low
            </div>
            <div
                class:RButton={currentRaymarchRuntimeSetting !=
                    RaymarchSettingType.NORMAL}
                class:RButtonSelected={currentRaymarchRuntimeSetting ==
                    RaymarchSettingType.NORMAL}
                on:click={() => {
                    currentRaymarchRuntimeSetting = RaymarchSettingType.NORMAL;
                    planetGenerator.setRaymarchNormalSettings();
                }}
            >
                Normal
            </div>
            <div
                class:RButton={currentRaymarchRuntimeSetting !=
                    RaymarchSettingType.HIGH}
                class:RButtonSelected={currentRaymarchRuntimeSetting ==
                    RaymarchSettingType.HIGH}
                on:click={() => {
                    currentRaymarchRuntimeSetting = RaymarchSettingType.HIGH;
                    planetGenerator.setRaymarchHighSettings();
                }}
            >
                High
            </div>
        </div>
		<Boolean label={"Pixel Perfect Viewport"} defaultValue={false} bind:value={canvasNearestFiltering}/>
        {#each controls as control}
            {#if control.type == ControlTypes.CONTROL}
                <svelte:component
                    this={control.component}
                    bind:updateShaderUniform
                    {...control.params}
                />
            {:else if control.type == ControlTypes.HEADER}
                <ControlHeader HeaderLabel={control.label} />
            {:else if control.type == ControlTypes.DIVISOR}
                <div class="Divisor" />
            {:else if control.type == ControlTypes.SYSTEM}
                <svelte:component
                    this={control.component}
                    updateShaderUniform={(uniformName, newValue) => {
                        planetGenerator[uniformName](newValue);
                    }}
                    {...control.params}
                />
            {/if}
        {/each}

        <div class="specialThanks">
            Special thanks to <a href="https://twitter.com/iquilezles"
                >Iñigo Quilez</a
            >
            and <a href="https://twitter.com/SebastianLague">Sebastian Lague</a>
            for their awesome articles and videos on Raymarching.
        </div>

        <div>
            <div style={'text-align:center'}>Contact information</div>
            <SocialLinks />
        </div>
    </div>
</div>

{#if exampleWindowOpen}
    <div class="exampleWindow">
        <div class="windowInner">
            <div class="windowTitle">Examples</div>
            <div>
                {#each exampleList as example}
                    <div
                        class="exampleEntry"
                        on:click={() => {
                            readJson(example.url);
                        }}
                    >
                        {example.name}
                    </div>
                {/each}
            </div>
        </div>
        <div
            class="windowBackground"
            on:click={() => {
                exampleWindowOpen = false;
            }}
        />
    </div>
{/if}

<style>
    .crispCanvas {
        image-rendering: optimizeSpeed; /* Older versions of FF          */
        image-rendering: -moz-crisp-edges; /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated; /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor; /* IE                            */
    }
    .pageLinkHolder {
        position: relative;
    }
    .pageLink {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
    }
    .specialThanks {
        font-size: 1.3em;
        margin-top: 2em;
        margin-bottom: 1em;
        color: var(--c1);
        font-weight: 300;
    }
    .specialThanks a {
        color: var(--c1);
    }
    .exampleWindow {
        position: fixed;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        display: grid;
        place-content: center;
    }
    .exampleEntry {
        cursor: pointer;
        font-weight: 300;
        padding: 0.5em 2em;
        font-size: 1.2em;
        background-color: var(--c4);
        color: var(--c1);
    }
    .exampleEntry:hover {
        background-color: var(--c2);
        color: var(--c1);
    }
    .windowInner {
        width: 30vw;
        height: 50vh;
        background-color: var(--c4);
        overflow: auto;
        color: var(--c1);
        z-index: 100;
    }
    .windowTitle {
        background-color: var(--c1);
        color: var(--c4);
        font-weight: 300;
        font-size: 2em;
        padding: 0em 1em;
    }
    .windowBackground {
        opacity: 0.5;
        background-color: var(--c4);
        width: 100%;
        height: 100%;
        position: absolute;
    }

    h1 {
        font-weight: 300;
        margin-bottom: 0.5em;
        text-align: center;
    }
    .iconHolder {
        display: grid;
        place-content: center;
        grid-template-columns: 50%;
        position: relative;
    }
    :global(body) {
        padding: 0px;
        margin: 0px;
    }
    .container {
        width: 100vw;
        height: 100vh;
        position: fixed;
        display: grid;
        grid-template-columns: 1fr 400px;

        grid-template-areas: 'render sideControls';
    }
    .topControls {
        grid-area: topControls;
    }
    .canvasRenderHolder {
        grid-area: render;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    .canvasRender {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .sideControls {
        grid-area: sideControls;
        padding: 0em 1em;
        background-color: var(--c4);
        color: var(--c1);
        overflow-y: auto;
    }
    .Divisor {
        width: 100%;
        height: 1em;
        position: relative;
    }
    .Divisor::after {
        content: '';
        width: 50%;
        height: 0.25em;
        position: absolute;
        left: 25%;
        top: 0.7em;
        border-radius: 1em;
        background-color: var(--c2);
    }
    .RButtonSelected {
        background-color: var(--c2);
        color: var(--c1);
        transform: scale(0.9);
        font-weight: 700;
        font-size: 1.2em;
        text-align: center;
        padding: 0.5em 0px;
        margin-top: 1em;
        pointer-events: none;
    }
    .RButton {
        background-color: var(--c1);
        color: var(--c4);
        font-weight: 700;
        font-size: 1.2em;
        text-align: center;
        padding: 0.5em 0px;
        margin-top: 1em;
        cursor: pointer;
    }
    .RButton:hover {
        background-color: var(--c3);
        color: var(--c1);
    }
    .DoubleButtons {
        display: grid;
        gap: 1em;
        grid-template-columns: 1fr 1fr;
    }
    .TripleButtons {
        display: grid;
        gap: 1em;
        grid-template-columns: 1fr 1fr 1fr;
    }
</style>
