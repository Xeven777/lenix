// Default settings
const defaultSettings = {
    enabled: false,
    duration: 1.2,
    direction: 'vertical',
    smooth: true,
    lerp: true,
    touchMultiplier: 2,
    smoothTouch: true,
    wheelMultiplier: 1,
    easing: 'expo',
    ignoreSelectors: '',
    infinite: false,
    hideScrollbar: false
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

const easingFunctions = {
    expo: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    sine: (t) => Math.sin((t * Math.PI) / 2),
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
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
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
};

// Load settings from Chrome storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(defaultSettings, (result) => {
            resolve(result);
        });
    });
}

let currentPreset = 'custom';

async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

function drawEasingCurve(easingType) {
    const canvas = document.getElementById('easingCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 158, 204, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, 0);
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();

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
    document.getElementById('presetsSelect').value = currentPreset;

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
    await saveSettings(settings);
    currentPreset = 'custom';
    updateUI();
    notifyContentScript(settings);
});

// Direction select
document.getElementById('directionSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.direction = e.target.value;
    await saveSettings(settings);
    currentPreset = 'custom';
    notifyContentScript(settings);
});

// Smooth toggle
document.getElementById('smoothToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smooth = !settings.smooth;
    await saveSettings(settings);
    currentPreset = 'custom';
    updateUI();
    notifyContentScript(settings);
});

// Lerp toggle
document.getElementById('lerpToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.lerp = !settings.lerp;
    await saveSettings(settings);
    currentPreset = 'custom';
    updateUI();
    notifyContentScript(settings);
});

// Toggle smooth touch
document.getElementById('smoothTouchToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smoothTouch = !settings.smoothTouch;
    await saveSettings(settings);
    currentPreset = 'custom';
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
    await saveSettings(settings);
    currentPreset = 'custom';
    notifyContentScript(settings);
});

// Touch multiplier slider
document.getElementById('touchSlider').addEventListener('input', (e) => {
    document.getElementById('touchValue').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
});

document.getElementById('touchSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.touchMultiplier = parseFloat(e.target.value);
    await saveSettings(settings);
    currentPreset = 'custom';
    notifyContentScript(settings);
});

// Wheel multiplier slider
document.getElementById('wheelSlider').addEventListener('input', (e) => {
    document.getElementById('wheelValue').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
});

document.getElementById('wheelSlider').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.wheelMultiplier = parseFloat(e.target.value);
    await saveSettings(settings);
    currentPreset = 'custom';
    notifyContentScript(settings);
});

// Easing select
document.getElementById('easingSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easing = e.target.value;
    await saveSettings(settings);
    currentPreset = 'custom';
    drawEasingCurve(e.target.value);
    notifyContentScript(settings);
});

// Ignore selectors input
document.getElementById('ignoreInput').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.ignoreSelectors = e.target.value;
    await saveSettings(settings);
    currentPreset = 'custom';
    notifyContentScript(settings);
});

document.getElementById('infiniteToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.infinite = !settings.infinite;
    await saveSettings(settings);
    currentPreset = 'custom';
    updateUI();
    notifyContentScript(settings);
});

document.getElementById('hideScrollbarToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.hideScrollbar = !settings.hideScrollbar;
    await saveSettings(settings);
    currentPreset = 'custom';
    updateUI();
    notifyContentScript(settings);
});

document.getElementById('presetsSelect').addEventListener('change', async (e) => {
    if (e.target.value === 'custom') return;

    currentPreset = e.target.value;
    const settings = await loadSettings();
    const preset = presets[e.target.value];

    Object.assign(settings, preset);
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