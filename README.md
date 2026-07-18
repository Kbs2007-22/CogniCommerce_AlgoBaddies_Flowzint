CogniCommerce AI by Team AlgoBaddies
CogniCommerce AI is an autonomous, multi-agent customer care orchestration engine designed to resolve e-commerce return claims instantly while eliminating fraud. By shifting from manual ticket routing to autonomous resolution, the engine processes up to 80% of routine claims without human intervention, transforming customer care from a cost center into a secure, automated gatekeeper.
Why CogniCommerce AI?
Geospatial Delivery Verification: Eliminates "False Delivery" claims by calculating the precise physical distance between the courier's drop-off coordinates and the user's live location, flagging discrepancies with mathematical certainty.
Multimodal Security Shield: Acts as a digital gatekeeper using WebRTC liveness detection and forensic image analysis (EXIF/ELA) to prevent the submission of doctored or fake evidence.
Instant Trust-Based Resolution: Assigns a real-time "Trust Score" to customers, enabling frictionless refunds for loyal shoppers while automatically escalating high-risk, suspicious claims to human agents.
Visual Defect Forensics: Uses CLIP embeddings and DBSCAN clustering to map physical defects, enabling proactive identification of faulty manufacturing batches before they scale into brand-wide crises.
🛠 Tech Stack
Backend & AI Engine
Framework: FastAPI (High-performance async API orchestration).
AI/ML Models: OpenAI CLIP (Multimodal feature extraction for defect analysis).
Data Science: Scikit-learn (DBSCAN for clustering; PCA for dimensionality reduction), NumPy.
Image Forensics: Pillow (PIL) (Metadata and image processing).
Geospatial Logic: Geopy (Coordinate distance verification).
Frontend
Library: React with Vite.
UI/Design: Figma (UI/UX design), custom styling for dashboard visualization.
Infrastructure & Security
Communication: WebRTC (Liveness detection).
Environment: Uvicorn (ASGI server).
