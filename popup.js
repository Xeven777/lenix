// Default settings
const defaultSettings = {
    enabled: false,
    duration: 1.2,
    direction: 'vertical',
    smooth: true,
    lerp: true,
    lerpValue: 0.1,
    touchMultiplier: 2,
    smoothTouch: true,
    wheelMultiplier: 1,
    easing: 'expo',
    easingPower: 10,
    easingAmplitude: 1,
    easingPeriod: 0.3,
    ignoreSelectors: '',
    infinite: false,
    hideScrollbar: false,
    currentPreset: 'custom',
    blacklistedSites: []
};

const presets = {
    balanced: {
        duration: 1.2,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        easing: 'expo',
        lerp: true,
        smooth: true
    },
    ultraSmooth: {
        duration: 2.5,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
        easing: 'sine',
        lerp: true,
        smooth: true
    },
    snappy: {
        duration: 0.6,
        wheelMultiplier: 1.5,
        touchMultiplier: 2.5,
        easing: 'quad',
        lerp: true,
        smooth: true
    },
    cinematic: {
        duration: 3,
        wheelMultiplier: 0.5,
        touchMultiplier: 1,
        easing: 'cubic',
        lerp: true,
        smooth: true
    },
    bounce: {
        duration: 1.8,
        wheelMultiplier: 1.2,
        touchMultiplier: 2,
        easing: 'bounce',
        lerp: true,
        smooth: true
    },
    elastic: {
        duration: 2,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.8,
        easing: 'elastic',
        lerp: true,
        smooth: true
    },
    lightning: {
        duration: 0.3,
        wheelMultiplier: 2,
        touchMultiplier: 3,
        easing: 'linear',
        lerp: false,
        smooth: true
    },
    butter: {
        duration: 2.8,
        wheelMultiplier: 0.6,
        touchMultiplier: 1.2,
        easing: 'sine',
        lerp: true,
        smooth: true
    }
};

function getEasingFunctions(power = 10, amplitude = 1, period = 0.3) {
    return {
        expo: (t) => Math.min(1, 1.001 - Math.pow(2, -power * t)),
        sine: (t) => Math.sin((t * Math.PI) / 2),
        quad: (t) => Math.pow(t, 2),
        cubic: (t) => Math.pow(t, 3),
        quart: (t) => Math.pow(t, 4),
        quint: (t) => Math.pow(t, 5),
        linear: (t) => t,
        bounce: (t) => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        },
        elastic: (t) => {
            if (t === 0 || t === 1) return t;
            return amplitude * Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / period)) + 1;
        }
    };
}

// Load settings from Chrome storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(defaultSettings, (result) => {
            resolve(result);
        });
    });
}

async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

function updateEasingParamVisibility(easingType) {
    const powerGroup = document.getElementById('easingPowerGroup');
    const amplitudeGroup = document.getElementById('easingAmplitudeGroup');
    const periodGroup = document.getElementById('easingPeriodGroup');

    powerGroup.style.display = 'none';
    amplitudeGroup.style.display = 'none';
    periodGroup.style.display = 'none';

    if (easingType === 'expo') {
        powerGroup.style.display = 'block';
    } else if (easingType === 'elastic') {
        amplitudeGroup.style.display = 'block';
        periodGroup.style.display = 'block';
    }
}

async function drawEasingCurve(easingType) {
    const canvas = document.getElementById('easingCanvas');
    if (!canvas) return;

    const settings = await loadSettings();
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 158, 204, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
        const x = (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    const easingFunctions = getEasingFunctions(
        settings.easingPower,
        settings.easingAmplitude,
        settings.easingPeriod
    );
    const easingFunc = easingFunctions[easingType] || easingFunctions.expo;

    ctx.beginPath();
    ctx.strokeStyle = '#ff9ecc';
    ctx.lineWidth = 2;

    for (let x = 0; x <= width; x++) {
        const t = x / width;
        const y = height - (easingFunc(t) * height);

        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();

    ctx.fillStyle = '#ffb3d9';
    ctx.beginPath();
    ctx.arc(0, height, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, 0, 4, 0, 2 * Math.PI);
    ctx.fill();
}

async function detectScrollLibs() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, {
            type: 'DETECT_LIBS'
        }, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ detected: [], hasAny: false });
                return;
            }
            if (response && response.detected) {
                resolve(response);
            } else {
                resolve({ detected: [], hasAny: false });
            }
        });
    });
}

// Update detection box
async function updateDetection() {
    const result = await detectScrollLibs();
    const indicator = document.getElementById('indicator');
    const detectionText = document.getElementById('detectionText');
    const detectedLibs = document.getElementById('detectedLibs');

    if (result.hasAny) {
        indicator.classList.remove('none');
        indicator.classList.add('detected');
        detectionText.textContent = `${result.detected.length} lib(s) detected`;
        detectedLibs.textContent = `> ${result.detected.join(', ')}`;
    } else {
        indicator.classList.add('none');
        indicator.classList.remove('detected');
        detectionText.textContent = 'No scroll libs detected';
        detectedLibs.textContent = '';
    }
}

// Update UI based on settings
async function updateUI() {
    const settings = await loadSettings();

    document.getElementById('toggleLenis').classList.toggle('active', settings.enabled);
    document.getElementById('durationSlider').value = settings.duration;
    document.getElementById('durationValue').textContent = settings.duration.toFixed(1) + 's';
    document.getElementById('directionSelect').value = settings.direction;
    document.getElementById('smoothToggle').classList.toggle('active', settings.smooth);
    document.getElementById('lerpToggle').classList.toggle('active', settings.lerp);
    document.getElementById('touchSlider').value = settings.touchMultiplier;
    document.getElementById('touchValue').textContent = settings.touchMultiplier.toFixed(1) + 'x';
    document.getElementById('smoothTouchToggle').classList.toggle('active', settings.smoothTouch);
    document.getElementById('wheelSlider').value = settings.wheelMultiplier;
    document.getElementById('wheelValue').textContent = settings.wheelMultiplier.toFixed(1) + 'x';
    document.getElementById('easingSelect').value = settings.easing;
    document.getElementById('ignoreInput').value = settings.ignoreSelectors;
    document.getElementById('infiniteToggle').classList.toggle('active', settings.infinite);
    document.getElementById('hideScrollbarToggle').classList.toggle('active', settings.hideScrollbar);
    document.getElementById('presetsSelect').value = settings.currentPreset || 'custom';
    document.getElementById('blacklistTextarea').value = (settings.blacklistedSites || []).join('\n');

    await checkIfCurrentSiteBlacklisted();

    document.getElementById('lerpSlider').value = settings.lerpValue;
    document.getElementById('lerpSliderValue').textContent = settings.lerpValue.toFixed(2);
    document.getElementById('easingPowerSlider').value = settings.easingPower;
    document.getElementById('easingPowerValue').textContent = settings.easingPower.toFixed(1);
    document.getElementById('easingAmplitudeSlider').value = settings.easingAmplitude;
    document.getElementById('easingAmplitudeValue').textContent = settings.easingAmplitude.toFixed(1);
    document.getElementById('easingPeriodSlider').value = settings.easingPeriod;
    document.getElementById('easingPeriodValue').textContent = settings.easingPeriod.toFixed(2);

    updateEasingParamVisibility(settings.easing);
    drawEasingCurve(settings.easing);

    const statusEl = document.getElementById('status');
    if (settings.enabled) {
        statusEl.textContent = '✓ active';
        statusEl.classList.add('active');
    } else {
        statusEl.textContent = '○ disabled';
        statusEl.classList.remove('active');
    }
}

// Toggle Lenis on/off
document.getElementById('toggleLenis').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.enabled = !settings.enabled;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Direction select
document.getElementById('directionSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.direction = e.target.value;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Smooth toggle
document.getElementById('smoothToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smooth = !settings.smooth;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Lerp toggle
document.getElementById('lerpToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.lerp = !settings.lerp;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Toggle smooth touch
document.getElementById('smoothTouchToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smoothTouch = !settings.smoothTouch;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Duration slider
document.getElementById('durationSlider').addEventListener('input', (e) => {
    document.getElementById('durationValue').textContent = parseFloat(e.target.value).toFixed(1) + 's';
});

document.getElementById('durationSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.duration = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Touch multiplier slider
document.getElementById('touchSlider').addEventListener('input', (e) => {
    document.getElementById('touchValue').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
});

document.getElementById('touchSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.touchMultiplier = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Wheel multiplier slider
document.getElementById('wheelSlider').addEventListener('input', (e) => {
    document.getElementById('wheelValue').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
});

document.getElementById('wheelSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.wheelMultiplier = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Easing select
document.getElementById('easingSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easing = e.target.value;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateEasingParamVisibility(e.target.value);
    drawEasingCurve(e.target.value);
    notifyContentScript(settings);
});

document.getElementById('lerpSlider').addEventListener('input', (e) => {
    document.getElementById('lerpSliderValue').textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById('lerpSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.lerpValue = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

document.getElementById('easingPowerSlider').addEventListener('input', (e) => {
    document.getElementById('easingPowerValue').textContent = parseFloat(e.target.value).toFixed(1);
    drawEasingCurve(document.getElementById('easingSelect').value);
});

document.getElementById('easingPowerSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easingPower = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

document.getElementById('easingAmplitudeSlider').addEventListener('input', (e) => {
    document.getElementById('easingAmplitudeValue').textContent = parseFloat(e.target.value).toFixed(1);
    drawEasingCurve(document.getElementById('easingSelect').value);
});

document.getElementById('easingAmplitudeSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easingAmplitude = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

document.getElementById('easingPeriodSlider').addEventListener('input', (e) => {
    document.getElementById('easingPeriodValue').textContent = parseFloat(e.target.value).toFixed(2);
    drawEasingCurve(document.getElementById('easingSelect').value);
});

document.getElementById('easingPeriodSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easingPeriod = parseFloat(e.target.value);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Ignore selectors input
document.getElementById('ignoreInput').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.ignoreSelectors = e.target.value;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
});

document.getElementById('infiniteToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.infinite = !settings.infinite;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

document.getElementById('hideScrollbarToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.hideScrollbar = !settings.hideScrollbar;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

document.getElementById('presetsSelect').addEventListener('change', async (e) => {
    if (e.target.value === 'custom') return;

    const settings = await loadSettings();
    const preset = presets[e.target.value];

    Object.assign(settings, preset);
    settings.currentPreset = e.target.value;
    await saveSettings(settings);

    const controlsContainer = document.querySelector('.controls');
    controlsContainer.querySelectorAll('.control-group').forEach(group => {
        group.classList.add('preset-highlight');
        setTimeout(() => group.classList.remove('preset-highlight'), 600);
    });

    updateUI();
    notifyContentScript(settings);
});// Reset to defaults
document.getElementById('resetBtn').addEventListener('click', async () => {
    await saveSettings(defaultSettings);
    updateUI();
    notifyContentScript(defaultSettings);
});

document.getElementById('blacklistTextarea').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    const lines = e.target.value.split('\n').map(line => line.trim()).filter(line => line);
    settings.blacklistedSites = lines;
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    notifyContentScript(settings);
    checkIfCurrentSiteBlacklisted();
});

document.getElementById('addCurrentSiteBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const hostname = url.hostname;

    const settings = await loadSettings();
    if (!settings.blacklistedSites) settings.blacklistedSites = [];

    if (!settings.blacklistedSites.includes(hostname)) {
        settings.blacklistedSites.push(hostname);
        settings.currentPreset = 'custom';
        await saveSettings(settings);
        updateUI();
        notifyContentScript(settings);
    }
});

document.getElementById('removeCurrentSiteBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const hostname = url.hostname;

    const settings = await loadSettings();
    if (!settings.blacklistedSites) settings.blacklistedSites = [];

    settings.blacklistedSites = settings.blacklistedSites.filter(site => site !== hostname);
    settings.currentPreset = 'custom';
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

async function checkIfCurrentSiteBlacklisted() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    const url = new URL(tab.url);
    const hostname = url.hostname;

    const settings = await loadSettings();
    const blacklist = settings.blacklistedSites || [];

    const isBlacklisted = blacklist.some(pattern => {
        const trimmedPattern = pattern.trim().toLowerCase();
        if (!trimmedPattern) return false;

        if (trimmedPattern.includes('*')) {
            const regexPattern = trimmedPattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`, 'i');
            return regex.test(hostname);
        }

        return hostname.includes(trimmedPattern);
    });

    const currentSiteStatus = document.getElementById('currentSiteStatus');
    const addBtn = document.getElementById('addCurrentSiteBtn');
    const removeBtn = document.getElementById('removeCurrentSiteBtn');

    if (isBlacklisted) {
        currentSiteStatus.textContent = `🚫 Current site (${hostname}) is blacklisted`;
        currentSiteStatus.style.color = '#ff9ecc';
        addBtn.disabled = true;
        removeBtn.disabled = false;
    } else {
        currentSiteStatus.textContent = `✓ Current site (${hostname}) is active`;
        currentSiteStatus.style.color = '#888';
        addBtn.disabled = false;
        removeBtn.disabled = true;
    }
}

// Save button (just closes popup)
document.getElementById('saveBtn').addEventListener('click', () => {
    window.close();
});

async function notifyContentScript(settings) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
        type: 'UPDATE_LENIS',
        settings: settings
    }, (response) => {
        if (chrome.runtime.lastError) {
            return;
        }
    });
}

updateUI();