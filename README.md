# SketchSense

SketchSense – Your sketches make sense with AI. This is a FastAPI application that provides an API for processing images and recognization or calculation, specifically for drawing mathematical concepts and equations. It utilizes machine learning models to generate captions and solve equations based on the content of the images.

## Features

- Image recognition using EasyOCR.
- Image captioning using the BLIP model from Hugging Face Transformers.
- Equation solving and explanation using a chat AI model.

## Requirements

- Python 3.7 or higher
- FastAPI
- Pillow
- Transformers
- NumPy
- EasyOCR
- Together (API client)
- Pydantic
- Dotenv
- Uvicorn
- Gunicorn
- Aiofiles

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/sketchsense.git
   cd sketchsense
   ```

2. Create a virtual environment (optional but recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the FastAPI server:

   ```bash
   uvicorn backend.app:app --reload
   ```

2. The API will be available at `http://127.0.0.1:8000`.

3. You can access the interactive API documentation at `http://127.0.0.1:8000/docs`.

## API Endpoints

### 1. Recognize Image

- **Endpoint**: `/recognize/`
- **Method**: `POST`
- **Description**: Upload an image to generate a caption.
- **Request**: 
  - Form-data with a file field named `file`.
- **Response**: 
  - JSON object containing the generated caption.

### 2. Calculate

- **Endpoint**: `/calculate/`
- **Method**: `POST`
- **Description**: Upload an image to extract text and solve equations.
- **Request**: 
  - Form-data with a file field named `file`.
- **Response**: 
  - JSON object containing the caption or error message.


## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [Pillow](https://pillow.readthedocs.io/en/stable/)
- [Transformers](https://huggingface.co/docs/transformers/index)
- [EasyOCR](https://github.com/JaidedAI/EasyOCR)
- [Together](https://together.xyz/)
