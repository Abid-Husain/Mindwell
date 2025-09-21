from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from groq import Groq
from groq import Client
import os
from dotenv import load_dotenv
import logging

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
    # client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    client = Client(api_key=os.getenv("GROQ_API_KEY"))
    print("✅ Groq client initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Groq client: {e}")
    client = None


conversations = {}

# Data models
class ChatRequest(BaseModel):
    message: str
    mood: int
    user_name: str = "User"
    # user_id: str = "User"
    
    

class ChatResponse(BaseModel):
    response: str
    mood_analysis: str



# class ChatRequest(BaseModel):
#     user_id: str
#     user_message: str
#     mood: int

def create_mental_health_prompt(mood: int, user_name: str):
    """Create a contextual prompt based on user's mood and name"""
    
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

#     return f"""You are MindWell AI, a compassionate mental health companion for youth aged 13-25. 

# # User Context:
# - Name: {user_name}
# - Current mood: {mood}/10 ({mood_context})

# Your Role:
# - Be a supportive friend and wise advisor
# - Provide practical mental health strategies
# - Build confidence and self-esteem
# - Use warm, age-appropriate language
# - If mood is very low (0-3), focus on crisis support and professional help
# - If mood is medium (4-6), provide encouragement and coping strategies  
# - If mood is high (7-10), celebrate and maintain positive momentum

# Guidelines:
# - Keep responses under 150 words
# - Be genuine and empathetic
# - Suggest actionable steps when appropriate
# - Always prioritize user safety and wellbeing
# - Use supportive emojis when appropriate
# - If you detect crisis language, immediately suggest professional help

# Remember: You are not a replacement for professional therapy, but a supportive companion."""

        history_text = ""
        if conversations:
            formatted = "\n".join([f"User: {h['user']}\nAI: {h['ai']}" for h in conversations[-3:]])
            history_text = f"\nHere is the recent conversation:\n{formatted}"

        # Few-shot style + instruction
        return f"""
    You are MindWell AI, a compassionate mental health companion for youth aged 13-25.
    Your role is to provide safe, empathetic, and supportive guidance. 
    Speak like a trained psychologist — validate feelings, ask gentle questions, and avoid judgment.

    Examples of good responses:
    User: "I feel like no one understands me."
    AI: "That sounds really difficult. Feeling misunderstood can be painful. 
    Would you like to tell me what happened recently?"

    User: "I'm so anxious about my exams."
    AI: "It's completely natural to feel anxious before exams. 
    Can we talk about what part of the exams worries you the most?"

    Now, respond to:
    User: {user_name}, who is currently {mood_context}.
    {history_text}
    """






@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # user_id = req.user_id
    
    user_id = 0

    # Get or create conversation history
    if user_id not in conversations:
        conversations[user_id] = []
    
    # Get the last 3 exchanges only (to keep prompt short)
    history = conversations[user_id][-3:]

    # Create the AI prompt with history
    prompt = create_mental_health_prompt(req.mood, user_id, history)

    # Call Groq API (pseudo-code)
    ai_response = chat_with_ai(prompt)

    # Save this exchange in conversation history
    conversations[user_id].append({"user": req.user_message, "ai": ai_response})

    return {"reply": ai_response}





@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "MindWell AI Backend is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    groq_status = "connected" if client else "disconnected"
    return {
        "status": "healthy",
        "groq_api": groq_status,
        "version": "1.0.0"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Main chat endpoint that processes user messages and returns AI responses"""
    
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="AI service is not available. Please check your Groq API key."
        )
    
    try:
        # Create system prompt based on user context
        system_prompt = create_mental_health_prompt(request.mood, request.user_name)
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.1-8b-instant",  # Fast and capable model
            max_tokens=200,
            temperature=0.7,
            top_p=0.9,
        )
        
        
        ai_response = chat_completion.choices[0].message.content
        
        # Analyze mood for response categorization
        if request.mood < 4:
            mood_analysis = "supportive"
        elif request.mood < 7:
            mood_analysis = "encouraging"
        else:
            mood_analysis = "empowering"
        
        print(f"✅ AI Response generated for {request.user_name} (mood: {request.mood})")
        
        return ChatResponse(
            response=ai_response,
            mood_analysis=mood_analysis
        )
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {str(e)}")
        
        # Fallback response if AI fails
        fallback_response = "I'm having trouble connecting to my AI brain right now. Please try again in a moment. If you're experiencing a mental health crisis, please reach out to a mental health professional or call 988 (Suicide & Crisis Lifeline) immediately. 💙"
        
        raise HTTPException(
            status_code=500, 
            detail=f"AI service error: {str(e)}"
        )







# @app.post("/api/chat")
# async def chat_endpoint(request: ChatRequest):
#     """Main chat endpoint that processes user messages and returns AI responses"""
    
#     # Use the user_id from the request body
#     user_id = request.user_id

#     # Get or create conversation history
#     if user_id not in conversations:
#         conversations[user_id] = []
    
#     # Get the last 3 exchanges only (to keep prompt short)
#     # Note: You were using a non-existent key 'user_message'
#     # Here's a fixed version to get the last 3 user-AI pairs
#     history = conversations[user_id][-3:]

#     try:
#         # Create system prompt based on user context
#         system_prompt = create_mental_health_prompt(request.mood, request.user_name, history)
        
#         # Call Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": request.message}
#             ],
#             model="llama-3.1-8b-instant",
#             max_tokens=200,
#             temperature=0.7,
#             top_p=0.9,
#         )
        
#         ai_response = chat_completion.choices[0].message.content
        
#         # Save this exchange in conversation history
#         conversations[user_id].append({"user": request.message, "ai": ai_response})

#         # Analyze mood for response categorization
#         if request.mood < 4:
#             mood_analysis = "supportive"
#         elif request.mood < 7:
#             mood_analysis = "encouraging"
#         else:
#             mood_analysis = "empowering"
        
#         print(f"✅ AI Response generated for {request.user_name} (mood: {request.mood})")
        
#         # Return the response with a Pydantic model
#         return ChatResponse(
#             response=ai_response,
#             mood_analysis=mood_analysis
#         )
        
#     except Exception as e:
#         print(f"❌ Error in chat endpoint: {str(e)}")
        
#         fallback_response = "I'm having trouble connecting to my AI brain right now. Please try again in a moment. If you're experiencing a mental health crisis, please reach out to a mental health professional or call 988 (Suicide & Crisis Lifeline) immediately. 💙"
        
#         raise HTTPException(
#             status_code=500, 
#             detail=f"AI service error: {str(e)}"
#         )










@app.get("/api/mood-tips/{mood_level}")
async def get_mood_tips(mood_level: int):
    """Get mood-specific tips and suggestions"""
    
    tips = {
        0: ["Reach out for professional help immediately", "Call crisis hotline: 988", "You are not alone"],
        1: ["Practice deep breathing", "Reach out to a trusted friend", "Consider professional support"],
        2: ["Try the 5-4-3-2-1 grounding technique", "Listen to calming music", "Take a warm shower"],
        3: ["Go for a short walk", "Practice gratitude journaling", "Connect with nature"],
        4: ["Do something creative", "Call a friend", "Practice mindfulness"],
        5: ["Set a small achievable goal", "Try a new hobby", "Practice self-care"],
        6: ["Share your good mood with others", "Plan something fun", "Help someone else"],
        7: ["Celebrate your progress", "Set bigger goals", "Spread positivity"],
        8: ["Use your energy for meaningful activities", "Inspire others", "Practice gratitude"],
        9: ["Channel your energy productively", "Be mindful of balance", "Share your joy"],
    }
    
    mood_tips = tips.get(mood_level, ["Stay balanced", "Practice self-awareness", "Be kind to yourself"])
    
    return {"mood_level": mood_level, "tips": mood_tips}

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting MindWell Backend Server...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📋 API documentation at: http://localhost:8000/docs")
    print("💡 Make sure your Groq API key is set in mw.env file")
    print("-" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )