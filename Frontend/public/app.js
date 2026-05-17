// Configuration
const BACKEND_API_URL = "http://localhost:5000/api";

// State
let sessionToken = localStorage.getItem('citizen_jwt');
let citizenName = localStorage.getItem('citizen_name') || 'Citizen';
let chatHistory = JSON.parse(localStorage.getItem('citizen_chat_history') || '[]');
let isAITyping = false;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const sendOtpBtn = document.getElementById('send-otp-btn');
const otpSection = document.getElementById('otp-section');
const otpInput = document.getElementById('otp');
const verifyBtn = document.getElementById('verify-btn');
const authStatus = document.getElementById('auth-status');

const displayCitizenName = document.getElementById('display-citizen-name');
const logoutBtn = document.getElementById('logout-btn');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestionsContainer = document.getElementById('suggestions');

// Initialization
function init() {
    if (sessionToken) {
        showChat();
        restoreChatHistory();
    } else {
        showAuth();
    }
    setupEventListeners();
}

// UI Switching
function showAuth() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
}

function showChat() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    displayCitizenName.textContent = citizenName;
    if (chatHistory.length > 0 && suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
    scrollToBottom();
}

function setAuthStatus(msg, type = 'info') {
    authStatus.textContent = msg;
    authStatus.className = `status-${type}`;
}

// Authentication
async function requestOTP() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (!username || !email) {
        setAuthStatus('Please enter both name and email', 'error');
        return;
    }

    sendOtpBtn.disabled = true;
    setAuthStatus('Requesting OTP...', 'info');

    try {
        const response = await fetch(`${BACKEND_API_URL}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            setAuthStatus('OTP sent to your email', 'success');
            otpSection.classList.remove('hidden');
            citizenName = username;
            
            // Cooldown simulation
            let cooldown = 30;
            const timer = setInterval(() => {
                cooldown--;
                sendOtpBtn.textContent = `Resend OTP (${cooldown}s)`;
                if (cooldown <= 0) {
                    clearInterval(timer);
                    sendOtpBtn.disabled = false;
                    sendOtpBtn.textContent = 'Send OTP';
                }
            }, 1000);
        } else {
            setAuthStatus(data.error || 'Failed to send OTP', 'error');
            sendOtpBtn.disabled = false;
        }
    } catch (error) {
        setAuthStatus('Network error occurred', 'error');
        sendOtpBtn.disabled = false;
    }
}

async function verifyOTP() {
    const email = emailInput.value.trim();
    const token = otpInput.value.trim();

    if (!token) {
        setAuthStatus('Please enter the OTP', 'error');
        return;
    }

    verifyBtn.disabled = true;
    setAuthStatus('Verifying...', 'info');

    try {
        const response = await fetch(`${BACKEND_API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token })
        });

        const data = await response.json();

        if (response.ok) {
            sessionToken = data.token;
            localStorage.setItem('citizen_jwt', sessionToken);
            localStorage.setItem('citizen_name', citizenName);
            showChat();
        } else {
            setAuthStatus(data.error || 'Invalid OTP', 'error');
        }
    } catch (error) {
        setAuthStatus('Network error occurred', 'error');
    } finally {
        verifyBtn.disabled = false;
    }
}

function logOut() {
    sessionToken = null;
    chatHistory = [];
    localStorage.removeItem('citizen_jwt');
    localStorage.removeItem('citizen_name');
    localStorage.removeItem('citizen_chat_history');
    chatBox.innerHTML = '';
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'flex';
        chatBox.appendChild(suggestionsContainer);
    }
    showAuth();
}

// Chat Functionality
function appendMessage(sender, text, save = true) {
    if (suggestionsContainer && sender === 'user') {
        suggestionsContainer.style.display = 'none';
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    if (sender === 'ai') {
        const rawHtml = marked.parse(text);
        const safeHtml = DOMPurify.sanitize(rawHtml);
        msgDiv.innerHTML = safeHtml;
    } else {
        msgDiv.textContent = text;
    }

    chatBox.appendChild(msgDiv);
    scrollToBottom();

    if (save) {
        chatHistory.push({ sender, text });
        localStorage.setItem('citizen_chat_history', JSON.stringify(chatHistory));
    }
}

function restoreChatHistory() {
    chatBox.innerHTML = ''; // Clear existing contents including suggestions
    if (chatHistory.length === 0 && suggestionsContainer) {
        chatBox.appendChild(suggestionsContainer);
    }
    chatHistory.forEach(msg => appendMessage(msg.sender, msg.text, false));
}

function scrollToBottom() {
    // Only auto-scroll if near bottom
    const threshold = 150;
    const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
    if (isNearBottom || chatBox.children.length <= 2) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isAITyping) return;

    userInput.value = '';
    appendMessage('user', text);

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.textContent = 'Assistant is preparing guidance...';
    chatBox.appendChild(indicator);
    scrollToBottom();
    isAITyping = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ message: text })
        });

        chatBox.removeChild(indicator);
        isAITyping = false;
        sendBtn.disabled = false;

        if (response.ok) {
            const data = await response.json();
            appendMessage('ai', data.reply);
        } else if (response.status === 401 || response.status === 403) {
            alert('Session expired. Please log in again.');
            logOut();
        } else {
            appendMessage('ai', 'Sorry, an error occurred while processing your request.');
        }
    } catch (error) {
        chatBox.removeChild(indicator);
        isAITyping = false;
        sendBtn.disabled = false;
        appendMessage('ai', 'Network error. Please check your connection and try again.');
    }
    userInput.focus();
}

// Event Listeners
function setupEventListeners() {
    sendOtpBtn.addEventListener('click', requestOTP);
    verifyBtn.addEventListener('click', verifyOTP);
    logoutBtn.addEventListener('click', logOut);
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Suggestion chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.dataset.prompt;
            sendMessage();
        });
    });
}

// Run
init();
