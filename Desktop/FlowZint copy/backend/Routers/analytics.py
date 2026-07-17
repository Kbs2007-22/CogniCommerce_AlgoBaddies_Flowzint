# routers/analytics.py
from fastapi import APIRouter
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from collections import Counter

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Demotion"])

# In-memory database for real-time embedding storage and processing
# In production, this would be your ChromaDB or Vector database
db = {
    "embeddings": [],
    "images": [],
    "batch_ids": [],
    "plot_data": [],
    "cluster_summaries": {},
    "top_offender": None
}

def seed_mock_embeddings():
    """Seeds the in-memory db with mock data so PCA and DBSCAN can be tested immediately."""
    if len(db["embeddings"]) > 0:
        return

    # Simulating 5 defect image embeddings (e.g., 128-dimensional vectors from CLIP)
    # 3 are very similar (Cluster 1 - Batch A), 2 are similar to each other (Cluster 2 - Batch B)
    db["embeddings"] = [
        np.random.normal(0, 0.1, 128).tolist(),  # Batch A, defect 1
        np.random.normal(0, 0.1, 128).tolist(),  # Batch A, defect 2
        np.random.normal(0, 0.1, 128).tolist(),  # Batch A, defect 3
        np.random.normal(5, 0.1, 128).tolist(),  # Batch B, defect 1
        np.random.normal(5, 0.1, 128).tolist(),  # Batch B, defect 2
    ]
    db["images"] = ["broken_screen_1.jpg", "broken_screen_2.jpg", "broken_screen_3.jpg", "scratched_back_1.jpg", "scratched_back_2.jpg"]
    db["batch_ids"] = ["Batch-A12", "Batch-A12", "Batch-A12", "Batch-B99", "Batch-B99"]


def update_realtime_system():
    """
    Core engine: Clusters embeddings, reduces dimensions for the frontend plot, 
    and identifies the highest-risk batch for demotion.
    """
    n_samples = len(db["embeddings"])
    if n_samples == 0:
        return

    X = np.array(db["embeddings"])
    
    # 1. Lower threshold to 2 so classification starts immediately on a pair
    if n_samples >= 2:
        clustering = DBSCAN(eps=0.15, min_samples=2, metric="cosine")
        labels = clustering.fit_predict(X)
    else:
        labels = np.full(n_samples, -1)

    # 2. Compute 2D PCA Spatial Coordinates (Unchanged)
    if n_samples == 1:
        coords = np.array([[0.0, 0.0]])
    elif n_samples == 2:
        pca = PCA(n_components=1)
        x_dim = pca.fit_transform(X).flatten()
        coords = np.stack([x_dim, np.zeros(2)], axis=1)
    else:
        pca = PCA(n_components=2)
        coords = pca.fit_transform(X)

    db["plot_data"] = []
    for i in range(n_samples):
        db["plot_data"].append({
            "name": db["images"][i],
            "batch_id": db["batch_ids"][i],
            "x": float(coords[i][0]),
            "y": float(coords[i][1]),
            "cluster": int(labels[i])
        })

    # 3. NEW LOGIC: Rank clusters to find the #1 Worst Offender
    db["cluster_summaries"] = {}
    db["top_offender"] = None # Reset the top offender on every upload
    
    unique_labels = set(labels)
    largest_cluster_size = 0
    
    for label in unique_labels:
        if label == -1:
            continue # Skip isolated single items
            
        batches_in_cluster = [db["batch_ids"][i] for i in range(n_samples) if labels[i] == label]
        cluster_size = len(batches_in_cluster)
        
        counter = Counter(batches_in_cluster)
        top_batch, count = counter.most_common(1)[0]
        
        db["cluster_summaries"][int(label)] = {
            "top_batch_id": top_batch,
            "defect_count": count,
            "total_cluster_size": cluster_size
        }
        
        # Identify if this is the "most clustered" group in the entire system
        if cluster_size > largest_cluster_size:
            largest_cluster_size = cluster_size
            db["top_offender"] = {
                "cluster_id": int(label),
                "worst_batch_id": top_batch,
                "cluster_size": cluster_size
            }

@router.get("/status")
async def get_status():
    """
    Returns the PCA plot data, cluster summaries, and the overall top offending batch ID 
    to the frontend admin dashboard.
    """
    # Seed mock data and run the engine for demonstration purposes
    seed_mock_embeddings()
    update_realtime_system()
    
    return {
        "plot_data": db["plot_data"],
        "summaries": db["cluster_summaries"],
        "system_top_offender": db.get("top_offender")
    }
