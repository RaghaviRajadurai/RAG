"""
Report Generator module: Format RAG results into structured medical reports.
Saves reports to disk with timestamps.
"""

import os
from datetime import datetime
from typing import Dict, List


def format_header(title: str, width: int = 40) -> str:
    """Format a report header with borders."""
    padding = (width - len(title)) // 2
    header = "╔" + "═" * width + "╗\n"
    header += "║" + " " * padding + title + " " * (width - padding - len(title)) + "║\n"
    header += "╚" + "═" * width + "╝"
    return header


def format_patient_list(patients: List[Dict]) -> str:
    """Format list of retrieved patients as bullet points."""
    if not patients:
        return "  • No patients retrieved"
    
    formatted = []
    for p in patients:
        line = f"  • {p['name']}: {p['condition']}"
        if p.get('score'):
            line += f" (relevance: {p['score']:.1%})"
        formatted.append(line)
    
    return "\n".join(formatted)


def generate_report(result_dict: Dict) -> str:
    """
    Generate a formatted medical report from RAG result.
    
    Args:
        result_dict: Dictionary returned by RAGEngine.answer()
        
    Returns:
        Formatted report string
    """
    query = result_dict.get('query', 'N/A')
    patients = result_dict.get('retrieved_patients', [])
    prompt = result_dict.get('prompt', '')
    note = result_dict.get('note', '')
    answer = result_dict.get('answer', '')
    retrieved_count = result_dict.get('retrieved_count', 0)
    
    # Build report
    lines = []
    lines.append("")
    lines.append(format_header("HEALTHCARE RAG REPORT", width=50))
    lines.append("")
    
    # Query section
    lines.append("📋 QUERY")
    lines.append("-" * 50)
    lines.append(f"  {query}")
    lines.append("")
    
    # LLM Answer section
    if answer:
        lines.append("🤖 AI ANSWER")
        lines.append("-" * 50)
        lines.append(f"  {answer}")
        lines.append("")
    
    # Matched patients section
    lines.append("👥 MATCHED PATIENTS (via Hybrid Retrieval)")
    lines.append("-" * 50)
    lines.append(format_patient_list(patients))
    lines.append(f"  Total matched: {retrieved_count}")
    lines.append("")
    
    # Status section
    lines.append("⚙️  SYSTEM STATUS")
    lines.append("-" * 50)
    lines.append(f"  {note}")
    lines.append("")
    
    # Context section
    lines.append("📂 RETRIEVED CONTEXT (Top Results for LLM)")
    lines.append("-" * 50)
    lines.append(prompt)
    lines.append("")
    
    # Footer
    lines.append("=" * 50)
    lines.append(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 50)
    
    report = "\n".join(lines)
    return report


def save_report(report_text: str, reports_dir: str = "./reports") -> str:
    """
    Save report to disk with timestamp.
    
    Args:
        report_text: Formatted report string
        reports_dir: Directory to save reports
        
    Returns:
        Path to saved report file
    """
    # Create reports directory if not exists
    os.makedirs(reports_dir, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{timestamp}.txt"
    filepath = os.path.join(reports_dir, filename)
    
    # Save report
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\n💾 Report saved to: {filepath}")
        return filepath
    except Exception as e:
        print(f"\n⚠️  Failed to save report: {e}")
        return None


def print_report(report_text: str):
    """Print formatted report to console."""
    print(report_text)


def generate_and_save_report(
    result_dict: Dict,
    save_to_disk: bool = True,
    reports_dir: str = "./reports"
) -> str:
    """
    Generate report from RAG result and optionally save to disk.
    
    Args:
        result_dict: Dictionary returned by RAGEngine.answer()
        save_to_disk: Whether to save the report to disk
        reports_dir: Directory where reports should be saved
        
    Returns:
        Formatted report string
    """
    report = generate_report(result_dict)
    
    # Print to console
    print_report(report)
    
    # Save to disk if requested
    if save_to_disk:
        save_report(report, reports_dir=reports_dir)
    
    return report


if __name__ == "__main__":
    # Test report generator
    sample_result = {
        "query": "Which patients have diabetes?",
        "retrieved_patients": [
            {"name": "Priya Sharma", "condition": "Type 2 Diabetes", "score": 0.95},
            {"name": "Divakar Reddy", "condition": "Type 2 Diabetes with Neuropathy", "score": 0.87},
        ],
        "retrieved_count": 2,
        "prompt_ready": True,
        "prompt": "Sample prompt here...",
        "note": "RAG context ready. LLM API not connected.",
    }
    
    report = generate_report(sample_result)
    print_report(report)
