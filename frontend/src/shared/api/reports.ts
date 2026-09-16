import { axiosClient } from "./axiosClient";

export async function emailAssessmentReport(
  assessmentId: string,
  report: Blob,
  fileName: string,
  reportTitle: string,
  reportDescription: string,
): Promise<void> {
  const formData = new FormData();
  formData.append("report", report, fileName);
  formData.append("reportTitle", reportTitle);
  formData.append("reportDescription", reportDescription);

  await axiosClient.post(`/assessments/${assessmentId}/email-report`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
