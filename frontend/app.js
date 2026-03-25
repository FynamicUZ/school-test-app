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
            container.innerHTML = '<p style="text-align:center; color:var(--tg-theme-hint-color);">Hozircha faol testlar yo\'q.</p>';
            return;
        }

        tests.forEach(test => {
            let card = document.createElement('div');
            card.className = 'test-card';
            card.innerHTML = `
                <h3>${test.title || `Test #${test.id}`}</h3>
                <p>Savollar soni: ${test.num_questions}</p>
                <button class="btn" onclick="takeTest(${test.id}, ${test.num_questions})">Testni boshlash</button>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        tg.showAlert("Testlarni yuklab bo'lmadi.");
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

// ... (renderQuestions and selectOption remain mostly logic-only, but labels can be localized if needed)

async function submitTest() {
    if (Object.keys(answers).length < numQuestions) {
        tg.showAlert("Iltimos, barcha savollarga javob bering.");
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
        await fetch(`${API_URL}/submissions/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        tg.showAlert("Javoblaringiz qabul qilindi!");
        tg.close();
    } catch (e) {
        tg.showAlert("Javoblarni yuborishda xatolik.");
    }
}

loadTests();
