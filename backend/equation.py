from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware
import easyocr
from together import Together
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import uvicorn

load_dotenv()

# Get the API key from the environment variable
api_key = os.getenv("API_KEY")
aiModel = os.getenv("aiMODEL")
# Initialize the client with the API key
client = Together(api_key=api_key) # Replace with actual API key


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageData(BaseModel):
    image: str

@app.post("/calculate/")
async def calculate(file: UploadFile = File(...)):
    print('calculate endpoint hit')  # Log when the endpoint is hit
    try:
        image_bytes = await file.read()

        # Initialize EasyOCR reader and Use EasyOCR to extract text from the image
        reader = easyocr.Reader(['en'])
        results = reader.readtext(image_bytes)

        extracted_text = " ".join(text for _, text, _ in results)

        #prompt for the chat ai
        prompt = (
            "You are an AI that solves equations and explains formulas concisely (under 30 words). "
            "For simple math expressions (e.g., '2+2 ='), solve them (e.g., '2+2 = 4'). "
            "For equations with missing values (e.g., 'x+y=10, x=5, y='), solve for the unknown (e.g., 'y=5'). "
            "For formulas (e.g., 'y=mx+c'), provide a short explanation (e.g., 'Equation of a straight line, where m is the slope and c is the y-intercept.'). "
            "Also fix in answer if there is any mistake in the text.but dont mention that there is a mistake just fix it and dont show mistake in the answer."
            "Now, analyze this: {extracted_text}"
        )

        print(extracted_text)
        
        caption = callingTogetherAI(prompt,extracted_text)
        print(caption)
        return JSONResponse(content={"caption": caption})  # Return the caption as JSON
        
    except Exception as e:
        print(f"Error: {str(e)}")  # Log any errors
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/")
def read_root():
    return {"message": "Hello from SketchSense Backend!"}

def callingTogetherAI(prompt,extracted_text):
    response = client.chat.completions.create(
            model=aiModel,  # Text-based model
            messages=[
                {"role": "system", "content": "You are an AI that explains text in images."},
                {"role": "user", "content":  prompt.format(extracted_text=extracted_text)}
            ]
        )
    return response.choices[0].message.content
