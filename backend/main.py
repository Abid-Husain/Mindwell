from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Client
import os
from dotenv import load_dotenv
import logging
from typing import Optional
from datetime import datetime


# Load environment variables
load_dotenv("mw.env")

app = FastAPI(title="MindWell API", version="1.0.0")

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
try:
    client = Client(api_key=os.getenv("GROQ_API_KEY"))
    logging.info("✅ Groq client initialized successfully")
except Exception as e:
    logging.error(f"❌ Error initializing Groq client: {e}")
    client = None

# Using a dictionary to store conversation history by user_id
conversations = {}

# Data models
class ChatRequest(BaseModel):
    message: str
    mood: int
    user_name: str #= "User"
    user_id: str = "User" # Added user_id to the model

class ChatResponse(BaseModel):
    response: str
    mood_analysis: str

def create_mental_health_prompt(mood: int, user_name: str, history: Optional[list] = None):
    """Create a contextual prompt based on user's mood, name, and conversation history."""
    
    mood_context = ""
    if mood <= 2:
        mood_context = "very distressed and may need immediate support"
    elif mood <= 4:
        mood_context = "struggling and could benefit from gentle encouragement"
    elif mood <= 6:
        mood_context = "neutral but could use some positive reinforcement"
    elif mood <= 8:
        mood_context = "doing well and receptive to growth conversations"
    else:
        mood_context = "very positive and ready for empowerment"

    history_text = ""
    if history:
        formatted = "\n".join([f"User: {h['user']}\nAI: {h['ai']}" for h in history])
        history_text = f"\nHere is the recent conversation:\n{formatted}"

    return f"""
You are MindWell AI, a compassionate mental health companion for youth aged 13-25.
Your role is to provide safe, empathetic, and supportive guidance. 
Speak like a trained psychologist — validate feelings, ask gentle questions, and avoid judgment.

User Context:
- Name: {user_name}
- Current mood: {mood}/10 ({mood_context})

{history_text}

Now, respond to:
User: {user_name}
"""

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint that processes user messages and returns AI responses"""
    
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="AI service is not available. Please check your Groq API key."
        )

    # Use the user_id from the request body to get conversation history
    user_id = request.user_id
    if user_id not in conversations:
        conversations[user_id] = []
    
    # Get the last 3 exchanges to keep the prompt concise
    history = conversations[user_id][-3:]

    try:
        # Create system prompt with history
        system_prompt = create_mental_health_prompt(request.mood, request.user_name, history)
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.1-8b-instant",
            max_tokens=200,
            temperature=0.7,
            top_p=0.9,
        )
        
        ai_response = chat_completion.choices[0].message.content
        
        # Save the current exchange in conversation history
        conversations[user_id].append({"user": request.message, "ai": ai_response})

        # Analyze mood for response categorization
        if request.mood < 4:
            mood_analysis = "supportive"
        elif request.mood < 7:
            mood_analysis = "encouraging"
        else:
            mood_analysis = "empowering"
        
        logging.info(f"✅ AI Response generated for {request.user_name} (mood: {request.mood})")
        
        # Return the response with a Pydantic model
        return ChatResponse(
            response=ai_response,
            mood_analysis=mood_analysis
        )
        
    except Exception as e:
        logging.error(f"❌ Error in chat endpoint: {str(e)}")
        
        raise HTTPException(
            status_code=500, 
            detail=f"AI service error: {str(e)}"
        )
        
# The rest of your code (root, health_check, mood-tips, __main__) is correct
# and can remain as is.


# ---------------- Mood Tracker ----------------
class MoodEntry(BaseModel):
    user_id: int
    mood: str
    note: str = ""

mood_db = []

@app.post("/mood/add")
def add_mood(entry: MoodEntry):
    record = {
        "user_id": entry.user_id,
        "mood": entry.mood,
        "note": entry.note,
        "timestamp": datetime.now()
    }
    mood_db.append(record)
    return {"msg": "Mood saved!", "data": record}

@app.get("/mood/history/{user_id}")
def get_mood_history(user_id: int):
    return [m for m in mood_db if m["user_id"] == user_id]

# ---------------- Journal ----------------
class JournalEntry(BaseModel):
    user_id: int
    text: str

journal_db = []

@app.post("/journal/add")
def add_journal(entry: JournalEntry):
    record = {"user_id": entry.user_id, "text": entry.text, "timestamp": datetime.now()}
    journal_db.append(record)
    return {"msg": "Journal saved", "data": record}

@app.get("/journal/{user_id}")
def get_journal(user_id: int):
    return [j for j in journal_db if j["user_id"] == user_id]

# ---------------- Anxiety Test ----------------
class TestResponse(BaseModel):
    user_id: int
    answers: list[int]

@app.post("/anxiety_test")
def anxiety_test(resp: TestResponse):
    score = sum(resp.answers)
    if score <= 4:
        level = "Minimal anxiety"
    elif score <= 9:
        level = "Mild anxiety"
    elif score <= 14:
        level = "Moderate anxiety"
    else:
        level = "Severe anxiety"
    return {"score": score, "level": level}

# ---------------- Habit Tracker ----------------
class Habit(BaseModel):
    user_id: int
    habit: str
    completed: bool = False

habit_db = []

@app.post("/habit/add")
def add_habit(h: Habit):
    habit_db.append(h.dict())
    return {"msg": "Habit added", "data": h}

@app.post("/habit/complete")
def complete_habit(user_id: int, habit: str):
    for h in habit_db:
        if h["user_id"] == user_id and h["habit"] == habit:
            h["completed"] = True
    return {"msg": "Habit updated!"}

@app.get("/habit/{user_id}")
def get_habits(user_id: int):
    return [h for h in habit_db if h["user_id"] == user_id]


# -----------------------------------------------------------------------------











