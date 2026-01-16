"""
PDF Report Generator

Converts Markdown reports to PDF using fpdf2.
Lightweight solution suitable for Render free tier.
"""

import io
import logging
import re
from fpdf import FPDF

logger = logging.getLogger(__name__)


def strip_markdown(text: str) -> str:
    """Remove markdown formatting from text."""
    if not text:
        return ""
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    # Italic
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    # Inline code
    text = re.sub(r'`(.+?)`', r'\1', text)
    # Links [text](url)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    # Images ![alt](url)
    text = re.sub(r'!\[.*?\]\(.+?\)', '', text)
    # Strikethrough
    text = re.sub(r'~~(.+?)~~', r'\1', text)
    return text.strip()


class ResearchReportPDF(FPDF):
    """Custom PDF class for research reports with proper styling."""
    
    def __init__(self):
        super().__init__()
        self.add_page()
        self.set_auto_page_break(auto=True, margin=15)
    
    def header(self):
        """Add header to each page."""
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'ScholarFlow Research Report', 0, 1, 'C')
        self.ln(5)
    
    def footer(self):
        """Add footer with page number."""
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
    
    def add_title(self, title: str):
        """Add report title."""
        self.set_font('Helvetica', 'B', 18)
        self.set_text_color(31, 41, 55)
        clean_title = self._clean_text(strip_markdown(title))
        self.multi_cell(0, 10, clean_title, 0, 'C')
        self.ln(10)
    
    def add_heading(self, text: str, level: int = 1):
        """Add a heading (h1, h2, h3)."""
        sizes = {1: 16, 2: 14, 3: 12}
        self.set_font('Helvetica', 'B', sizes.get(level, 12))
        self.set_text_color(31, 41, 55)
        clean_text = self._clean_text(strip_markdown(text))
        self.multi_cell(0, 8, clean_text)
        self.ln(3)
    
    def add_paragraph(self, text: str):
        """Add a paragraph of text."""
        self.set_font('Helvetica', '', 11)
        self.set_text_color(55, 65, 81)
        clean_text = self._clean_text(strip_markdown(text))
        self.multi_cell(0, 6, clean_text)
        self.ln(4)
    
    def add_list_item(self, text: str, indent: int = 0):
        """Add a list item."""
        self.set_font('Helvetica', '', 11)
        self.set_text_color(55, 65, 81)
        prefix = "  " * indent + "- "
        clean_text = self._clean_text(strip_markdown(text))
        self.multi_cell(0, 6, prefix + clean_text)
        self.ln(2)
    
    def add_code_block(self, text: str):
        """Add a code block."""
        self.set_font('Courier', '', 9)
        self.set_text_color(0, 0, 0)
        self.set_fill_color(245, 245, 245)
        clean_text = self._clean_text(text)  # Don't strip markdown in code blocks
        self.multi_cell(0, 5, clean_text, fill=True)
        self.ln(4)
    
    def _clean_text(self, text: str) -> str:
        """Clean text for PDF output, handling encoding issues."""
        if not text:
            return ""
        # Replace problematic Unicode characters with ASCII equivalents
        replacements = {
            '\u2019': "'",   # Right single quote
            '\u2018': "'",   # Left single quote
            '\u201c': '"',   # Left double quote
            '\u201d': '"',   # Right double quote
            '\u2013': '-',   # En dash
            '\u2014': '--',  # Em dash
            '\u2026': '...', # Ellipsis
            '\u00a0': ' ',   # Non-breaking space
            '\u2022': '-',   # Bullet
            '\u00b7': '-',   # Middle dot
            '\u2212': '-',   # Minus sign
            '\u2032': "'",   # Prime
            '\u2033': '"',   # Double prime
            '\u00d7': 'x',   # Multiplication sign
            '\u00f7': '/',   # Division sign
            '\u2264': '<=',  # Less than or equal
            '\u2265': '>=',  # Greater than or equal
            '\u2260': '!=',  # Not equal
            '\u221e': 'inf', # Infinity
            '\u03b1': 'alpha',
            '\u03b2': 'beta',
            '\u03b3': 'gamma',
            '\u03bb': 'lambda',
            '\u03c0': 'pi',
            '\u03c3': 'sigma',
            '\u2192': '->',
            '\u2190': '<-',
            '\u21d2': '=>',
            '\u2248': '~',
            '\u00b2': '^2',
            '\u00b3': '^3',
            '\u2081': '_1',
            '\u2082': '_2',
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Remove any remaining non-latin1 characters
        try:
            return text.encode('latin-1', errors='ignore').decode('latin-1')
        except Exception:
            return ''.join(c if ord(c) < 128 else '?' for c in text)


def markdown_to_pdf(markdown_content: str, title: str = "Research Report") -> bytes:
    """
    Convert Markdown content to PDF bytes.
    
    Args:
        markdown_content: The Markdown string to convert.
        title: Title for the PDF document.
    
    Returns:
        PDF file as bytes.
    """
    logger.info("Generating PDF from Markdown")
    
    pdf = ResearchReportPDF()
    pdf.add_title(title)
    
    # Parse and render Markdown
    lines = markdown_content.split('\n')
    in_code_block = False
    code_buffer = []
    paragraph_buffer = []
    
    def flush_paragraph():
        """Flush the paragraph buffer."""
        if paragraph_buffer:
            text = ' '.join(paragraph_buffer)
            pdf.add_paragraph(text)
            paragraph_buffer.clear()
    
    for line in lines:
        stripped = line.strip()
        
        # Handle code blocks
        if stripped.startswith('```'):
            flush_paragraph()
            if in_code_block:
                if code_buffer:
                    pdf.add_code_block('\n'.join(code_buffer))
                    code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
            continue
        
        if in_code_block:
            code_buffer.append(line)
            continue
        
        # Empty line ends paragraph
        if not stripped:
            flush_paragraph()
            continue
        
        # Handle headings
        if stripped.startswith('### '):
            flush_paragraph()
            pdf.add_heading(stripped[4:], level=3)
        elif stripped.startswith('## '):
            flush_paragraph()
            pdf.add_heading(stripped[3:], level=2)
        elif stripped.startswith('# '):
            flush_paragraph()
            pdf.add_heading(stripped[2:], level=1)
        # Handle list items
        elif stripped.startswith('- ') or stripped.startswith('* ') or stripped.startswith('• '):
            flush_paragraph()
            text = stripped[2:] if stripped.startswith('• ') else stripped[2:]
            pdf.add_list_item(text)
        elif re.match(r'^\d+\.\s', stripped):
            flush_paragraph()
            pdf.add_list_item(re.sub(r'^\d+\.\s', '', stripped))
        # Regular text - add to paragraph buffer
        else:
            paragraph_buffer.append(stripped)
    
    # Flush any remaining paragraph
    flush_paragraph()
    
    # Return PDF bytes
    return bytes(pdf.output())
