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
            resDiv.innerHTML = '<p style="color:var(--tg-theme-hint-color);">No submissions yet. Analysis will be available after students take the test.</p>';
            return;
        }
        
        let html = '<h4>Student Abilities (Beta)</h4><ul>';
        data.abilities.forEach((b, i) => html += `<li>Student ${i+1}: ${b.toFixed(2)}</li>`);
        html += '</ul><h4>Item Difficulties (Delta)</h4><ul>';
        data.difficulties.forEach((d, i) => html += `<li>Question ${i+1}: ${d.toFixed(2)}</li>`);
        html += '</ul>';
        
        resDiv.innerHTML = html;
    } catch (e) {
        resDiv.innerHTML = 'Error fetching analysis.';
    }
}

function backToResults() {
    document.getElementById('results-list').style.display = 'block';
    document.getElementById('analysis-view').style.display = 'none';
}
