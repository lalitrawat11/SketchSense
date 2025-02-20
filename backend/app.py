from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import io
from fastapi.middleware.cors import CORSMiddleware
import easyocr
from together import Together
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

# Get the API key from the environment variable
api_key = os.getenv("API_KEY")
blipModel = os.getenv("blipMODEL")
aiModel = os.getenv("aiMODEL")
# Initialize the client with the API key
client = Together(api_key=api_key) # Replace with actual API key
# Load model and processor
processor = BlipProcessor.from_pretrained(blipModel)
model = BlipForConditionalGeneration.from_pretrained(blipModel)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/recognize/")
async def recognize(file: UploadFile = File(...)):
    print('Recognize endpoint hit')  # Log when the endpoint is hit
    try:
        image_bytes = await file.read()  # Read the uploaded file
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")  # Open the image and convert to RGB
        
        # Process image
        inputs = processor(image, return_tensors="pt")  # Prepare the image for the model
        out = model.generate(**inputs)  # Generate the caption
        caption = processor.decode(out[0], skip_special_tokens=True)  # Decode the caption
        
        prompt = (
            "You are an AI that read the caption. "
            "f the image represents a well-known story (e.g., a tree with an apple falling on a man referencing Newton’s discovery of gravity.), respond with the relevant story in under 30 words.  "
            "if it is an object like mango just answer with the caption itself. "
            "Otherwise, provide a concise, factual description in under 30 words."
            "Now, analyze this: {caption}"
        )

        print(caption)
        response = client.chat.completions.create(
            model=aiModel,  # Text-based model
            messages=[
                {"role": "system", "content": "You are an AI that explains text in images."},
                {"role": "user", "content":  prompt.format(caption=caption)}
            ]
        )
        result = response.choices[0].message.content
        
        print(f"Generated caption: {result}")  # Log the caption
        return JSONResponse(content={"caption": result})  # Return the caption as JSON
    except Exception as e:
        print(f"Error: {str(e)}")  # Log any errors
        return JSONResponse(content={"error": str(e)}, status_code=500)  # Return error response

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
        response = client.chat.completions.create(
            model=aiModel,  # Text-based model
            messages=[
                {"role": "system", "content": "You are an AI that explains text in images."},
                {"role": "user", "content":  prompt.format(extracted_text=extracted_text)}
            ]
        )
        caption = response.choices[0].message.content
        print(caption)
        return JSONResponse(content={"caption": caption})  # Return the caption as JSON
        
    except Exception as e:
        print(f"Error: {str(e)}")  # Log any errors
        return JSONResponse(content={"error": str(e)}, status_code=500)

