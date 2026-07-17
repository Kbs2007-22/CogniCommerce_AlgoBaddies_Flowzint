Final section for README.md. It covers the prerequisites, setup steps, and how to get both servers running smoothly for local development.

Getting Started
Follow these instructions to set up Flowzint on your local machine.

Prerequisites
Ensure you have the following installed before proceeding:
Python 3.8+ (For the FastAPI backend and AI engines)
Node.js (v18+) & npm (For the React/Vite frontend)
Git
1. Clone the Repository
Bash
git clone https://github.com/Kbs2007-22/Flowzint.git
cd Flowzint


2. Backend Setup (FastAPI)
It is highly recommended to use a virtual environment to manage the Python dependencies (including the machine learning libraries like torch and scikit-learn).

Bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt


Note on Database: You do not need to manually configure a database. The SQLite database (customer_care.db) and its tables will automatically generate, and mock user profiles (for high-trust and low-trust testing) will seed on the first startup.

3. Frontend Setup (React/Vite)
Open a new terminal window (keep your backend terminal available) and navigate to your frontend directory (assuming it is in the root or a specific client folder).

Bash
# Install Node modules
npm install


Running the Application
To run Flowzint locally, you will need to start both the backend and frontend servers simultaneously in separate terminal windows.

Start the Backend Engine
With your virtual environment activated, run the main Python file. This will spin up the Uvicorn server on port 8000.

Bash
python main.py


API Base URL: http://localhost:8000
Interactive API Docs (Swagger UI): http://localhost:8000/docs

Start the Frontend Dashboard
In your second terminal, run the Vite development server:

Bash
npm run dev


Frontend Dashboard: http://localhost:5173 (or the port specified in your terminal)
Once both servers are running, the React application will automatically poll the backend health endpoint and connect to the agentic decision engines!
Add the USP and the working.
