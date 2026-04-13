import React, { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Button } from "../../components/ui/button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function LabReportCreatePage() {
  usePageTitle("Create Lab Report");
  const { showToast } = useToast();
  const [form, setForm] = useState({
    patient_id: "",
    gender: "",
    doctor_name: "",
    diagnosis: "",
    treatment: "",
    lab_report: "",
    description: "",
    report_type: "Comprehensive Lab Report",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/add_record", form);
      showToast({ title: "Report created", description: "Lab report has been added." });
      setForm({
        patient_id: "",
        gender: "",
        doctor_name: "",
        diagnosis: "",
        treatment: "",
        lab_report: "",
        description: "",
        report_type: "Comprehensive Lab Report",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Create failed",
        description: error.response?.data?.detail || "Unable to create report.",
      });
    }
  };

  return (
    <DashboardLayout variant="lab">
      <Card>
        <CardHeader>
          <CardTitle>Create report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input name="patient_id" value={form.patient_id} onChange={onChange} placeholder="Patient ID" required />
            <Input name="gender" value={form.gender} onChange={onChange} placeholder="Gender" />
            <Input name="doctor_name" value={form.doctor_name} onChange={onChange} placeholder="Doctor name" />
            <Input name="diagnosis" value={form.diagnosis} onChange={onChange} placeholder="Diagnosis" />
            <Input name="treatment" value={form.treatment} onChange={onChange} placeholder="Treatment" />
            <Input name="report_type" value={form.report_type} onChange={onChange} placeholder="Report type" required />
            <Textarea name="lab_report" value={form.lab_report} onChange={onChange} placeholder="Lab report" />
            <Textarea name="description" value={form.description} onChange={onChange} placeholder="Description" required />
            <Button type="submit">Create report</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { LabReportCreatePage };
