document.addEventListener('DOMContentLoaded', () => {

    // ── Tab switching ────────────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    // ════════════════════════════════════════════════════════════════
    // TAB 1 – Text to Speech
    // ════════════════════════════════════════════════════════════════
    const textInput    = document.getElementById('textInput');
    const voiceSelect  = document.getElementById('voiceSelect');
    const generateBtn  = document.getElementById('generateBtn');
    const spinner      = document.getElementById('spinner');
    const btnLabel     = document.getElementById('btnLabel');
    const charCounter  = document.getElementById('charCounter');
    const audioSection = document.getElementById('audioSection');
    const audioPlayer  = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadLink');
    const audioDuration= document.getElementById('audioDuration');
    const alertError   = document.getElementById('alertError');
    const validationMsg= document.getElementById('validationMsg');
    const regenerateBtn= document.getElementById('regenerateBtn');
    const MAX_CHARS    = 4096;

    textInput.addEventListener('input', () => {
        const len = textInput.value.length;
        charCounter.textContent = `${len} / ${MAX_CHARS}`;
        charCounter.classList.remove('warn', 'danger');
        if (len > MAX_CHARS * 0.9) charCounter.classList.add('danger');
        else if (len > MAX_CHARS * 0.7) charCounter.classList.add('warn');
        if (len > 0) validationMsg.classList.remove('show');
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        audioDuration.textContent = formatDuration(audioPlayer.duration);
    });

    generateBtn.addEventListener('click', generateAudio);
    regenerateBtn.addEventListener('click', generateAudio);

    async function generateAudio() {
        const text  = textInput.value.trim();
        const voice = voiceSelect.value;
        alertError.classList.remove('show');
        validationMsg.classList.remove('show');
        if (!text) { validationMsg.classList.add('show'); textInput.focus(); return; }

        setTtsLoading(true);
        audioSection.classList.remove('show');
        try {
            const res  = await fetch('/generate-audio-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice })
            });
            const data = await res.json();
            if (!res.ok || !data.success) { showError(alertError, data.error || 'Unexpected error.'); return; }
            playAudio(data.audioBase64, audioPlayer, downloadLink, `speech_${Date.now()}.mp3`);
            audioDuration.textContent = '';
            audioSection.classList.add('show');
        } catch (err) {
            showError(alertError, 'Network error: ' + err.message);
        } finally {
            setTtsLoading(false);
        }
    }

    function setTtsLoading(on) {
        generateBtn.disabled = on;
        spinner.classList.toggle('active', on);
        btnLabel.textContent = on ? 'Generating…' : 'Generate Voice';
    }

    // ════════════════════════════════════════════════════════════════
    // TAB 2 – Flight Announcement  (manual form entry)
    // ════════════════════════════════════════════════════════════════

    const raGenerateBtn     = document.getElementById('raGenerateBtn');
    const raRegenerateBtn   = document.getElementById('raRegenerateBtn');
    const raSpinner         = document.getElementById('raSpinner');
    const raBtnLabel        = document.getElementById('raBtnLabel');
    const raResultSection   = document.getElementById('raResultSection');
    const raAudioPlayer     = document.getElementById('raAudioPlayer');
    const raDownloadLink    = document.getElementById('raDownloadLink');
    const raAudioDuration   = document.getElementById('raAudioDuration');
    const raAlertError      = document.getElementById('ra-alertError');
    const raAnnouncementTxt = document.getElementById('raAnnouncementText');
    const raTrainNumberMsg  = document.getElementById('raTrainNumberMsg');
    const raHistorySection  = document.getElementById('raHistorySection');
    const raHistoryList     = document.getElementById('raHistoryList');
    const raClearHistory    = document.getElementById('raClearHistory');

    raAudioPlayer.addEventListener('loadedmetadata', () => {
        raAudioDuration.textContent = formatDuration(raAudioPlayer.duration);
    });

    raGenerateBtn.addEventListener('click', generateRailwayAnnouncement);
    raRegenerateBtn.addEventListener('click', generateRailwayAnnouncement);
    raClearHistory.addEventListener('click', () => {
        raHistoryList.innerHTML = '';
        raHistorySection.style.display = 'none';
    });

    // ── Generate flight announcement (manual) ────────────────────────
    async function generateRailwayAnnouncement() {
        const trainNumber   = document.getElementById('raTrainNumber').value.trim();
        const trainName     = document.getElementById('raTrainName').value.trim();
        const sourceStation = document.getElementById('raSource').value.trim();
        const destStation   = document.getElementById('raDestination').value.trim();
        const platform      = document.getElementById('raPlatform').value.trim();
        const terminal      = document.getElementById('raTerminal').value.trim();
        const status        = document.getElementById('raStatus').value;
        const delayMinutes  = document.getElementById('raDelay').value.trim();

        raAlertError.classList.remove('show');
        raTrainNumberMsg.classList.remove('show');

        if (!trainNumber) {
            raTrainNumberMsg.classList.add('show');
            document.getElementById('raTrainNumber').focus();
            return;
        }

        setRaLoading(true);
        raResultSection.classList.remove('show');

        try {
            const res  = await fetch('/generate-railway-announcement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trainNumber, trainName, sourceStation,
                    destinationStation: destStation,
                    platformNumber: platform, terminal, status, delayMinutes
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                showError(raAlertError, data.error || 'Unexpected error.');
                return;
            }

            raAnnouncementTxt.textContent = data.announcementText;
            playAudio(data.audioBase64, raAudioPlayer, raDownloadLink,
                      `flight-announcement_${Date.now()}.mp3`);
            raAudioDuration.textContent = '';
            raResultSection.classList.add('show');

            addToHistory({
                trainNumber, trainName, sourceStation,
                destinationStation: destStation,
                terminal, status, delayMinutes,
                announcementText: data.announcementText
            });

        } catch (err) {
            showError(raAlertError, 'Network error: ' + err.message);
        } finally {
            setRaLoading(false);
        }
    }

    function addToHistory(entry) {
        raHistorySection.style.display = 'block';
        raHistoryList.querySelectorAll('.ra-history-item').forEach(el => el.classList.remove('new'));

        const statusClass = {
            'On Time':      'status-ontime',
            'Boarding':     'status-arriving',
            'Delayed':      'status-delayed',
            'Gate Changed': 'status-changed',
            'Cancelled':    'status-cancelled'
        }[entry.status] || '';

        const delayBadge    = entry.delayMinutes
            ? `<span class="ra-history-tag status-delayed">⏱ ${entry.delayMinutes} min delay</span>` : '';
        const terminalBadge = entry.terminal
            ? `<span class="ra-history-tag">${entry.terminal}</span>` : '';
        const now = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const item = document.createElement('div');
        item.className = 'ra-history-item new';
        item.innerHTML = `
            <div class="ra-history-meta">
                <span class="ra-history-tag">✈️ ${entry.trainNumber} — ${entry.trainName || 'Flight'}</span>
                <span class="ra-history-tag">${entry.sourceStation || '?'} → ${entry.destinationStation || '?'}</span>
                ${terminalBadge}
                <span class="ra-history-tag ${statusClass}">${entry.status}</span>
                ${delayBadge}
            </div>
            <div class="ra-history-text">${entry.announcementText}</div>
            <div class="ra-history-time">🕐 ${now}</div>`;

        raHistoryList.insertBefore(item, raHistoryList.firstChild);
    }

    function setRaLoading(on) {
        raGenerateBtn.disabled = on;
        raSpinner.classList.toggle('active', on);
        raBtnLabel.textContent = on ? 'Generating…' : '✈️ Generate Announcement';
    }

    // ════════════════════════════════════════════════════════════════
    // TAB 1 – Live Simulation
    // 5 fixed FLIGHT announcements → POST /generate-audio-json → autoplay
    // Sequential: wait for audio to END, then 3s pause, then next announcement
    // No setInterval — avoids any overlap
    // ════════════════════════════════════════════════════════════════

    const LIVE_MESSAGES = [
        "Ladies and gentlemen, your attention please. Air India flight AI-202 from Mumbai to New Delhi is now boarding at Gate 14B, Terminal 2. Passengers are requested to proceed to the gate immediately with their boarding passes and valid identification. Thank you for flying Air India.",
        "Ladies and gentlemen, your attention please. IndiGo flight 6E-345 from Delhi to Bengaluru has been delayed by approximately 30 minutes due to operational reasons. The new estimated departure time is now updated on the departures board. We regret the inconvenience caused and thank you for your patience.",
        "Ladies and gentlemen, your attention please. Vistara flight UK-985 departing from Chennai to Mumbai is now ready for boarding at Gate 22, Terminal 1. Passengers are requested to have their boarding passes and photo identification ready for verification. We wish you a pleasant journey.",
        "Ladies and gentlemen, your attention please. SpiceJet flight SG-117 from Kolkata to Hyderabad will now depart from Gate 5C, Terminal 2, instead of the previously announced gate. Passengers are requested to kindly note this change and proceed to Gate 5C at the earliest. We apologise for any inconvenience.",
        "Ladies and gentlemen, your attention please. Air Asia India flight IX-763 from Pune to Goa has been cancelled due to unforeseen operational reasons. Passengers are requested to contact the Air Asia customer service desk in the arrivals hall for rebooking assistance and further information. We sincerely regret the inconvenience caused."
    ];

    const LIVE_TOTAL      = LIVE_MESSAGES.length;   // 5
    const PAUSE_AFTER_MS  = 3000;                    // 3-second pause after each audio ends

    let liveIndex        = 0;
    let liveRunning      = false;
    let liveSecondsLeft  = 0;
    let livePauseTimeout = null;   // holds the 3-second gap timer
    let liveCountdownId  = null;   // holds the countdown ticker

    // DOM refs
    const liveStartBtn      = document.getElementById('liveStartBtn');
    const liveStopBtn       = document.getElementById('liveStopBtn');
    const liveDot           = document.getElementById('liveDot');
    const liveStatusText    = document.getElementById('liveStatusText');
    const liveCounter       = document.getElementById('liveCounter');
    const liveProgressWrap  = document.getElementById('liveProgressWrap');
    const liveProgressFill  = document.getElementById('liveProgressFill');
    const liveCountdownText = document.getElementById('liveCountdownText');
    const liveNowPlaying    = document.getElementById('liveNowPlaying');
    const liveNowIndex      = document.getElementById('liveNowIndex');
    const liveNowText       = document.getElementById('liveNowText');
    const liveAudioPlayer   = document.getElementById('liveAudioPlayer');
    const liveList          = document.getElementById('liveList');
    const liveEmptyMsg      = document.getElementById('liveEmptyMsg');
    const liveAlertError    = document.getElementById('liveAlertError');
    const liveClearBtn      = document.getElementById('liveClearBtn');

    liveStartBtn.addEventListener('click', startLiveSimulation);
    liveStopBtn.addEventListener('click',  stopLiveSimulation);
    liveClearBtn.addEventListener('click', () => {
        liveList.innerHTML = '';
        liveList.appendChild(liveEmptyMsg);
        liveEmptyMsg.style.display = 'block';
        liveNowPlaying.style.display = 'none';
        liveAlertError.classList.remove('show');
    });

    // ── Start ────────────────────────────────────────────────────────
    function startLiveSimulation() {
        if (liveRunning) return;
        liveRunning = true;
        liveIndex   = 0;

        liveStartBtn.style.display     = 'none';
        liveStopBtn.style.display      = 'inline-flex';
        liveDot.className              = 'live-dot running';
        liveProgressWrap.style.display = 'flex';
        liveAlertError.classList.remove('show');

        // Kick off the sequential chain
        runNextAnnouncement();
    }

    // ── Stop (manual) ────────────────────────────────────────────────
    function stopLiveSimulation() {
        liveRunning = false;

        // Cancel any pending pause timer and countdown ticker
        clearTimeout(livePauseTimeout);
        clearInterval(liveCountdownId);
        livePauseTimeout = null;
        liveCountdownId  = null;

        // Stop audio immediately
        liveAudioPlayer.pause();
        liveAudioPlayer.src = '';

        liveStartBtn.style.display     = 'inline-flex';
        liveStopBtn.style.display      = 'none';
        liveDot.className              = 'live-dot';
        liveStatusText.textContent     = 'Simulation stopped.';
        liveCounter.textContent        = '';
        liveProgressWrap.style.display = 'none';
        liveProgressFill.style.width   = '0%';
        liveCountdownText.textContent  = '';
    }

    // ── All done ─────────────────────────────────────────────────────
    function finishLiveSimulation() {
        liveRunning = false;
        clearTimeout(livePauseTimeout);
        clearInterval(liveCountdownId);
        livePauseTimeout = null;
        liveCountdownId  = null;

        liveStartBtn.style.display     = 'inline-flex';
        liveStopBtn.style.display      = 'none';
        liveDot.className              = 'live-dot done';
        liveStatusText.textContent     = `✅ All ${LIVE_TOTAL} announcements completed!`;
        liveCounter.textContent        = '';
        liveProgressWrap.style.display = 'none';
    }

    // ── Sequential chain entry point ─────────────────────────────────
    // Called after each audio ends + 3s pause, until all 5 are done.
    function runNextAnnouncement() {
        if (!liveRunning)             return;
        if (liveIndex >= LIVE_TOTAL)  { finishLiveSimulation(); return; }

        fireAnnouncement(liveIndex);
        liveIndex++;
    }

    // ── Fire one announcement ────────────────────────────────────────
    async function fireAnnouncement(msgIndex) {
        if (!liveRunning) return;

        const text = LIVE_MESSAGES[msgIndex];

        liveStatusText.textContent = `Generating announcement ${msgIndex + 1} of ${LIVE_TOTAL}…`;
        liveCounter.textContent    = `${msgIndex + 1} / ${LIVE_TOTAL}`;

        // Show "now playing" panel immediately with the text
        liveNowPlaying.style.display = 'block';
        liveNowIndex.textContent     = msgIndex + 1;
        liveNowText.textContent      = text;
        if (liveEmptyMsg) liveEmptyMsg.style.display = 'none';

        // Hide progress bar while audio is generating / playing
        liveProgressFill.style.width  = '0%';
        liveCountdownText.textContent = '';

        try {
            const res  = await fetch('/generate-audio-json', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: 'alloy' })
            });
            const data = await res.json();

            if (!liveRunning) return;   // stopped while waiting for API

            if (!res.ok || !data.success) {
                showError(liveAlertError,
                    data.error || `Failed to generate audio for announcement ${msgIndex + 1}`);
                // Still continue to next after pause
                scheduleNext(msgIndex);
                return;
            }

            // Set up audio
            const blob = new Blob([base64ToUint8Array(data.audioBase64)], { type: 'audio/mpeg' });
            const url  = URL.createObjectURL(blob);
            liveAudioPlayer.src = url;
            liveAudioPlayer.load();

            liveStatusText.textContent = `🔊 Playing announcement ${msgIndex + 1} of ${LIVE_TOTAL}`;

            // Append to history list
            appendLiveItem(msgIndex + 1, text);

            // ── Wait for audio to finish, THEN schedule next ──────────
            liveAudioPlayer.onended = () => {
                liveAudioPlayer.onended = null;
                if (!liveRunning) return;
                scheduleNext(msgIndex);
            };

            // Fallback: if onended never fires (e.g. browser blocks autoplay)
            // schedule next after estimated duration + buffer
            liveAudioPlayer.play().catch(() => {
                // autoplay blocked — schedule next after 8s fallback
                scheduleNext(msgIndex, 8000);
            });

        } catch (err) {
            showError(liveAlertError,
                `Network error on announcement ${msgIndex + 1}: ${err.message}`);
            scheduleNext(msgIndex);
        }
    }

    // ── Schedule the next announcement after 3-second pause ──────────
    function scheduleNext(completedIndex, overrideDelayMs) {
        if (!liveRunning) return;

        // No next if this was the last
        if (completedIndex + 1 >= LIVE_TOTAL) {
            // Small delay so the last audio finishes visually before "done"
            livePauseTimeout = setTimeout(finishLiveSimulation, 500);
            return;
        }

        const delayMs = overrideDelayMs !== undefined ? overrideDelayMs : PAUSE_AFTER_MS;

        // Show 3-second countdown
        liveProgressWrap.style.display = 'flex';
        startPauseCountdown(delayMs);

        livePauseTimeout = setTimeout(() => {
            if (!liveRunning) return;
            clearInterval(liveCountdownId);
            liveCountdownId = null;
            liveProgressFill.style.width  = '0%';
            liveCountdownText.textContent = '';
            runNextAnnouncement();
        }, delayMs);
    }

    // ── Countdown during the 3-second pause ──────────────────────────
    function startPauseCountdown(totalMs) {
        clearInterval(liveCountdownId);
        liveSecondsLeft = Math.ceil(totalMs / 1000);
        liveProgressFill.style.width  = '0%';

        liveCountdownId = setInterval(() => {
            if (!liveRunning) { clearInterval(liveCountdownId); return; }
            liveSecondsLeft = Math.max(0, liveSecondsLeft - 1);
            const elapsed   = Math.ceil(totalMs / 1000) - liveSecondsLeft;
            const pct       = Math.min((elapsed / Math.ceil(totalMs / 1000)) * 100, 100);
            liveProgressFill.style.width  = pct + '%';
            liveCountdownText.textContent = liveSecondsLeft > 0
                ? `Next in ${liveSecondsLeft}s`
                : 'Starting…';
            if (liveSecondsLeft <= 0) clearInterval(liveCountdownId);
        }, 1000);
    }

    // ── Append item to the live list ─────────────────────────────────
    function appendLiveItem(num, text) {
        liveList.querySelectorAll('.live-item').forEach(el => el.classList.remove('latest'));

        const now = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const item = document.createElement('div');
        item.className = 'live-item latest';
        item.innerHTML = `
            <div class="live-item-header">
                <span class="live-item-num">Announcement ${num}</span>
                <span class="live-item-time">🕐 ${now}</span>
            </div>
            <div class="live-item-text">${text}</div>`;

        liveList.insertBefore(item, liveList.firstChild);
    }

    // ── Shared helpers ───────────────────────────────────────────────
    function playAudio(base64, player, link, filename) {
        const blob = new Blob([base64ToUint8Array(base64)], { type: 'audio/mpeg' });
        const url  = URL.createObjectURL(blob);
        player.src = url; player.load();
        link.href = url; link.download = filename;
        player.play().catch(() => {});
    }

    function showError(el, message) {
        el.textContent = '⚠️ ' + message;
        el.classList.add('show');
    }

    function formatDuration(dur) {
        if (!isFinite(dur)) return '';
        const m = Math.floor(dur / 60).toString().padStart(2, '0');
        const s = Math.floor(dur % 60).toString().padStart(2, '0');
        return `Duration: ${m}:${s}`;
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }
});
