"""
PDF Parser Tool

Provides functionality to download and parse academic PDFs:
- Stream downloads to avoid memory issues
- Text extraction via PyMuPDF (fitz)
- Recursive character text splitting for RAG
- Summary prompt generation
"""

import fitz  # PyMuPDF
import httpx
from typing import Dict, List
import logging

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings

logger = logging.getLogger(__name__)


class PDFParser:
    """
    PDF download, extraction, and chunking tool.
    
    Handles the full pipeline from URL to text chunks ready for
    vector storage and RAG retrieval.
    """
    
    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None
    ):
        self.chunk_size = chunk_size or settings.PDF_CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.PDF_CHUNK_OVERLAP
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def download_pdf(self, pdf_url: str) -> bytes:
        """
        Download a PDF from a URL.
        
        Args:
            pdf_url: URL to the PDF file
            
        Returns:
            PDF file contents as bytes
            
        Raises:
            ValueError: If PDF exceeds max size (only in LIGHTWEIGHT_MODE)
        """
        logger.info(f"Downloading PDF from: {pdf_url}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(pdf_url, follow_redirects=True)
            response.raise_for_status()
            
            size_bytes = len(response.content)
            size_mb = size_bytes / (1024 * 1024)
            
            # Only enforce size limit on resource-constrained servers
            if settings.LIGHTWEIGHT_MODE and size_mb > 3.0:
                logger.warning(f"PDF too large: {size_mb:.1f}MB > 3MB limit (LIGHTWEIGHT_MODE)")
                raise ValueError(f"PDF too large ({size_mb:.1f}MB), skipping to save server resources")
            
            logger.info(f"Downloaded {size_bytes} bytes ({size_mb:.1f}MB)")
            return response.content
    
    def extract_text(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF bytes using PyMuPDF.
        
        Args:
            pdf_bytes: PDF file contents
            
        Returns:
            Extracted text from pages
        """
        logger.info("Extracting text from PDF")
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        total_pages = len(doc)
        
        # Limit pages only on resource-constrained servers
        max_pages = 15 if settings.LIGHTWEIGHT_MODE else total_pages
        pages_to_extract = min(total_pages, max_pages)
        
        if total_pages > pages_to_extract:
            logger.info(f"Large PDF ({total_pages} pages), extracting first {pages_to_extract} pages only (LIGHTWEIGHT_MODE)")
        
        try:
            for page_num in range(pages_to_extract):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                full_text += page_text
                
                # Add page separator for clarity
                if page_num < pages_to_extract - 1:
                    full_text += "\n\n"
        finally:
            doc.close()
        
        logger.info(f"Extracted {len(full_text)} characters from {pages_to_extract}/{total_pages} pages")
        return full_text
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks for vector storage.
        
        Args:
            text: Full text to split
            
        Returns:
            List of text chunks
        """
        chunks = self.splitter.split_text(text)
        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks
    
    async def download_and_parse(self, pdf_url: str, skip_chunks: bool = False) -> Dict:
        """
        Full pipeline: download PDF, extract text, and chunk it.
        
        Args:
            pdf_url: URL to the PDF file
            skip_chunks: If True, skip chunking (for memory-constrained environments)
            
        Returns:
            Dictionary containing:
            - text_for_summary: Truncated text for LLM summarization
            - chunks: List of text chunks (empty if skip_chunks=True)
            - num_chunks: Number of chunks
            - num_characters: Total character count
            - source_url: Original PDF URL
        """
        try:
            # Download
            pdf_bytes = await self.download_pdf(pdf_url)
            
            # Extract text
            full_text = self.extract_text(pdf_bytes)
            
            # Free PDF bytes immediately to save memory
            del pdf_bytes
            
            # Get truncated text for summarization (8KB max)
            text_for_summary = full_text[:settings.MAX_CONTEXT_CHARS]
            
            # Chunk only if needed (for vector storage)
            if skip_chunks:
                chunks = []
            else:
                chunks = self.chunk_text(full_text)
            
            num_chars = len(full_text)
            
            # Free full text if we only need summary
            if skip_chunks:
                del full_text
            
            return {
                "text_for_summary": text_for_summary,
                "chunks": chunks,
                "num_chunks": len(chunks),
                "num_characters": num_chars,
                "source_url": pdf_url
            }
            
        except Exception as e:
            logger.error(f"Failed to parse PDF from {pdf_url}: {e}")
            raise
    
    def get_summary_prompt(self, text: str, max_chars: int = None) -> str:
        """
        Create a summarization prompt for the LLM.
        
        Truncates the text to avoid context window overflow.
        
        Args:
            text: Paper text to summarize
            max_chars: Maximum characters to include
            
        Returns:
            Formatted prompt for summarization
        """
        max_chars = max_chars or settings.MAX_CONTEXT_CHARS
        truncated = text[:max_chars]
        
        # Add truncation notice if text was cut
        if len(text) > max_chars:
            truncated += "\n\n[Text truncated for length]"
        
        return f"""You are an expert academic summarizer. Summarize the following research paper excerpt in 3-4 sentences.

Focus on:
- The main research question or problem
- The methodology or approach used
- Key findings or contributions
- Practical implications (if any)

Paper excerpt:
---
{truncated}
---

Provide a concise summary:"""
    
    def get_extraction_prompt(self, text: str, question: str) -> str:
        """
        Create a prompt to extract specific information from text.
        
        Args:
            text: Paper text
            question: Specific question to answer
            
        Returns:
            Formatted extraction prompt
        """
        truncated = text[:settings.MAX_CONTEXT_CHARS]
        
        return f"""Based on the following academic paper excerpt, answer this question:

Question: {question}

Paper excerpt:
---
{truncated}
---

Answer the question based only on the information in the excerpt. If the information is not available, say so clearly."""


# Global instance for convenience
pdf_parser = PDFParser()
