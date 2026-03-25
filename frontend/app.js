let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// In production, this points to Koyeb URL
const API_URL = "http://127.0.0.1:8000";
let currentTestId = null;
let answers = {};
let numQuestions = 0;

async function loadTests() {
    try {
        const res = await fetch(`${API_URL}/tests/active`);
        const tests = await res.json();
        
        const container = document.getElementById('tests-container');
        container.innerHTML = '';
        
        if (tests.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--tg-theme-hint-color);">No active tests found.</p>';
            return;
        }

        tests.forEach(test => {
            let card = document.createElement('div');
            card.className = 'test-card';
            card.innerHTML = `
                <h3>${test.title || `Test #${test.id}`}</h3>
                <p>Questions: ${test.num_questions}</p>
                <button class="btn" onclick="takeTest(${test.id}, ${test.num_questions})">Take Test</button>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        tg.showAlert("Failed to load active tests.");
    }
}

function takeTest(id, questions) {
    currentTestId = id;
    numQuestions = questions;
    answers = {};
    
    document.getElementById('tests-container').style.display = 'none';
    document.getElementById('title').innerText = `Test #${id}`;
    document.getElementById('test-view').style.display = 'block';
    
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    const options = ['A', 'B', 'C', 'D'];
    
    for(let i=1; i<=numQuestions; i++) {
        let row = document.createElement('div');
        row.className = 'question-row';
        
        let numId = document.createElement('div');
        numId.className = 'question-number';
        numId.innerText = `${i}.`;
        
        let opts = document.createElement('div');
        opts.className = 'options';
        
        options.forEach(opt => {
            let btn = document.createElement('div');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => selectOption(i, opt, btn, opts);
            opts.appendChild(btn);
        });
        
        row.appendChild(numId);
        row.appendChild(opts);
        container.appendChild(row);
    }
}

function selectOption(qIndex, option, btnElement, optsContainer) {
    answers[qIndex] = option;
    
    Array.from(optsContainer.children).forEach(c => c.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    if (Object.keys(answers).length === numQuestions) {
        document.getElementById('submit-btn').style.display = 'block';
    }
}

async function submitTest() {
    if (Object.keys(answers).length < numQuestions) {
        tg.showAlert("Please answer all questions.");
        return;
    }
    
    let answersStr = [];
    for(let i=1; i<=numQuestions; i++) {
        answersStr.push(answers[i]);
    }
    answersStr = answersStr.join(',');
    
    const studentId = tg.initDataUnsafe?.user?.id || 12345678;
    
    const payload = {
        test_id: currentTestId,
        student_id: studentId,
        answers: answersStr
    };
    
    try {
        // await fetch(`${API_URL}/submissions/`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(payload)
        // });
        tg.showAlert("Answers submitted successfully!");
        tg.close();
    } catch (e) {
        tg.showAlert("Error submitting answers.");
    }
}

loadTests();
