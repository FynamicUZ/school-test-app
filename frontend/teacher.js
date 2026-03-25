let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const API_URL = "http://127.0.0.1:8000"; // Localhost for now

function checkAuth() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === "admin123") { // Temporary static password
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    } else {
        tg.showAlert("Parol noto'g'ri!");
    }
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tab}-tab`).style.display = 'block';
    
    // Fixed: add active class to clicked button
    if (event) event.currentTarget.classList.add('active');
    
    if (tab === 'results') loadTestResults();
}

async function createTest() {
    const title = document.getElementById('test-title').value;
    const num = document.getElementById('num-questions').value;
    const key = document.getElementById('answer-key').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;

    if (!title || !num || !key || !start || !end) {
        tg.showAlert("Iltimos, barcha maydonlarni to'ldiring");
        return;
    }

    const payload = {
        title: title,
        teacher_id: tg.initDataUnsafe?.user?.id || 1,
        num_questions: parseInt(num),
        answer_key: key,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString()
    };

    try {
        const res = await fetch(`${API_URL}/tests/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        tg.showAlert(`Test muvaffaqiyatli yaratildi! ID: ${data.id}`);
        showTab('results');
    } catch (e) {
        tg.showAlert("Test yaratishda xatolik yuz berdi.");
    }
}

async function loadTestResults() {
    const container = document.getElementById('tests-list-container');
    container.innerHTML = 'Yuklanmoqda...';
    
    try {
        // We'll add a specific endpoint for teacher's tests later
        const res = await fetch(`${API_URL}/tests/active`); 
        const tests = await res.json();
        
        container.innerHTML = '';
        if (tests.length === 0) {
            container.innerHTML = 'Hozircha faol testlar yo\'q.';
            return;
        }

        tests.forEach(test => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.innerHTML = `
                <h4>${test.title} (#${test.id})</h4>
                <button class="btn-sec" onclick="viewAnalysis(${test.id})">Tahlilni ko'rish</button>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = 'Yuklashda xatolik.';
    }
}

async function viewAnalysis(testId) {
    document.getElementById('results-list').style.display = 'none';
    document.getElementById('analysis-view').style.display = 'block';
    const resDiv = document.getElementById('rasch-results');
    resDiv.innerHTML = 'Tahlil hisoblanmoqda...';

    try {
        const res = await fetch(`${API_URL}/tests/${testId}/rasch`);
        const data = await res.json();
        
        if (!data.student_details || data.student_details.length === 0) {
            resDiv.innerHTML = '<p style="color:var(--tg-theme-hint-color);">Hozircha javoblar yo\'q.</p>';
            return;
        }
        
        // 1. Rasch Ability Section
        let html = '<div class="analysis-section"><h4>Rasch tahlili (Sifat darajasi)</h4>';
        data.student_details.forEach(s => {
            const b = s.ability;
            const mastery = b > 0.5 ? "Yuqori" : (b < -0.5 ? "Past" : "O'rtacha");
            const color = b > 0.5 ? "#2ecc71" : (b < -0.5 ? "#e74c3c" : "#f1c40f");
            html += `<div class="res-item"><span>${s.name}</span> <b style="color:${color}">${mastery} (${b.toFixed(1)})</b></div>`;
        });
        html += '</div>';

        // 2. Detailed Performance Table
        html += '<div class="analysis-section"><h4>Batafsil natijalar</h4>';
        data.student_details.forEach(s => {
            html += `
                <div style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>${s.name}</span>
                        <span>${s.score}/${s.total} (${s.percentage}%)</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px;">
                        ${s.matrix.map((val, idx) => `
                            <span style="font-size: 10px; padding: 2px 5px; border-radius: 4px; background: ${val ? '#2ecc7133' : '#e74c3c33'}; color: ${val ? '#2ecc71' : '#e74c3c'}; border: 1px solid ${val ? '#2ecc71' : '#e74c3c'}">
                                ${idx+1}${val ? '✅' : '❌'}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // 3. Item Difficulty
        html += '<div class="analysis-section"><h4>Savollar qiyinchiligi</h4>';
        data.difficulties.forEach((d, i) => {
            const diff = d > 0.5 ? "Qiyin" : (d < -0.5 ? "Oson" : "Muvozanatli");
            const color = d > 0.5 ? "#e74c3c" : (d < -0.5 ? "#2ecc71" : "#3498db");
            html += `<div class="res-item">Savol ${i+1}: <b style="color:${color}">${diff}</b></div>`;
        });
        html += '</div>';
        
        resDiv.innerHTML = html;
    } catch (e) {
        console.error(e);
        resDiv.innerHTML = 'Xatolik yuz berdi.';
    }
}

function backToResults() {
    document.getElementById('results-list').style.display = 'block';
    document.getElementById('analysis-view').style.display = 'none';
}
