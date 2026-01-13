// --- Configuration ---
let currentModel = "meta-llama/llama-3.3-70b-instruct:free";

// THE COACH PERSONA
const SYSTEM_PROMPT = `
Act as an expert communication coach facilitating a workshop based on the 'Think Fast, Talk Smart' techniques for spontaneous speaking. Your goal is to lead me through four specific interactive activities one by one.

CRITICAL INSTRUCTION: You DO NOT have physical objects. You MUST use the tag {{IMAGE: search_term}} to show me an object.
NEVER just say "Look at this" without the tag.
NEVER describe the object in text before I have guessed.

The User will select WHICH activity they want to start with. Wait for the user selection trigger.

The Activities:
1. Shout the Wrong Name: 
   - Say "Start!".
   - Immediately output an image tag, e.g., {{IMAGE: red stapler}}.
   - Ask "What is this?".
   - Wait for my response.
   - If I name the object correctly (e.g. "stapler"), correct me: "No, give it a WRONG name!" and show the same image again {{IMAGE: red stapler}}.
   - If I give a wrong name, say "Great!" and show a NEW image {{IMAGE: banana}}.
   - Do this for 3 objects.

2. Give an Imaginary Gift: 
   - Show an image of a gift box: {{IMAGE: colorful gift box}}.
   - Say "Here is a gift for you."
   - I will 'open' it and name it.
   - You respond with "I'm glad you liked it, I got it for you because [reason]...".

3. Spelling Everything: Brief conversation, S-P-E-L-L-I-N-G everything.

4. Selling with Structure: 
   - Show an item: {{IMAGE: rubber duck}}.
   - Ask me to sell it using 'Problem-Solution-Benefit'.
`;

// --- State ---
let apiKey = "";
let messageHistory = [];
let isSpeakerEnabled = false;
let recognition;
let isRecording = false;

// --- DOM Elements ---
const dom = {
    chat: document.getElementById('chat-window'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('btn-send'),
    modal: document.getElementById('api-modal'),
    keyInput: document.getElementById('api-key-input'),
    startBtn: document.getElementById('btn-start-session'),
    startBtn: document.getElementById('btn-start-session'),
    modelSelect: document.getElementById('model-select'),
    activityMenu: document.getElementById('activity-menu'),
    activityBtns: document.querySelectorAll('.activity-btn'),
    // Voice UI
    micBtn: document.getElementById('btn-mic'),
    speakerBtn: document.getElementById('btn-speaker')
};

// --- 1. Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    // Check if CONFIG exists and has a key
    if (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) {
        apiKey = CONFIG.API_KEY;
        dom.modal.classList.add('hidden');
        dom.activityMenu.classList.remove('hidden');
    }
});

dom.startBtn.addEventListener('click', () => {
    const key = dom.keyInput.value.trim();
    if (!key) return alert("Please enter a key.");

    apiKey = key;
    dom.modal.classList.add('hidden');

    // Show Activity Menu
    dom.activityMenu.classList.remove('hidden');
});

// Activity Selection
dom.activityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const activity = btn.getAttribute('data-act');
        dom.activityMenu.classList.add('hidden');

        // Enable Chat
        // Enable Chat
        dom.input.disabled = false;
        dom.sendBtn.disabled = false;
        dom.micBtn.disabled = false;

        initializeCoach(activity);
    });
});

// Switch model listener
dom.modelSelect.addEventListener('change', (e) => {
    currentModel = e.target.value;
    appendMessage('system', `Switched model to: ${currentModel}`);
});

async function initializeCoach(firstActivity) {
    // Add System Prompt to History (Hidden from UI)
    messageHistory.push({ role: "system", content: SYSTEM_PROMPT });

    // Inject the user Selection as a System instruction
    messageHistory.push({ role: "system", content: `User selected activity: "${firstActivity}". Start this specific activity IMMEDIATELY with the first step/image.` });

    // Trigger the first AI response
    await callAI();
}

// --- 2. Chat Logic ---
function formatText(text) {
    // 1. Handle Images: {{IMAGE: query}}
    let formatted = text.replace(/{{IMAGE:\s*(.*?)}}/gi, (match, query) => {
        const q = encodeURIComponent(query.trim());
        // Using Pollinations for free, keyless, reliable generation/placeholder
        return `<img src="https://image.pollinations.ai/prompt/${q}?width=400&height=300&nologo=true" alt="${query}" class="chat-image">`;
    });

    // 2. Handle simple markdown bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Handle newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = formatText(text); // Render HTML
    dom.chat.appendChild(div);
    dom.chat.scrollTop = dom.chat.scrollHeight;
}

async function callAI() {
    // UI: Show typing indicator
    const loadingId = "loading-" + Date.now();
    const loader = document.createElement('div');
    loader.className = "message ai";
    loader.id = loadingId;
    loader.innerText = "Coach is typing...";
    dom.chat.appendChild(loader);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // Use a generic referer to avoid local blocking
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Communication Workshop"
            },
            body: JSON.stringify({
                model: currentModel,
                messages: messageHistory
            })
        });

        // ERROR HANDLING: If the server says NO, find out WHY
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Details:", errorData);
            const errorMessage = errorData.error?.message || JSON.stringify(errorData) || `Status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

        // Remove loader
        document.getElementById(loadingId).remove();

        // Display AI Message
        appendMessage('ai', aiText);

        // Update History
        messageHistory.push({ role: "assistant", content: aiText });

        // Speak logic
        if (isSpeakerEnabled) {
            speakText(aiText);
        }

    } catch (error) {
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        appendMessage('error', `API Error: ${error.message}. <br>Try switching the model in the top right.`);
    }
}

// --- 3. User Interaction ---
async function handleUserSend() {
    const text = dom.input.value.trim();
    if (!text) return;

    // UI: Display user message
    appendMessage('user', text);
    dom.input.value = '';

    // Update History
    messageHistory.push({ role: "user", content: text });

    // Get AI Reply
    await callAI();
}

dom.sendBtn.addEventListener('click', handleUserSend);
dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserSend();
});

// --- 4. Voice Logic ---

// --- A. Text-to-Speech (Speaker) ---
dom.speakerBtn.addEventListener('click', () => {
    isSpeakerEnabled = !isSpeakerEnabled;
    dom.speakerBtn.classList.toggle('muted', !isSpeakerEnabled); // Visual feedback
    dom.speakerBtn.innerText = isSpeakerEnabled ? "🔊" : "🔇";

    if (!isSpeakerEnabled) {
        window.speechSynthesis.cancel(); // Stop speaking immediately if muted
    }
});

function speakText(text) {
    if (!window.speechSynthesis) return;

    // Clean text (remove HTML tags and image tags for speaking)
    const cleanText = text.replace(/{{IMAGE:.*?}}/g, "").replace(/<[^>]*>/g, "");

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Optional: Select a better voice if available (e.g., Google US English)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
}

// --- B. Speech-to-Text (Microphone) ---
// Initialize Recognition if supported
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence/pause
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isRecording = true;
        dom.micBtn.classList.add('recording');
    };

    recognition.onend = () => {
        isRecording = false;
        dom.micBtn.classList.remove('recording');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        dom.input.value = transcript;
        // Optional: Auto-send? Let's just fill input for now so user can confirm.
        // handleUserSend(); 
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        isRecording = false;
        dom.micBtn.classList.remove('recording');
    };
} else {
    dom.micBtn.style.display = 'none'; // Hide if not supported
    console.warn("Web Speech API not supported in this browser.");
}

dom.micBtn.addEventListener('click', () => {
    if (!recognition) return alert("Voice input not supported in this browser.");

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
});
