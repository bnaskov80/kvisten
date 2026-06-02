 let isAdmin = false;
 let valtKort = null;
 let draggedElement = null;
 let inzoomatKort = null;
 let isDayView = false;

 let fokusTimer = null;
 const FOKUS_TID_MS = 20000;

 let kladRegler = [
     { min: -50, text: "Jacka på!", ikon: "🧥" },
{ min: 10, text: "Långärmad tröja", ikon: "👕" },
{ min: 15, text: "Bara t-shirt går bra", ikon: "👕" }
 ];

 const ikonKarta = {
     'bad': '🏊', 'simma': '🏊', 'gympa': '🤸', 'idrott': '👟', 'fotboll': '⚽', 'lek': '🛝', 'ute': '🌳', 'utegård': '🌳',
     'mellis': '🥪', 'fika': '🍪', 'mat': '🍲', 'lunch': '🍱', 'frukt': '🍌', 'äta': '🍽️',
     'skog': '🌲', 'natur': '🍄', 'utflykt': '🚌', 'tåg': '🚂', 'buss': '🚌',
     'pyssel': '🎨', 'rita': '🖍️', 'skapa': '✂️', 'måla': '🖌️', 'ler': '🏺', 'bygga': '🧱',
     'film': '🎬', 'bio': '🍿', 'spel': '🎲', 'ipad': '📱', 'dator': '💻', 'tv': '📺',
     'läsa': '📚', 'biblo': '📖', 'saga': '📕', 'läxor': '✏️', 'räkna': '🧮',
     'musik': '🎵', 'dans': '💃', 'sång': '🎤', 'samling': '👥', 'röris': '🤸',
     'vila': '🧘', 'sov': '😴', 'lugn': '🕯️', 'städ': '🧼', 'hjälpa': '🤝',
     'rast': '🛝', 'skola': '🏫', 'hem': '🏠', 'fritids': '🎈'
 };

 const gruppIkonMappning = { 'PLANETER': '🪐', 'SOLAR': '☀️', 'GALAXER': '🌀', 'MÅNAR': '🌙', 'STJÄRNOR': '⭐', 'KOMETER': '☄️', 'ALLA': '🌍' };
 const dagar = ['mandag', 'tisdag', 'onsdag', 'torsdag', 'fredag'];

 function createClockNumbers(clockElement) {
     clockElement.querySelectorAll('.clock-number').forEach(n => n.remove());
     for (let i = 1; i <= 12; i++) {
         const numDiv = document.createElement('div');
         numDiv.className = `clock-number n${i}`;
        numDiv.innerHTML = `<span style="color: #2d3748; font-weight: 600;">${i}</span>`;
         clockElement.appendChild(numDiv);
     }
 }

 function updateClock() {
     const now = new Date();
     const s = now.getSeconds(); const m = now.getMinutes(); const h = now.getHours();
     document.getElementById('sec-hand').style.transform = `rotate(${(s/60)*360}deg)`;
     document.getElementById('min-hand').style.transform = `rotate(${((m/60)*360)+((s/60)*6)}deg)`;
     document.getElementById('hour-hand').style.transform = `rotate(${((h/12)*360)+((m/60)*30)}deg)`;
     
     const nyttDatum = now.toLocaleDateString('sv-SE', {weekday:'long', day:'numeric', month:'long'});
     const datumElement = document.getElementById('datum');
     if (datumElement.innerText !== nyttDatum) {
         datumElement.innerText = nyttDatum;
     }

     // Uppdatera klockan i fokusläge om den är öppen
     if (inzoomatKort && inzoomatKort.classList.contains('har-tid')) {
         const tidInput = inzoomatKort.querySelector('.aktivitet-tid-input');
         stallInKortKlocka(tidInput.value, inzoomatKort);
     }
 }

 function stallInKortKlocka(tidVarde, kort) {
     const hHand = kort.querySelector('.fokus-hour-hand');
     const mHand = kort.querySelector('.fokus-min-hand');
     const dText = kort.querySelector('.fokus-digital-tid');
     const wedge = kort.querySelector('.fokus-wedge');
     const countdown = kort.querySelector('.fokus-countdown-text');

     if (!tidVarde || tidVarde === "") {
         if(dText) dText.innerText = "--:--";
         if(wedge) wedge.setAttribute('d', '');
         if(countdown) countdown.innerText = "";
         return;
     }

     if(dText) dText.innerText = tidVarde;
     const delar = tidVarde.split(':');
     const timmar = parseInt(delar[0], 10);
     const minuter = parseInt(delar[1], 10);

     const minuterGrader = (minuter / 60) * 360;
     const timmarGrader = ((timmar % 12) / 12) * 360 + (minuter / 60) * 30;

     if(hHand) hHand.style.transform = `rotate(${timmarGrader}deg)`;
     if(mHand) mHand.style.transform = `rotate(${minuterGrader}deg)`;

     // --- Beräkna tårtbit (från NU till STARTTID) ---
     const nu = new Date();

     const dagMappning = {1:'mandag', 2:'tisdag', 3:'onsdag', 4:'torsdag', 5:'fredag'};
     const idagStr = dagMappning[nu.getDay()];
     const lista = kort.closest('.aktivitets-lista');
     const arIdag = lista ? lista.getAttribute('data-dag') === idagStr : false;

     if (!arIdag) {
         if(wedge) wedge.setAttribute('d', '');
         if(countdown) countdown.innerText = "";
         return;
     }

     const nuH = nu.getHours();
     const nuM = nu.getMinutes();
     const nuMinuter = nuH * 60 + nuM;

     const startMinuter = timmar * 60 + minuter;
     let diff = startMinuter - nuMinuter;

     // Om tiden har passerat eller är mer än 12h framåt, rita inget
     if (diff <= 0 || diff > 720 || !wedge) {
         if(wedge) wedge.setAttribute('d', '');
         if(countdown) countdown.innerText = diff <= 0 && diff > -30 ? "Börjar nu!" : "";
         return;
     }

     if(countdown) {
         if (diff >= 60) {
             const h = Math.floor(diff / 60);
             const m = diff % 60;
             countdown.innerText = m > 0 ? `${h} tim ${m} min kvar` : `${h} tim kvar`;
         } else {
             countdown.innerText = `${diff} min kvar`;
         }
     }

     // SVG-matematik för tårtbiten
     const startVinkel = ((nuH % 12 + nuM / 60) / 12) * 360;
     const slutVinkel = timmarGrader;
     
     const r = 45; // Radie
     const cx = 50; // Centrum X
     const cy = 50; // Centrum Y

     const rad = (deg) => (deg * Math.PI) / 180;
     
     const x1 = cx + r * Math.cos(rad(startVinkel));
     const y1 = cy + r * Math.sin(rad(startVinkel));
     const x2 = cx + r * Math.cos(rad(slutVinkel));
     const y2 = cy + r * Math.sin(rad(slutVinkel));

     // Om tårtbiten är större än 180 grader behöver SVG en "large-arc-flag"
     const vinkelDiff = (slutVinkel - startVinkel + 360) % 360;
     const largeArcFlag = vinkelDiff > 180 ? 1 : 0;

     const d = `
         M ${cx} ${cy}
         L ${x1} ${y1}
         A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
         Z
     `;
     wedge.setAttribute('d', d);
 }

 async function setVaderPos() {
     const stad = document.getElementById('vader-stad-input').value;
     const btn = document.getElementById('vader-sok-btn');
     if(!stad) return;
     btn.disabled = true;
     let punkter = 0;
     const interval = setInterval(() => { punkter = (punkter + 1) % 4; btn.innerText = "Söker" + ".".repeat(punkter); }, 300);

     try {
         const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${stad}&count=1&language=sv&format=json`);
         const data = await res.json();
         clearInterval(interval);
         if(data.results && data.results.length > 0) {
             const stadData = data.results[0];
             localStorage.setItem('v-lat', stadData.latitude);
             localStorage.setItem('v-lon', stadData.longitude);
             localStorage.setItem('v-stad', stadData.name);
             btn.style.background = "var(--success)"; btn.innerText = "✅ Stad sparad!";
             hamtaVaderData();
             setTimeout(() => { btn.style.background = "var(--accent)"; btn.innerText = "Sök stad"; btn.disabled = false; }, 2000);
         } else {
             btn.style.background = "var(--error)"; btn.innerText = "❌ Hittade inte stad";
             setTimeout(() => { btn.style.background = "var(--accent)"; btn.innerText = "Sök stad"; btn.disabled = false; }, 2000);
         }
     } catch(e) { clearInterval(interval); btn.style.background = "var(--error)"; btn.innerText = "❌ Fel vid sökning"; btn.disabled = false; }
 }

 function refreshIcons() {
     // Phosphor Web Components/Fonts uppdateras automatiskt när DOM ändras
 }

 async function hamtaDynamicInfo() {
     try {
         const res = await fetch('https://sholiday.faboul.se/dagar/v2.1/');
         const data = await res.json();
         const idag = data.dagar[0];
         if(idag) {
             document.getElementById('vecka-visning').innerText = "V." + idag.vecka;
             const printVecka = document.getElementById('print-vecka');
             if(printVecka) printVecka.innerText = idag.vecka;
             document.getElementById('namnsdag-visning').innerText = "🌸 Namnsdag: " + idag.namnsdag.join(', ');
             if(idag.flaggdag) document.getElementById('namnsdag-visning').innerHTML += ` <span title="${idag.flaggdag}">🇸🇪</span>`;
         }
     } catch(e) { console.log("Kunde inte hämta dynamisk info"); }
 }

 function byggAnimeradIkon(code) {
     const container = document.getElementById('vader-container-box');
     container.innerHTML = "";
     if (code === 0) { container.innerHTML = '<div class="anim-sun"></div>'; }
     else if (code >= 1 && code <= 3) { container.innerHTML = '<div class="anim-sun" style="left: -10px; top: -10px;"></div><div class="anim-cloud" style="bottom: 15px; right: 10px;"></div>'; }
     else if (code >= 51 && code <= 67) { container.innerHTML = '<div class="anim-cloud"></div><div class="anim-rain-drop drop1"></div><div class="anim-rain-drop drop2"></div><div class="anim-rain-drop drop3"></div>'; }
     else if (code >= 71 && code <= 77) { container.innerHTML = '<div class="anim-cloud"></div><div class="anim-snow-flake flake1">❄</div><div class="anim-snow-flake flake2">❄</div>'; }
     else if (code >= 80 && code <= 82) { container.innerHTML = '<div class="anim-sun" style="left: -12px; top: -12px;"></div><div class="anim-cloud" style="bottom: 12px; right: 8px;"></div><div class="anim-rain-drop drop1" style="left:20px;"></div><div class="anim-rain-drop drop2" style="left:30px;"></div>'; }
     else if (code >= 95) { container.innerHTML = '<div class="anim-cloud" style="background:#4a5568;"></div><div class="anim-bolt">⚡</div>'; }
     else { container.innerHTML = '<div class="anim-cloud"></div>'; }
 }

 async function hamtaVaderData() {
     const lat = localStorage.getItem('v-lat') || 59.32;
     const lon = localStorage.getItem('v-lon') || 18.06;
     const stadNamn = localStorage.getItem('v-stad') || "Stockholm";
     document.getElementById('stads-namn-visning').innerText = stadNamn.toUpperCase();
     try {
         const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
         const data = await res.json();
         const w = data.current_weather; const temp = Math.round(w.temperature);
         document.getElementById('vader-temp').innerText = temp + "°C";
         byggAnimeradIkon(w.weathercode);

         const sorteradeRegler = [...kladRegler].sort((a, b) => b.min - a.min);
         const matchadRegel = sorteradeRegler.find(r => temp >= r.min) || sorteradeRegler[sorteradeRegler.length - 1];
         let bastext = matchadRegel.text; let basikon = matchadRegel.ikon;

         if (w.weathercode >= 51 && w.weathercode <= 67 || w.weathercode >= 80 && w.weathercode <= 82) {
             if (temp >= 15) { bastext = "T-shirt (Ta med regnjacka / paraply!)"; basikon = "🌧️"; }
             else if (temp >= 10) { bastext = "Skaljacka & överdragsbyxor"; basikon = "🌧️"; }
             else { bastext = "Fodrade regnkläder & stövlar!"; basikon = "👢"; }
         } else if (w.weathercode >= 71 && w.weathercode <= 77) {
             bastext = "Jacka på! (Det snöar! ☃️ Vantar rekommenderas)"; basikon = "🧣";
         }
         document.getElementById('klader-text').innerText = bastext;
         document.getElementById('klader-ikon').innerText = basikon;
         document.getElementById('vader-status').innerText = "🕒 Uppdaterat " + new Date().toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'});
     } catch(e) {
         console.error("Väderfel:", e);
         document.getElementById('vader-status').innerText = "⚠️ Kunde inte hämta väder";
     }
 }

 function laddaKladEditor() {
     const container = document.getElementById('klader-editor-container');
     container.innerHTML = "";
     kladRegler.sort((a,b) => a.min - b.min).forEach((regel, index) => {
         const div = document.createElement('div'); div.className = 'klad-regel';
         div.innerHTML = `<input type="number" value="${regel.min}" onchange="uppdateraRegel(${index}, 'min', this.value)"><input type="text" value="${regel.text}" onchange="uppdateraRegel(${index}, 'text', this.value)"><input type="text" value="${regel.ikon}" onchange="uppdateraRegel(${index}, 'ikon', this.value)"><button onclick="taBortRegel(${index})" style="background:none; border:none; color:var(--error); font-weight:bold;">✕</button>`;
         container.appendChild(div);
     });
 }

 function uppdateraRegel(index, felt, v) { if(felt === 'min') kladRegler[index].min = parseFloat(v); else kladRegler[index][felt] = v; spara(); }
 function taBortRegel(index) { kladRegler.splice(index, 1); laddaKladEditor(); spara(); }
 function laggTillRegel() { kladRegler.push({ min: 10, text: "Ny basregel", ikon: "🧥" }); laddaKladEditor(); spara(); }

 function allowDrop(ev) { ev.preventDefault(); }

 function handleDrop(ev) {
     ev.preventDefault();
     const list = ev.currentTarget;
     const targetDag = list.getAttribute('data-dag');
     const afterElement = getDragAfterElement(list, ev.clientY);
     if (afterElement == null) { list.appendChild(draggedElement); } else { list.insertBefore(draggedElement, afterElement); }
     draggedElement.onDragstartUpdateDag(targetDag);

     // Sorterar kolumnen kronologiskt efter att ett kort släppts i den
     sorteraListaTid(targetDag);
     spara();
 }

 function getDragAfterElement(container, y) {
     const draggableElements = [...container.querySelectorAll('.aktivitet-kort:not(.dragging)')];
     return draggableElements.reduce((closest, child) => {
         const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2;
         if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest;
     }, { offset: Number.NEGATIVE_INFINITY }).element;
 }

 /* AUTOMATISK TIDSSORTERINGSFUNKTION */
 function sorteraListaTid(dag) {
     const lista = document.getElementById('lista-' + dag);
     if (!lista) return;

     const kortArray = [...lista.querySelectorAll('.aktivitet-kort')];

     kortArray.sort((a, b) => {
         const tidA = a.querySelector('.aktivitet-tid-input').value;
         const tidB = b.querySelector('.aktivitet-tid-input').value;

         if (!tidA && !tidB) return 0;
         if (!tidA) return 1;  // Kort utan tid hamnar sist
         if (!tidB) return -1; // Kort utan tid hamnar sist

         return tidA.localeCompare(tidB);
     });

     kortArray.forEach(kort => lista.appendChild(kort));
 }

 function startaFokusTimer(kort) {
     nollstallFokusTimers();
     if (isAdmin) return;

     const timerBar = kort.querySelector('.fokus-timer-bar');
     if (timerBar) {
         timerBar.style.transition = 'none';
         timerBar.style.transform = 'scaleX(1)';
         timerBar.offsetHeight;
         timerBar.style.transition = `transform ${FOKUS_TID_MS}ms linear`;
         timerBar.style.transform = 'scaleX(0)';
     }

     fokusTimer = setTimeout(() => {
         stängAllaModalerOchFokus();
     }, FOKUS_TID_MS);
 }

 function nollstallFokusTimers() {
     if (fokusTimer) { clearTimeout(fokusTimer); fokusTimer = null; }
     document.querySelectorAll('.fokus-timer-bar').forEach(bar => {
         bar.style.transition = 'none';
         bar.style.transform = 'scaleX(1)';
     });
 }

 function cambiaDirezioneAdminPanel(swap) {
     const panel = document.getElementById('panel');
     const grid = panel.querySelector('.admin-grid');
     const cols = [...grid.querySelectorAll('.admin-col')];
     if(swap && cols.length >= 3) {
         grid.insertBefore(cols[2], cols[0]);
     }
 }

 function hanteraKortKlick(kort, event) {
     if (isAdmin) { markera(kort); return; }
     event.stopPropagation();

     if (kort.classList.contains('fokus-läge')) {
         startaFokusTimer(kort);
         return;
     }

     stängAllaModalerOchFokus();
     inzoomatKort = kort;
     document.body.classList.add('kort-fokus-aktiv');
     kort.classList.add('fokus-läge');
     adjustIconSize(kort.querySelector('.aktivitet-ikon-badge'));

     const tidInput = kort.querySelector('.aktivitet-tid-input');
     stallInKortKlocka(tidInput.value, kort);

     startaFokusTimer(kort);
 }

 function visaLoginModal() {
     if(!isAdmin) {
         stängAllaModalerOchFokus();
         document.body.classList.add('kort-fokus-aktiv');
         document.getElementById('admin-login-modal').style.display = 'flex';
         const input = document.getElementById('modal-pwd-field');
         input.value = "";
         setTimeout(() => input.focus(), 50);
         input.onkeydown = (e) => { if (e.key === "Enter") verifieraLösenordModal(); };
     }
 }

 function verifieraLösenordModal() {
     const input = document.getElementById('modal-pwd-field');
     if (input.value === LOSENORD) {
         isAdmin = true;
         stängAllaModalerOchFokus();
         document.body.classList.add('admin-active');
         document.getElementById('panel').style.display = "block";
         document.getElementById('adminBtn').style.display = "none";
         document.querySelectorAll('.lagg-till-btn, .radera-btn, .kopiera-btn').forEach(b => b.style.display = 'flex');
         document.querySelectorAll('.aktivitet-namn, #info-texten, #tavla-titel, #tavla-ikon').forEach(e => e.contentEditable = true);

         document.querySelectorAll('.aktivitet-ikon-badge').forEach(e => {
             e.contentEditable = true;
             e.setAttribute('data-manual-icon', e.getAttribute('data-custom') || "false");
         });

         const headerIkon = document.getElementById('tavla-ikon');
         if (headerIkon) {
             headerIkon.style.display = 'flex';
         }

         const headerTitel = document.getElementById('tavla-titel');
         if (headerTitel) {
             headerTitel.style.display = 'inline-block';
            headerTitel.style.paddingBottom = '0';
            headerTitel.style.backgroundImage = "none";
         }

         laddaKladEditor();
         const tInput = document.getElementById('titel-input');
         tInput.value = headerTitel.innerText;
         document.getElementById('vader-stad-input').value = localStorage.getItem('v-stad') || "Stockholm";
         cambiaDirezioneAdminPanel(true);
     } else {
         document.getElementById('admin-login-modal').style.display = 'none';
         document.getElementById('admin-error-modal').style.display = 'flex';
     }
 }

 function öppnaLoginModaligen() {
     document.getElementById('admin-error-modal').style.display = 'none';
     document.getElementById('admin-login-modal').style.display = 'flex';
     const input = document.getElementById('modal-pwd-field');
     input.value = "";
     setTimeout(() => input.focus(), 50);
 }

 function stängAllaModalerOchFokus() {
     nollstallFokusTimers();
     if (inzoomatKort) {
         const badge = inzoomatKort.querySelector('.aktivitet-ikon-badge');
         inzoomatKort.classList.remove('fokus-läge');
         if (badge) adjustIconSize(badge);
         inzoomatKort = null;
     }
     document.getElementById('admin-login-modal').style.display = 'none';
     document.getElementById('admin-error-modal').style.display = 'none';
     document.body.classList.remove('kort-fokus-aktiv');
 }

 function hanteraKortTidsÄndring(input, textElement, kort, dag) {
     const tidVärde = input.value;
     if (tidVärde && tidVärde !== "") {
         textElement.innerText = tidVärde;
         kort.classList.add('har-tid');
     } else {
         textElement.innerText = "";
         kort.classList.remove('har-tid');
     }
     stallInKortKlocka(tidVärde, kort);

     // Kör automatisk sortering direkt vid tidsändring
     sorteraListaTid(dag);
     spara();
 }

function visaKopieringsDialog(kort) {
    const kallaDag = kort.parentElement.id.replace('lista-', '');
    const dagNamn = { mandag: 'Måndag', tisdag: 'Tisdag', onsdag: 'Onsdag', torsdag: 'Torsdag', fredag: 'Fredag' };
    
    const gammal = document.getElementById('kopiera-modal');
    if (gammal) gammal.remove();

    const modal = document.createElement('div');
    modal.id = 'kopiera-modal';
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:20000; font-family: sans-serif;";
    
    const content = document.createElement('div');
    content.style = "background:white; padding:25px; border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.3); width:280px;";
    content.innerHTML = `<h3 style="margin-top:0; color:#2d3748;">Kopiera aktivitet</h3><p style="font-size:14px; color:#4a5568;">Välj vilka dagar du vill kopiera "<b>${kort.querySelector('.aktivitet-namn').innerText}</b>" till:</p>`;
    
    const form = document.createElement('div');
    form.style = "display:flex; flex-direction:column; gap:10px; margin:20px 0;";
    
    dagar.forEach(d => {
        if (d === kallaDag) return;
        const row = document.createElement('label');
        row.style = "display:flex; align-items:center; gap:10px; cursor:pointer; padding:5px; border-radius:5px;";
        row.innerHTML = `<input type="checkbox" value="${d}" style="width:18px; height:18px;"> <span>${dagNamn[d]}</span>`;
        form.appendChild(row);
    });
    
    content.appendChild(form);
    
    const footer = document.createElement('div');
    footer.style = "display:flex; justify-content:flex-end; gap:10px; margin-top:20px;";
    
    const cancel = document.createElement('button');
    cancel.innerText = "Avbryt";
    cancel.style = "padding:8px 15px; border:none; border-radius:8px; cursor:pointer; background:#edf2f7; color:#4a5568; font-weight:bold;";
    cancel.onclick = () => modal.remove();
    
    const confirm = document.createElement('button');
    confirm.innerText = "Kopiera";
    confirm.style = "padding:8px 15px; border:none; border-radius:8px; cursor:pointer; background:#4a7c44; color:white; font-weight:bold;";
    confirm.onclick = () => {
        const valda = [...form.querySelectorAll('input:checked')].map(i => i.value);
        if (valda.length > 0) {
            const aktText = kort.querySelector('.aktivitet-namn').innerText;
            const tid = kort.querySelector('.aktivitet-tid-input').value;
            const ikon = kort.querySelector('.aktivitet-ikon-badge').innerText;
            const ärCustom = kort.getAttribute('data-custom') === 'true';
            const grupper = [...kort.querySelectorAll('.grupp-tag')].map(t => t.innerText.replace(/[^\wåäöÅÄÖ]/g, '').trim());

            valda.forEach(dag => skapaKort(dag, aktText, grupper, ärCustom ? ikon : null, tid));
            spara();
        }
        modal.remove();
    };
    
    footer.appendChild(cancel);
    footer.appendChild(confirm);
    content.appendChild(footer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

 function skapaKort(dag, aktText = "", grupper = [], laddaIkon = null, laddaTid = "") {
     let nuvarandeDag = dag;
     const lista = document.getElementById('lista-' + nuvarandeDag);
     const kort = document.createElement('div');
     kort.className = 'aktivitet-kort';
     kort.draggable = true;

     kort.addEventListener('dragstart', (e) => {
         if(!isAdmin) { e.preventDefault(); return false; }
         draggedElement = kort;
         kort.classList.add('dragging');
     });
     kort.addEventListener('dragend', () => { kort.classList.remove('dragging'); });
     kort.onDragstartUpdateDag = (nyDag) => { nuvarandeDag = nyDag; };
     kort.onclick = (e) => hanteraKortKlick(kort, e);

     let sparadTid = laddaTid || "";

     kort.innerHTML = `
     <button class="radera-btn" onclick="this.parentElement.remove(); spara(); event.stopPropagation();" style="display:${isAdmin?'flex':'none'}" title="Radera aktivitet">🗑️</button>
     <button class="kopiera-btn" onclick="visaKopieringsDialog(this.parentElement); event.stopPropagation();" style="display:${isAdmin?'flex':'none'}; position: absolute; top: 5px; right: 35px;" title="Kopiera till andra dagar">📋</button>
     <div class="aktivitet-tid-wrapper">
     <span>🕒</span>
     <input type="time" class="aktivitet-tid-input" value="${sparadTid}">
     <span class="aktivitet-tid-text">${sparadTid}</span>
     </div>

     <div class="fokus-klock-container">
     <div class="analog-clock" style="width: 130px; height: 130px; border: 2px solid #4a5568; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
         <svg class="fokus-clock-svg" viewBox="0 0 100 100">
             <path class="fokus-wedge" d=""></path>
         </svg>
     <div class="center-dot"></div>
     <div class="hand hour-hand fokus-hour-hand"></div>
     <div class="hand min-hand fokus-min-hand"></div>
     </div>
     <div class="fokus-digital-tid" style="font-size: 28px; font-weight: 900; color: #2d3748; background: #f1f5f9; padding: 2px 14px; border-radius: 12px; margin-top: 5px; letter-spacing: 1px;">--:--</div>
     <div class="fokus-countdown-text"></div>
     </div>

     <div class="aktivitet-ikon-badge" contenteditable="${isAdmin}"></div>
     <div class="aktivitet-namn" contenteditable="${isAdmin}">${aktText}</div>
     <div class="grupper-container"></div>
     <div class="fokus-timer-bar"></div>
     `;

     const fKlocka = kort.querySelector('.analog-clock');
     if (fKlocka) createClockNumbers(fKlocka);

     const ikonBadge = kort.querySelector('.aktivitet-ikon-badge');
     const namnFalt = kort.querySelector('.aktivitet-namn');
     const tidInput = kort.querySelector('.aktivitet-tid-input');
     const tidText = kort.querySelector('.aktivitet-tid-text');

     if (sparadTid !== "") {
         kort.classList.add('har-tid');
     }

     tidInput.addEventListener('input', () => {
         hanteraKortTidsÄndring(tidInput, tidText, kort, nuvarandeDag);
     });

     tidInput.addEventListener('click', (e) => { e.stopPropagation(); });
     tidInput.addEventListener('touchstart', (e) => { e.stopPropagation(); });

     if (laddaIkon) {
         kort.setAttribute('data-custom', 'true');
         ikonBadge.setAttribute('data-manual-icon', 'true');
         ikonBadge.innerText = laddaIkon;
     } else {
         uppdateraIkon(aktText, ikonBadge);
     }
     adjustIconSize(ikonBadge);

     namnFalt.onblur = () => {
         if (ikonBadge.getAttribute('data-manual-icon') !== 'true') {
             uppdateraIkon(namnFalt.innerText, ikonBadge);
         }
         spara();
     };
     namnFalt.onclick = (e) => { if(isAdmin) e.stopPropagation(); };

     ikonBadge.onclick = (e) => { if(isAdmin) e.stopPropagation(); };
     ikonBadge.onblur = () => {
         const typedText = ikonBadge.innerText.trim();
         if (typedText === "") {
             ikonBadge.setAttribute('data-manual-icon', 'false');
             kort.removeAttribute('data-custom');
             uppdateraIkon(namnFalt.innerText, ikonBadge);
         } else {
             ikonBadge.setAttribute('data-manual-icon', 'true');
             kort.setAttribute('data-custom', 'true');
             adjustIconSize(ikonBadge);
         }
         spara();
     };

     grupper.forEach(g => laggTillGruppTag(kort, g));
     lista.appendChild(kort);
     refreshIcons();

     // Sortera vid nyskapande av kort på tavlan
     sorteraListaTid(nuvarandeDag);
 }

 function adjustIconSize(element) {
     const parentKort = element.closest('.aktivitet-kort');
     if (!parentKort) return;
     const isFokus = parentKort.classList.contains('fokus-läge');
     const text = element.innerText.trim();
     const lines = text.split('\n').filter(l => l.trim().length > 0).length;
     const charCount = text.replace(/\s/g, '').length;
     
     let size;
     if (isFokus) {
         if (lines >= 3 || charCount > 6) size = "50px";
         else if (lines >= 2 || charCount > 2) size = "80px";
         else size = "120px";
     } else {
         if (lines >= 3 || charCount > 6) size = "20px";
         else if (lines >= 2 || charCount > 3) size = "28px";
         else size = "42px";
     }
     element.style.fontSize = size;
 }

 function uppdateraIkon(text, element) {
     let hittadIkon = '✨';
     const t = text.toLowerCase();
     for (let k in ikonKarta) { if (t.includes(k)) { hittadIkon = ikonKarta[k]; break; } }
     element.innerText = hittadIkon;
     adjustIconSize(element);
     refreshIcons();
 }

 function laggTillGruppTag(kort, gruppNamn) {
     const container = kort.querySelector('.grupper-container');
     const existerande = [...container.querySelectorAll('.grupp-tag')].map(t => t.innerText.replace(/[^\wåäöÅÄÖ]/g, '').trim());
     if (existerande.includes(gruppNamn)) return;
     const tag = document.createElement('span');
     tag.className = 'grupp-tag';
     const gIkon = gruppIkonMappning[gruppNamn] || '🚀';
     tag.innerHTML = `<span>${gIkon}</span> ${gruppNamn}`;
     tag.onclick = (e) => { if(isAdmin) { e.stopPropagation(); tag.remove(); spara(); } };
     container.appendChild(tag);
     refreshIcons();
 }

 function laggTillGruppValt(g) { if(valtKort) { laggTillGruppTag(valtKort, g); spara(); } }
 function markera(kort) {
     document.querySelectorAll('.aktivitet-kort').forEach(k => { k.style.borderColor = "transparent"; });
     valtKort = kort; valtKort.style.borderColor = "var(--accent)";
 }

 function toggleVy() {
     isDayView = !isDayView;
     applyVy();
     localStorage.setItem('dayView_v210', isDayView);
     spara();
 }

 function applyVy() {
     const btn = document.getElementById('vy-toggle-btn');
     if (isDayView) {
         document.body.classList.add('dag-vy-aktiv');
         if(btn) btn.innerText = "Visa hela veckan";
     } else {
         document.body.classList.remove('dag-vy-aktiv');
         if(btn) btn.innerText = "Visa bara idag";
     }
 }

 async function stangAdmin() { await spara(); location.reload(); }

 async function spara() {
     const schema = {};
     dagar.forEach(d => {
         schema[d] = [...document.querySelectorAll(`#lista-${d} .aktivitet-kort`)].map(k => {
             return {
                 akt: k.querySelector('.aktivitet-namn').innerText,
                 grp: [...k.querySelectorAll('.grupp-tag')].map(t => t.innerText.replace(/[^\wåäöÅÄÖ]/g, '').trim()),
                 customIkon: k.getAttribute('data-custom') === 'true' ? k.querySelector('.aktivitet-ikon-badge').innerText : null,
                 tid: k.querySelector('.aktivitet-tid-input').value
             }
         });
     });

     const dataAttSpara = {
         schema: schema,
         info: document.getElementById('info-texten').innerText,
         titel: document.getElementById('tavla-titel').innerText, // Titeln är ren text, så innerText är OK här
         regler: kladRegler,
         titelIkon: document.getElementById('tavla-ikon').innerText,
         isDayView: isDayView,
         vaderStad: localStorage.getItem('v-stad') || "Stockholm",
         senastUppdaterad: firebase.firestore.FieldValue.serverTimestamp()
     };

     localStorage.setItem('tavla_backup', JSON.stringify(dataAttSpara));

     try {
         await db.collection("inställningar").doc(TAVLA_ID).set(dataAttSpara);
         console.log("Synkroniserat med molnet!");
     } catch (error) {
         console.error("Kunde inte spara till molnet:", error);
     }
 }

 async function nollstallTavla() {
     if(confirm('Vill du rensa ALLT på tavlan? Detta tar även bort informationen från molnet.')) {
         localStorage.clear();
         try {
             await db.collection("inställningar").doc(TAVLA_ID).delete();
             location.reload();
         } catch (e) {
             console.error("Kunde inte nollställa molnet:", e);
             location.reload();
         }
     }
 }

 window.onload = async () => {
     const mainClock = document.getElementById('analogClock');
     if (mainClock) mainClock.style.borderColor = "#4a5568";
     createClockNumbers(mainClock);
     updateClock();
     setInterval(updateClock, 1000);
     hamtaVaderData();
     hamtaDynamicInfo();
     setInterval(hamtaVaderData, 1800000);

     // Koppla händelselyssnare (Event Listeners)
     document.querySelector('.fokus-overlay').addEventListener('click', stängAllaModalerOchFokus);
     document.getElementById('btn-modal-avbryt').addEventListener('click', stängAllaModalerOchFokus);
     document.getElementById('btn-modal-login').addEventListener('click', verifieraLösenordModal);
     document.getElementById('btn-modal-retry').addEventListener('click', öppnaLoginModaligen);
     
     document.getElementById('tavla-ikon').addEventListener('blur', spara);
     document.getElementById('tavla-titel').addEventListener('blur', spara);
     document.getElementById('info-texten').addEventListener('blur', spara);
     
     document.querySelectorAll('.lagg-till-btn').forEach(btn => {
         btn.addEventListener('click', () => skapaKort(btn.dataset.dag, ''));
     });
     
     document.querySelectorAll('.aktivitets-lista').forEach(lista => {
         lista.addEventListener('dragover', allowDrop);
         lista.addEventListener('drop', handleDrop);
     });
     
     document.querySelector('.print-btn').addEventListener('click', () => window.print());
     document.getElementById('adminBtn').addEventListener('click', visaLoginModal);
     
     document.querySelectorAll('.btn-grupp').forEach(btn => {
         btn.addEventListener('click', () => laggTillGruppValt(btn.dataset.grupp));
     });
     
     document.getElementById('btn-nollstall').addEventListener('click', nollstallTavla);
     document.getElementById('btn-ny-regel').addEventListener('click', laggTillRegel);
     document.getElementById('vader-sok-btn').addEventListener('click', setVaderPos);
     document.getElementById('vy-toggle-btn').addEventListener('click', toggleVy);
     
     const tInput = document.getElementById('titel-input');
     tInput.addEventListener('input', () => {
         document.getElementById('tavla-titel').innerText = tInput.value;
         spara();
     });
     
     document.getElementById('btn-spara-stang').addEventListener('click', stangAdmin);

     let molnData = null;
     try {
         const doc = await db.collection("inställningar").doc(TAVLA_ID).get();
         if (doc.exists) molnData = doc.data();
     } catch (error) {
         console.log("Kunde inte hämta från molnet, använder backup.");
         molnData = JSON.parse(localStorage.getItem('tavla_backup'));
     }

     if (molnData) {
         if (molnData.schema) {
             dagar.forEach(d => {
                 if (molnData.schema[d]) molnData.schema[d].forEach(k => skapaKort(d, k.akt, k.grp, k.customIkon, k.tid));
             });
         }

         document.getElementById('info-texten').innerText = molnData.info || "";
         document.getElementById('tavla-titel').innerText = molnData.titel || "Infotavla";
         if (molnData.regler) kladRegler = molnData.regler;
         
         const tIkon = document.getElementById('tavla-ikon');
         if (tIkon) {
             tIkon.innerText = molnData.titelIkon || '🚀';
             tIkon.style.display = 'flex';
         }

         isDayView = molnData.isDayView === true;
         if (molnData.vaderStad) localStorage.setItem('v-stad', molnData.vaderStad);
     }
     refreshIcons();
     dagar.forEach(d => sorteraListaTid(d));
     const d = new Date().getDay(); const m = {1:'mandag', 2:'tisdag', 3:'onsdag', 4:'torsdag', 5:'fredag'};
     if(m[d]) document.getElementById('col-' + m[d]).classList.add('idag');
     applyVy();

    // Registrera Service Worker för PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registrerad för PWA!'))
            .catch(err => console.error('Service Worker fel:', err));
    }
 };
