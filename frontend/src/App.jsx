import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(10);
  const [isErasing, setIsErasing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [undoStack, setUndoStack] = useState([]);
  const [resultText, setResultText] = useState("");

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#964B00",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
  ];

  // Save canvas state after each stroke
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    setUndoStack((prevStack) => [...prevStack, canvas.toDataURL()]);
  };

  useEffect(() => {
    const resizeCanvas = () => {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const displayWidth = canvas.clientWidth;
          const displayHeight = canvas.clientHeight;
          canvas.width = displayWidth;
          canvas.height = displayHeight;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      });
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Run after event listener to avoid missing early resizes

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = isErasing ? "#000000" : currentColor;
    ctx.beginPath();
    ctx.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = isErasing ? "#ffffff" : currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    ctx.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveCanvasState();
      setIsDrawing(false);
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setUndoStack([]);
    setResultText("");
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    setUndoStack((prevStack) => {
      const newStack = [...prevStack];
      newStack.pop();

      if (newStack.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        const img = new Image();
        img.src = newStack[newStack.length - 1];
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
      }

      return newStack;
    });
  };

  // Add keyboard listener for Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const calculateDrawing = async () => {
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png"); // Get base64 image data

      // Convert base64 to Blob
      const response = await fetch(imageData);
      const blob = await response.blob(); // Convert the base64 data to a Blob

      const formData = new FormData();
      formData.append("file", blob, "drawing.png"); // Append the blob as a file

      const apiResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/calculate/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Set the correct content type
          },
        }
      );
      setResultText(apiResponse.data.caption); //print ans in result box
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const recognizeDrawing = async () => {
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png"); // Get base64 image data

      // Convert base64 to Blob
      const response = await fetch(imageData);
      const blob = await response.blob(); // Convert the base64 data to a Blob

      const formData = new FormData();
      formData.append("file", blob, "drawing.png"); // Append the blob as a file

      const apiResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/recognize/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Set the correct content type
          },
        }
      );
      setResultText(apiResponse.data.caption); //print ans in result box
    } catch (error) {
      console.error("Error:", error); // Log any errors
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <button onClick={resetCanvas} className="reset-btn">
          Reset
        </button>
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`eraser-btn ${isErasing ? "active" : "#ffffff"}`}
        >
          {isErasing ? "Draw" : "Erase"}
        </button>
        <button
          onClick={undo}
          className="undo-btn"
          disabled={undoStack.length === 0}
        >
          Undo
        </button>
        <div className="color-palette">
          {colors.map((color) => (
            <div
              key={color}
              className={`color-option ${
                color === currentColor ? "selected" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setCurrentColor(color);
                setIsErasing(false);
              }}
            />
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="line-width-slider"
        />
        <span>{lineWidth}px</span>
        <button className="calculate-btn" onClick={calculateDrawing}>
          Calculate
        </button>
        <button className="recognize-btn" onClick={recognizeDrawing}>
          Recognize
        </button>
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        />

        <div
          style={{
            padding: "10px",
            border: "1px solid black",
            background: "#FFFFFF",
            color: "#000000",
            position: "absolute",
            bottom: "5px",
            left: "50%",
            transform: "translateX(-50%)" /* Center horizontally */,
            width: "calc(100% )",
            height: "80px",
            borderRadius: "8px",
          }}
        >
          <strong style={{ fontSize: "35px", fontWeight: "bold" }}>
            Result:
          </strong>
          <span style={{ fontSize: "35px", color: "#000000" }}>
            {" " + resultText + "."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
