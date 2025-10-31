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
    ignoreSelectors: ''
};

// Load settings from Chrome storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(defaultSettings, (result) => {
            resolve(result);
        });
    });
}

// Save settings to Chrome storage
async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
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
    updateUI();
    notifyContentScript(settings);
});

// Direction select
document.getElementById('directionSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.direction = e.target.value;
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Smooth toggle
document.getElementById('smoothToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smooth = !settings.smooth;
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Lerp toggle
document.getElementById('lerpToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.lerp = !settings.lerp;
    await saveSettings(settings);
    updateUI();
    notifyContentScript(settings);
});

// Toggle smooth touch
document.getElementById('smoothTouchToggle').addEventListener('click', async () => {
    const settings = await loadSettings();
    settings.smoothTouch = !settings.smoothTouch;
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
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Easing select
document.getElementById('easingSelect').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.easing = e.target.value;
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Ignore selectors input
document.getElementById('ignoreInput').addEventListener('change', async (e) => {
    const settings = await loadSettings();
    settings.ignoreSelectors = e.target.value;
    await saveSettings(settings);
    notifyContentScript(settings);
});

// Reset to defaults
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

// Initialize UI and detect libs on popup open
updateUI();
updateDetection();