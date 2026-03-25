let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const API_URL = "http://127.0.0.1:8000"; // Localhost for now

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tab}-tab`).style.display = 'block';
    event.currentTarget.classList.add('active');
    
    if (tab === 'results') loadTestResults();
}

async function createTest() {
    const title = document.getElementById('test-title').value;
    const num = document.getElementById('num-questions').value;
    const key = document.getElementById('answer-key').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;

    if (!title || !num || !key || !start || !end) {
        tg.showAlert("Please fill all fields");
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
        tg.showAlert(`Test #${data.id} Created Successfully!`);
        showTab('results');
    } catch (e) {
        tg.showAlert("Error creating test.");
    }
}

async function loadTestResults() {
    const container = document.getElementById('tests-list-container');
    container.innerHTML = 'Loading tests...';
    
    try {
        // We'll add a specific endpoint for teacher's tests later
        const res = await fetch(`${API_URL}/tests/active`); 
        const tests = await res.json();
        
        container.innerHTML = '';
        tests.forEach(test => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.innerHTML = `
                <h4>Test #${test.id}</h4>
                <button class="btn-sec" onclick="viewAnalysis(${test.id})">Rasch Analysis</button>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = 'Error loading tests.';
    }
}

async function viewAnalysis(testId) {
    document.getElementById('results-list').style.display = 'none';
    document.getElementById('analysis-view').style.display = 'block';
    const resDiv = document.getElementById('rasch-results');
    resDiv.innerHTML = 'Calculating Rasch Analysis...';

    try {
        const res = await fetch(`${API_URL}/tests/${testId}/rasch`);
        const data = await res.json();
        
        if (!data.abilities || data.abilities.length === 0) {
            resDiv.innerHTML = '<p style="color:var(--tg-theme-hint-color);">No submissions yet.</p>';
            return;
        }
        
        let html = '<div class="analysis-section"><h4>Student Performance</h4>';
        data.abilities.forEach((b, i) => {
            const mastery = b > 0.5 ? "High" : (b < -0.5 ? "Low" : "Average");
            const color = b > 0.5 ? "#2ecc71" : (b < -0.5 ? "#e74c3c" : "#f1c40f");
            html += `<div class="res-item">Student ${i+1}: <b style="color:${color}">${mastery} (${b.toFixed(1)})</b></div>`;
        });
        
        html += '</div><div class="analysis-section"><h4>Item Difficulty</h4>';
        data.difficulties.forEach((d, i) => {
            const diff = d > 0.5 ? "Hard" : (d < -0.5 ? "Easy" : "Balanced");
            const color = d > 0.5 ? "#e74c3c" : (d < -0.5 ? "#2ecc71" : "#3498db");
            html += `<div class="res-item">Q${i+1}: <b style="color:${color}">${diff}</b></div>`;
        });
        html += '</div>';
        
        resDiv.innerHTML = html;
    } catch (e) {
        resDiv.innerHTML = 'Error fetching analysis.';
    }
}

function backToResults() {
    document.getElementById('results-list').style.display = 'block';
    document.getElementById('analysis-view').style.display = 'none';
}
