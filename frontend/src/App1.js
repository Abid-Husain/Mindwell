import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, TrendingUp, BookOpen, User, Settings, Moon, Sun, Phone, Calendar, Shield, Send } from 'lucide-react';

const MentalHealthApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userMood, setUserMood] = useState(5);
  const [userName, setUserName] = useState('Alex');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😊', '😄', '🤗', '🌟', '💫', '✨'];
  const moodLabels = ['Very Low', 'Low', 'Down', 'Okay', 'Good', 'Happy', 'Great', 'Amazing', 'Fantastic', 'Euphoric'];

  // API call to backend
  const callAI = async (message, mood) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          mood: mood,
          user_name: userName
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // return data.reply;
      return data.response;
    } catch (error) {
      console.error('Error calling AI:', error);
      return "I'm having trouble connecting to my AI brain right now. Please check if the backend server is running and try again. If you're in crisis, please reach out to a mental health professional immediately. 💙";
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMsg = { type: 'user', content: currentMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    
    const currentMsg = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);
    
    try {
      const aiResponse = await callAI(currentMsg, userMood);
      const aiMsg = { type: 'ai', content: aiResponse, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = { type: 'ai', content: 'Sorry, I encountered an error. Please make sure the backend server is running.', timestamp: new Date() };
      setChatMessages(prev => [...prev, errorMsg]);
    }
    
    setIsLoading(false);
  };

  const dailyTips = [
    "Practice the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8. Great for anxiety relief! 🫁",
    "Write down 3 things you're grateful for today. Gratitude rewires your brain for positivity. ✍️",
    "Take a 10-minute walk outside. Nature and movement are natural mood boosters. 🌳",
    "Reach out to one person you care about. Connection is vital for mental wellness. 📱",
    "Practice self-compassion. Talk to yourself like you would a good friend. 💝"
  ];

  const quickActions = [
    { icon: "🧘", title: "Quick Meditation", desc: "5-minute guided breathing" },
    { icon: "💪", title: "Confidence Boost", desc: "Affirm your strengths" },
    { icon: "🎯", title: "Goal Setting", desc: "Set achievable daily goals" },
    { icon: "📝", title: "Mood Journal", desc: "Track your emotions" },
    { icon: "🎵", title: "Mood Music", desc: "Curated playlists for wellness" },
    { icon: "🤝", title: "Connect", desc: "Find peer support groups" }
  ];

  const professionalResources = [
    { title: "Crisis Text Line", contact: "Text HOME to 741741", type: "crisis" },
    { title: "Teen Mental Health Helpline", contact: "1-800-XXX-XXXX", type: "support" },
    { title: "Online Therapy Platforms", contact: "Professional counseling", type: "therapy" },
    { title: "Local Mental Health Centers", contact: "Find nearby resources", type: "local" }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white`}>
        <h2 className="text-2xl font-bold mb-2">Hello, {userName}! 👋</h2>
        <p className="opacity-90">How are you feeling today? Your mental wellness journey matters.</p>
      </div>

      {/* Mood Tracker */}
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Heart className="mr-2 text-red-500" />
          Mood Check-In
        </h3>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">{moodEmojis[userMood]}</div>
            <p className="text-lg font-medium">{moodLabels[userMood]}</p>
          </div>
          <input
            type="range"
            min="0"
            max="9"
            value={userMood}
            onChange={(e) => setUserMood(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Daily Tip */}
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} border border-blue-200`}>
        <h3 className="text-xl font-semibold mb-3 text-blue-800">💡 Daily Wellness Tip</h3>
        <p className="text-gray-700">{dailyTips[new Date().getDate() % dailyTips.length]}</p>
      </div>

      {/* Quick Actions */}
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} cursor-pointer transition-colors`}>
              <div className="text-2xl mb-2">{action.icon}</div>
              <h4 className="font-medium text-sm">{action.title}</h4>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full flex flex-col">
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-t-xl`}>
        <h2 className="text-xl font-semibold flex items-center">
          <MessageCircle className="mr-2 text-blue-500" />
          AI Wellness Companion
        </h2>
        <p className="text-sm text-gray-500">Your supportive friend powered by Groq AI</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-[400px]">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-gray-500">Hi there! I'm here to support you. How are you feeling today?</p>
            <p className="text-xs text-gray-400 mt-2">Powered by Groq AI for real-time responses</p>
          </div>
        )}
        
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow'}`}>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-b-xl border-t`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Share what's on your mind..."
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-full border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Shield className="mr-2 text-green-500" />
          Professional Resources
        </h2>
        <p className="text-gray-600 mb-6">When you need additional support, these professional resources are here to help.</p>
        
        <div className="grid gap-4">
          {professionalResources.map((resource, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="font-semibold text-lg">{resource.title}</h3>
              <p className="text-gray-600">{resource.contact}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                resource.type === 'crisis' ? 'bg-red-100 text-red-800' :
                resource.type === 'therapy' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-yellow-50'} border border-yellow-200`}>
        <h3 className="text-xl font-semibold mb-3 text-yellow-800">⚠️ Crisis Support</h3>
        <p className="text-gray-700 mb-4">If you're having thoughts of self-harm or suicide, please reach out immediately:</p>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Phone className="text-red-500" size={16} />
            <span className="font-semibold">988 - Suicide & Crisis Lifeline</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="text-blue-500" size={16} />
            <span className="font-semibold">Text "HELLO" to 741741</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">MindWell</h1>
              <p className="text-xs text-gray-500">Your Mental Health Companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className={`lg:w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4`}>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'chat', label: 'AI Companion', icon: MessageCircle },
              { id: 'resources', label: 'Professional Help', icon: BookOpen },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-500 text-white'
                    : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg min-h-[600px]`}>
            <div className="p-6">
              {currentView === 'dashboard' && renderDashboard()}
              {currentView === 'chat' && renderChat()}
              {currentView === 'resources' && renderResources()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t mt-8`}>
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>MindWell - Supporting youth mental health with AI-powered care. Remember: This app complements but doesn't replace professional mental health care.</p>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthApp;