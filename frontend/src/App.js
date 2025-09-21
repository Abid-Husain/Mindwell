import React, { useState } from 'react';
import { 
  Heart, MessageCircle, TrendingUp, BookOpen, Shield, Send, Calendar 
} from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userMood, setUserMood] = useState(5);
  const [userName, setUserName] = useState('Alex');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Journal
  const [journalText, setJournalText] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);

  // Anxiety Test
  const [answers, setAnswers] = useState(Array(7).fill(0));
  const [result, setResult] = useState(null);

  // Habits
  const [habit, setHabit] = useState("");
  const [habits, setHabits] = useState([]);

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😊', '😄', '🤗', '🌟', '💫', '✨'];
  const moodLabels = ['Very Low', 'Low', 'Down', 'Okay', 'Good', 'Happy', 'Great', 'Amazing', 'Fantastic', 'Euphoric'];

  // ---------------- API CALLS ----------------
  const callAI = async (message, mood) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mood, user_name: userName })
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      return "⚠️ AI not responding. Check backend.";
    }
  };

  const saveMood = async () => {
    try {
      await fetch("http://localhost:8000/mood/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          mood: moodLabels[userMood],
          note: ""
        })
      });
      alert("Mood saved ✅");
    } catch (err) { console.error(err); }
  };

  const saveJournal = async () => {
    await fetch("http://localhost:8000/journal/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, text: journalText })
    });
    setJournalEntries([...journalEntries, { text: journalText }]);
    setJournalText("");
  };

  const submitTest = async () => {
    const res = await fetch("http://localhost:8000/anxiety_test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, answers })
    });
    const data = await res.json();
    setResult(data);
  };

  const addHabit = async () => {
    const res = await fetch("http://localhost:8000/habit/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, habit, completed: false })
    });
    const data = await res.json();
    setHabits([...habits, data.data]);
    setHabit("");
  };

  const completeHabit = async (habitName) => {
    await fetch(`http://localhost:8000/habit/complete?user_id=1&habit=${habitName}`, {
      method: "POST"
    });
    setHabits(habits.map(h => h.habit === habitName ? { ...h, completed: true } : h));
  };

  // ---------------- RENDER VIEWS ----------------
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <h2 className="text-2xl font-bold mb-2">Hello, {userName}! 👋</h2>
        <p className="opacity-90">How are you feeling today?</p>
      </div>

      <div className="p-6 rounded-xl bg-white shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Heart className="mr-2 text-red-500" /> Mood Check-In
        </h3>
        <div className="text-center">
          <div className="text-6xl mb-2">{moodEmojis[userMood]}</div>
          <p>{moodLabels[userMood]}</p>
          <input
            type="range"
            min="0" max="9"
            value={userMood}
            onChange={(e) => setUserMood(parseInt(e.target.value))}
            className="w-full my-4"
          />
          <button onClick={saveMood} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Save Mood
          </button>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white shadow rounded-t-xl">
        <h2 className="text-xl font-semibold flex items-center">
          <MessageCircle className="mr-2 text-blue-500" /> AI Companion
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[400px]">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white rounded-b-xl border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            className="flex-1 px-4 py-2 border rounded-full"
            placeholder="Share what's on your mind..."
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-full"
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  );

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    const userMsg = { type: 'user', content: currentMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setIsLoading(true);
    const aiResponse = await callAI(userMsg.content, userMood);
    const aiMsg = { type: 'ai', content: aiResponse };
    setChatMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const renderJournal = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">📝 Journal</h2>
      <textarea
        value={journalText}
        onChange={(e) => setJournalText(e.target.value)}
        className="w-full border rounded-lg p-2 mb-2"
        placeholder="Write your thoughts..."
      />
      <button onClick={saveJournal} className="px-4 py-2 bg-green-500 text-white rounded-lg">Save Entry</button>
      <div className="mt-4">
        {journalEntries.map((entry, idx) => (
          <p key={idx} className="border-b py-2">{entry.text}</p>
        ))}
      </div>
    </div>
  );

  const renderAnxietyTest = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">🧠 Anxiety Test</h2>
      {answers.map((val, idx) => (
        <div key={idx} className="mb-2">
          <p>Question {idx+1}</p>
          <select 
            value={val} 
            onChange={(e) => {
              const newAns = [...answers];
              newAns[idx] = parseInt(e.target.value);
              setAnswers(newAns);
            }}
          >
            <option value={0}>Not at all</option>
            <option value={1}>Several days</option>
            <option value={2}>More than half the days</option>
            <option value={3}>Nearly every day</option>
          </select>
        </div>
      ))}
      <button onClick={submitTest} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Submit</button>
      {result && <p className="mt-4">Score: {result.score} → {result.level}</p>}
    </div>
  );

  const renderHabits = () => (
    <div>
      <h2 className="text-xl font-bold mb-4">🎯 Habit Tracker</h2>
      <input 
        value={habit}
        onChange={(e) => setHabit(e.target.value)}
        placeholder="New habit..."
        className="border rounded-lg p-2 mr-2"
      />
      <button onClick={addHabit} className="px-4 py-2 bg-green-500 text-white rounded-lg">Add</button>
      <ul className="mt-4">
        {habits.map((h, idx) => (
          <li key={idx} className="flex justify-between items-center mb-2">
            <span className={h.completed ? "line-through" : ""}>{h.habit}</span>
            {!h.completed && (
              <button onClick={() => completeHabit(h.habit)} className="px-2 py-1 bg-blue-500 text-white rounded-lg">
                Done
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  // ---------------- MAIN ----------------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">MindWell</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 bg-white rounded-xl shadow-lg p-4">
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'chat', label: 'AI Companion', icon: MessageCircle },
              { id: 'journal', label: 'Journal', icon: BookOpen },
              { id: 'anxiety', label: 'Anxiety Test', icon: Shield },
              { id: 'habits', label: 'Habits', icon: Calendar },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  currentView === item.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'chat' && renderChat()}
          {currentView === 'journal' && renderJournal()}
          {currentView === 'anxiety' && renderAnxietyTest()}
          {currentView === 'habits' && renderHabits()}
        </div>
      </div>
    </div>
  );
};

export default App;
