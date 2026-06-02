// ── State ──────────────────────────────────────────────
let NUM = 8;
let sensordistance = 80, sensorsize = 5, linewidth = 100, linegradientwidth = 1, totalsensorlength = 0; //in mm
let middlepoint = 0;
let sensorlocation = new Array(NUM).fill(0);
let weights = new Array(NUM).fill(1);
let chart;
let MaxModulation = 255;
let MotorMaxSpeed = 1000;
let perSensorValue = new Array(NUM).fill(4096);
let weightmultiplier = 10

// ── Build sensor buttons ───────────────────────────────
function buildSensors() {
    perSensorValue = new Array(NUM).fill(4096);
    weights = new Array(NUM).fill(1);
    sensorlocation = new Array(NUM).fill(0);

    for(let i = 0; i < NUM; i++) {
        sensorlocation[i] = ((sensorsize / 2) + (sensordistance * i) + (sensorsize * i));
    }
    totalsensorlength = (sensordistance * (NUM - 1)) + (sensorsize * NUM);
    
    document.getElementById('LineSlider').min = (totalsensorlength / 2) * -1;
    document.getElementById('LineSlider').max = totalsensorlength / 2;
    document.getElementById('weight-multiplier-input').value = weightmultiplier;
    document.getElementById('PWMMaxModulation').value = MaxModulation;
    document.getElementById('MaxSpeed').value = MotorMaxSpeed;
    document.getElementById('numberofsensor').value = NUM;
    document.getElementById('distancebetweensensor').value = sensordistance;
    document.getElementById('sensorsize').value = sensorsize;
    document.getElementById('linewidth').value = linewidth;
    document.getElementById('linegradient').value = linegradientwidth;
    const row = document.getElementById('sensorRow');
    row.innerHTML = '';
    perSensorValue.forEach((w, i) => {
        const col = document.createElement('div');
        col.className = 'sensor-col';

        const data = document.createElement('div');
        data.id = 'sensor-visual-data-' + i;
        data.textContent = w;

        const sensorvisual = document.createElement('div');
        sensorvisual.className = 'sensor-visual';
        sensorvisual.id = 'sensor-visual-' + i;
        sensorvisual.appendChild(data);

        const wl = document.createElement('div');
        wl.className = 'sensor-weight';
        wl.textContent = "S" + (i+1);

        col.appendChild(sensorvisual);
        col.appendChild(wl);
        row.appendChild(col);
    });
}

function changenumberofsensor() {
    NUM = parseInt(document.getElementById('numberofsensor').value);
    buildSensors();
    buildWeightEditor();
    update();
}

// ── Build weight editor ────────────────────────────────
function buildWeightEditor() {
    const el = document.getElementById('weightEditor');
    el.innerHTML = '';
    weights.forEach((w, i) => {
        const col = document.createElement('div');
        col.className = 'weight-input-col';

        const lbl = document.createElement('label');
        lbl.textContent = 'S' + (i + 1);

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.value = w;
        inp.id = 'winput-' + i;
        inp.addEventListener('change', () => {
        weights[i] = parseFloat(inp.value) || 0;
        update();
        });

        col.appendChild(lbl);
        col.appendChild(inp);
        el.appendChild(col);
    });
}

// ── Clamp helper ───────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Main update ────────────────────────────────────────
function update() {
    // Refresh
    const lineposition = parseInt(document.getElementById('LineSlider').value);
    const base  = parseInt(document.getElementById('baseSpeed').value);
    const bias  = parseInt(document.getElementById('branchBias').value);
    const errorEl    = document.getElementById('metricError');
    const biaserrorEl = document.getElementById('metricBiasError');
    const leftBarEl  = document.getElementById('leftBar');
    const rightBarEl = document.getElementById('rightBar');
    const leftValEl  = document.getElementById('leftVal');
    const rightValEl = document.getElementById('rightVal');
    const rightSpeedEl = document.getElementById('speedRight');
    const leftSpeedEl = document.getElementById('speedLeft');
    const weightmultiplierinput = parseInt(document.getElementById('weight-multiplier-input').value);

    document.getElementById('baseSpeedVal').textContent = base + "%" + " /" + ((base / 100) * MotorMaxSpeed) + " RPM";
    document.getElementById('branchBiasVal').textContent = bias;

    linewidth = parseInt(document.getElementById('linewidth').value);

    weightmultiplier = weightmultiplierinput;

    let middlelinepoint = linewidth / 2;
    let positivelineedge = lineposition + middlelinepoint + (totalsensorlength / 2);
    let negativelineedge = lineposition - middlelinepoint + (totalsensorlength / 2);

    for(let i = 0; i < NUM; i++) {
        let sensorvalue = 0
        let idontknowhowtonameit = (sensorlocation[i] - (sensorsize / 2));
        for(let x = idontknowhowtonameit; x < (sensorlocation[i] + (sensorsize / 2)); x += 0.5) {
            let deltapositive = x - positivelineedge;
            let deltanegative = x - negativelineedge;
            if(deltanegative > 0 && deltapositive < 0) sensorvalue += Math.floor(Math.random() * 100);
            else sensorvalue += 4096;
        }
        perSensorValue[i] = sensorvalue / (sensorsize / 0.5); // 0.5 is integral resolution
    }

    perSensorValue.forEach((w, i) => {
        let gradientcolor = Math.round((w / 4096) * 255);
        document.getElementById('sensor-visual-data-' + i).textContent = (w).toFixed(0);
        document.getElementById('sensor-visual-' + i).style.background = `rgb(${gradientcolor}, ${gradientcolor}, ${gradientcolor})`;
        if(gradientcolor < 127.5) document.getElementById('sensor-visual-data-' + i).style.color = 'rgb(255, 255, 255)';
        else document.getElementById('sensor-visual-data-' + i).style.color = 'rgb(0, 0, 0)';
    });

    let totalWeightSensor = 0, totalRawSensor = 0;

    perSensorValue.forEach((a, i) => {
        totalWeightSensor += (a * weights[i]);
        totalRawSensor += a;
    });

    if(totalRawSensor === 0) error = 100;
    else error = totalWeightSensor / totalRawSensor;

    errorEl.textContent = error.toFixed(5);
    biaserrorEl.textContent = (error + bias).toFixed(5);

    let motorBaseSpeed = (base / 100) * MotorMaxSpeed;

    const left  = clamp(Math.round(motorBaseSpeed + (error * weightmultiplier) + bias), 0, MotorMaxSpeed);
    const right = clamp(Math.round(motorBaseSpeed - (error * weightmultiplier) - bias), 0, MotorMaxSpeed);

    let leftPWMValue = (left / MotorMaxSpeed) * MaxModulation;
    let rightPWMValue = (right / MotorMaxSpeed) * MaxModulation;

    leftBarEl.style.height  = ((leftPWMValue / MaxModulation) * 100).toFixed(1) + '%';
    rightBarEl.style.height = ((rightPWMValue / MaxModulation) * 100).toFixed(1) + '%';
    leftValEl.textContent  = ((leftPWMValue / MaxModulation) * 100).toFixed(0) + "%";
    rightValEl.textContent = ((rightPWMValue / MaxModulation) * 100).toFixed(0) + "%";
    rightSpeedEl.textContent = right + "RPM";
    leftSpeedEl.textContent = left + "RPM";
    //updateChartColors();
}

// ── Gaussian helper ────────────────────────────────────
function gaussVal(x, mu, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function checkData() {
    MaxModulation = parseFloat(document.getElementById('PWMMaxModulation').value) || 0;
    MotorMaxSpeed = parseFloat(document.getElementById('MaxSpeed').value) || 0;
    update();
}

function gaussData() {
    const center = (NUM - 1) / 2;
    return weights.map((w, i) => parseFloat(gaussVal(i, center, 2.5).toFixed(3)));
}

function helpopener() {
    document.getElementById('helper').classList.toggle('open');
}

// ── Slider listeners ───────────────────────────────────
document.getElementById('baseSpeed').addEventListener('input', update);
document.getElementById('branchBias').addEventListener('input', update);
document.getElementById('LineSlider').addEventListener('input', update);
document.getElementById('linewidth').addEventListener('input', update);
document.getElementById('PWMMaxModulation').addEventListener('change', checkData);
document.getElementById('MaxSpeed').addEventListener('change', checkData);
document.getElementById('numberofsensor').addEventListener('change', changenumberofsensor);


// ── Init ───────────────────────────────────────────────
buildSensors();
buildWeightEditor();
//buildChart();
update();
setPreset('center');