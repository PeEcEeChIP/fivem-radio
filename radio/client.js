const customRadios = [];
let isPlaying = false;
let index = -1;
let volume = getVolume();
let previousVolume = volume;

function getVolume() {
    return GetProfileSetting(306) / 10;
}

function createRadios() {
    for (let i = 0, length = GetNumResourceMetadata("radio", "supersede_radio"); i < length; i++) {
        const radio = GetResourceMetadata("radio", "supersede_radio", i);

        if (!availableRadios.includes(radio)) {
            console.error(`radio: ${radio} is an invalid radio.`);
            continue;
        }

        try {
            const data = JSON.parse(GetResourceMetadata("radio", "supersede_radio_extra", i));
            if (data !== null) {
                customRadios.push({
                    "isPlaying": false,
                    "name": radio,
                    "data": data
                });
                if (data.name) {
                    AddTextEntry(radio, data.name);
                }
            } else {
                console.error(`radio: Missing data for ${radio}.`);
            }
        } catch (e) {
            console.error(e);
        }
    }
    sendNuiMessage("create", { "radios": customRadios, "volume": volume });
}

function sendNuiMessage(type, data) {
    SendNuiMessage(JSON.stringify(Object.assign({"type": type}, data)));
}

createRadios();

RegisterNuiCallbackType("radio:ready");
on("__cfx_nui:radio:ready", (data, cb) => {
    previousVolume = -1;
    createRadios();
});

const PlayCustomRadio = (radio) => {
    isPlaying = true;
    index = customRadios.indexOf(radio);
    ToggleCustomRadioBehavior();
    sendNuiMessage("play", { "radio": radio.name });
};

const StopCustomRadios = () => {
    isPlaying = false;
    ToggleCustomRadioBehavior();
    sendNuiMessage("stop");
};

const ToggleCustomRadioBehavior = () => {
    SetFrontendRadioActive(!isPlaying);

    if (isPlaying) {
        StartAudioScene("DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE");
    } else {
        StopAudioScene("DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE");
    }
};

setTick(() => {
    if (IsPlayerVehicleRadioEnabled()) {
        let playerRadioStationName = GetPlayerRadioStationName();
        let customRadio = customRadios.find((radio) => radio.name === playerRadioStationName);

        if (!isPlaying && customRadio) {
            PlayCustomRadio(customRadio);
        } else if (isPlaying && customRadio && customRadios.indexOf(customRadio) !== index) {
            StopCustomRadios();
            PlayCustomRadio(customRadio);
        } else if (isPlaying && !customRadio) {
            StopCustomRadios();
        }
    } else if (isPlaying) {
        StopCustomRadios();
    }

    volume = getVolume();
    if (previousVolume !== volume) {
        sendNuiMessage("volume", { "volume": volume });
        previousVolume = volume;
    }
});
