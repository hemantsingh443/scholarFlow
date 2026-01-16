"""
ArXiv Search Tool

Provides functionality to search ArXiv for academic papers with:
- Rate limiting to respect API constraints
- LRU caching for repeated queries
- Exponential backoff for resilience
"""

import arxiv
from typing import List, Dict, Optional
from functools import lru_cache
import time
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class ArxivSearcher:
    """
    ArXiv paper search tool with rate limiting and caching.
    
    Implements exponential backoff and result caching to handle
    API rate limits gracefully.
    """
    
    def __init__(self, max_results: int = None):
        self.max_results = max_results or settings.ARXIV_MAX_RESULTS
        self._last_request_time = 0
        self._rate_limit_seconds = settings.ARXIV_RATE_LIMIT_SECONDS
        self._backoff_multiplier = 1.0
    
    def _rate_limit(self):
        """Implement rate limiting with exponential backoff."""
        elapsed = time.time() - self._last_request_time
        wait_time = self._rate_limit_seconds * self._backoff_multiplier
        
        if elapsed < wait_time:
            sleep_time = wait_time - elapsed
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)
        
        self._last_request_time = time.time()
    
    def _reset_backoff(self):
        """Reset backoff multiplier after successful request."""
        self._backoff_multiplier = 1.0
    
    def _increase_backoff(self):
        """Increase backoff multiplier after failure."""
        self._backoff_multiplier = min(self._backoff_multiplier * 2, 32.0)
    
    def search(self, query: str, max_results: int = None) -> List[Dict]:
        """
        Search ArXiv for papers matching the query.
        
        Args:
            query: Search query string
            max_results: Maximum number of results (defaults to config value)
            
        Returns:
            List of paper metadata dictionaries containing:
            - title: Paper title
            - abstract: Paper abstract/summary
            - authors: List of author names
            - pdf_url: URL to download PDF
            - published: Publication date (ISO format)
            - arxiv_id: ArXiv paper ID
        """
        # Use cached version for repeated queries
        return self._cached_search(query, max_results or self.max_results)
    
    @lru_cache(maxsize=100)
    def _cached_search(self, query: str, max_results: int) -> tuple:
        """Cached search implementation (returns tuple for hashability)."""
        self._rate_limit()
        
        logger.info(f"Searching ArXiv for: '{query}' (max {max_results} results)")
        
        try:
            search = arxiv.Search(
                query=query,
                max_results=max_results,
                sort_by=arxiv.SortCriterion.Relevance
            )
            
            results = []
            for paper in search.results():
                results.append({
                    "title": paper.title,
                    "abstract": paper.summary,
                    "authors": [a.name for a in paper.authors],
                    "pdf_url": paper.pdf_url,
                    "published": paper.published.isoformat() if paper.published else None,
                    "arxiv_id": paper.entry_id.split("/")[-1],
                    "categories": paper.categories,
                    "primary_category": paper.primary_category
                })
            
            self._reset_backoff()
            logger.info(f"Found {len(results)} papers")
            
            # Return as tuple for caching (convert back to list when using)
            return tuple(results)
            
        except Exception as e:
            self._increase_backoff()
            logger.error(f"ArXiv search failed: {e}")
            raise
    
    def search_by_id(self, arxiv_id: str) -> Optional[Dict]:
        """
        Fetch a specific paper by its ArXiv ID.
        
        Args:
            arxiv_id: The ArXiv paper ID (e.g., "2301.00001")
            
        Returns:
            Paper metadata dictionary, or None if not found
        """
        self._rate_limit()
        
        try:
            search = arxiv.Search(id_list=[arxiv_id])
            results = list(search.results())
            
            if results:
                paper = results[0]
                return {
                    "title": paper.title,
                    "abstract": paper.summary,
                    "authors": [a.name for a in paper.authors],
                    "pdf_url": paper.pdf_url,
                    "published": paper.published.isoformat() if paper.published else None,
                    "arxiv_id": arxiv_id,
                    "categories": paper.categories,
                    "primary_category": paper.primary_category
                }
            
            return None
            
        except Exception as e:
            logger.error(f"ArXiv ID lookup failed: {e}")
            raise


# Global instance for convenience
arxiv_searcher = ArxivSearcher()
