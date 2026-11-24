from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import Response, StreamingResponse
from backend.app.services.report_service import report_service
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/download.pdf")
def download_pdf_report():
    """Generates and downloads the comprehensive publication-quality PDF report."""
    try:
        pdf_bytes = report_service.generate_pdf_report()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="ParallelX_CaseStudy7_Technical_Report.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.get("/download.csv")
def download_csv_export():
    """Streams the complete empirical benchmark dataset as CSV from SQLite."""
    csv_content = AnalyticsService.generate_csv_export()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="ParallelX_Benchmarks_Dataset.csv"'
        }
    )

@router.get("/executive-summary")
def get_executive_summary():
    """Returns top-level metadata and executive summary metrics for reports UI."""
    return AnalyticsService.get_summary_stats()
