"""
ChromaDB Vector Store

Provides vector storage and retrieval for RAG using:
- ChromaDB for persistent vector storage
- Configurable embeddings (Sentence Transformers or default)
- Semantic search over document chunks
"""

import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Optional
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)


def get_embedding_function():
    """
    Get the embedding function based on configuration.
    
    Returns:
        Appropriate embedding function for ChromaDB
    """
    if settings.LIGHTWEIGHT_MODE:
        # Use ChromaDB's default embeddings (no model download required)
        # Good for resource-constrained environments like Render free tier
        logger.info("Using ChromaDB default embeddings (lightweight mode)")
        return embedding_functions.DefaultEmbeddingFunction()
    
    if settings.EMBEDDING_MODEL == "default":
        logger.info("Using ChromaDB default embeddings")
        return embedding_functions.DefaultEmbeddingFunction()
    
    # Use Sentence Transformers (requires model download)
    logger.info(f"Using Sentence Transformer: {settings.EMBEDDING_MODEL}")
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=settings.EMBEDDING_MODEL
    )


class VectorStore:
    """
    ChromaDB-based vector store for document chunks.
    
    Supports multiple embedding backends:
    - Sentence Transformers (default, higher quality, requires download)
    - ChromaDB default (lightweight, no additional downloads)
    """
    
    def __init__(self, collection_name: str = "research_papers"):
        logger.info(f"Initializing ChromaDB with collection: {collection_name}")
        
        # Ensure persistence directory exists
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        
        # Create persistent client
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR
        )
        
        # Get appropriate embedding function
        self.embedding_fn = get_embedding_function()
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
        
        logger.info(f"Collection initialized with {self.collection.count()} documents")
        logger.info(f"Lightweight mode: {settings.LIGHTWEIGHT_MODE}")
    
    def add_documents(
        self,
        chunks: List[str],
        metadata: Dict,
        doc_id: str
    ) -> int:
        """
        Add document chunks to the vector store.
        
        Args:
            chunks: List of text chunks
            metadata: Metadata to attach (source_url, title, etc.)
            doc_id: Unique document identifier
            
        Returns:
            Number of chunks added
        """
        if not chunks:
            logger.warning("No chunks to add")
            return 0
        
        # Generate unique IDs for each chunk
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        
        # Attach metadata to each chunk
        metadatas = [
            {
                "source_url": metadata.get("source_url", ""),
                "title": metadata.get("title", ""),
                "doc_id": doc_id,
                "chunk_index": i
            }
            for i in range(len(chunks))
        ]
        
        logger.info(f"Adding {len(chunks)} chunks for document: {doc_id}")
        
        try:
            # Check for duplicates and skip if already exists
            existing = self.collection.get(ids=ids[:1])
            if existing and existing.get("ids"):
                logger.info(f"Document {doc_id} already exists, skipping")
                return 0
            
            self.collection.add(
                documents=chunks,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(f"Successfully added {len(chunks)} chunks")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Failed to add chunks: {e}")
            raise
    
    def query(
        self,
        query_text: str,
        n_results: int = 5,
        filter_doc_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Query the vector store for relevant chunks.
        
        Args:
            query_text: Search query
            n_results: Number of results to return
            filter_doc_id: Optional filter to search within a specific document
            
        Returns:
            List of dictionaries containing:
            - text: The chunk text
            - metadata: Associated metadata
            - distance: Similarity distance (lower = more similar)
        """
        logger.info(f"Querying vector store: '{query_text[:50]}...'")
        
        # Build where filter if needed
        where_filter = None
        if filter_doc_id:
            where_filter = {"doc_id": filter_doc_id}
        
        try:
            # Check if collection has any documents
            if self.collection.count() == 0:
                logger.info("Collection is empty, returning no results")
                return []
            
            results = self.collection.query(
                query_texts=[query_text],
                n_results=min(n_results, self.collection.count()),
                where=where_filter
            )
            
            # Format results
            formatted = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted.append({
                        "text": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else None
                    })
            
            logger.info(f"Found {len(formatted)} relevant chunks")
            return formatted
            
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return []  # Return empty rather than raise for robustness
    
    def get_document_chunks(self, doc_id: str) -> List[Dict]:
        """
        Retrieve all chunks for a specific document.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            List of chunk dictionaries
        """
        try:
            results = self.collection.get(
                where={"doc_id": doc_id}
            )
            
            formatted = []
            if results["documents"]:
                for i, doc in enumerate(results["documents"]):
                    formatted.append({
                        "text": doc,
                        "metadata": results["metadatas"][i] if results["metadatas"] else {}
                    })
            
            return formatted
            
        except Exception as e:
            logger.error(f"Failed to get document chunks: {e}")
            raise
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete all chunks for a document.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            True if successful
        """
        try:
            self.collection.delete(
                where={"doc_id": doc_id}
            )
            logger.info(f"Deleted document: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise
    
    def count(self) -> int:
        """Get total number of chunks in the collection."""
        return self.collection.count()
    
    def clear(self) -> bool:
        """Clear all documents from the collection."""
        try:
            # Get all IDs and delete them
            all_items = self.collection.get()
            if all_items["ids"]:
                self.collection.delete(ids=all_items["ids"])
            logger.info("Cleared all documents from collection")
            return True
        except Exception as e:
            logger.error(f"Failed to clear collection: {e}")
            raise


# Singleton instance - initialized lazily
_vector_store_instance: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get or create the vector store singleton."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore()
    return _vector_store_instance


# For backwards compatibility - create a property-like access
class _VectorStoreProxy:
    """Proxy class that lazily initializes the vector store on first access."""
    
    def __getattr__(self, name):
        return getattr(get_vector_store(), name)


# Export the proxy as vector_store for backwards compatibility
vector_store = _VectorStoreProxy()
