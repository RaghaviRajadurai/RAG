import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Button } from "../../components/ui/button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function LabReportCreatePage() {
  usePageTitle("Create Lab Report");
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          apiClient.get("/api/patients"),
          apiClient.get("/api/doctors")
        ]);
        setPatients(patientsRes.data || []);
        setDoctors(doctorsRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handlePatientSelect = (e) => {
    const selectedId = e.target.value;
    const selected = patients.find(p => p.id === selectedId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        patient_id: selectedId,
        gender: selected.gender || "",
        diagnosis: selected.diagnosis || "",
        treatment: selected.prescription || "",
        doctor_name: selected.assigned_doctor_name || ""
      }));
    } else {
      setForm(prev => ({ ...prev, patient_id: "" }));
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) {
      showToast({ variant: "error", title: "Missing Patient", description: "Please select a patient." });
      return;
    }
    try {
      await apiClient.post("/api/add_record", form);
      showToast({ variant: "success", title: "Report created", description: "Lab report has been added." });
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
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Direct Lab Report Entry</CardTitle>
          <CardDescription>Manually create a lab report for a patient if they have a physical prescription.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Select Patient</label>
              <select
                name="patient_id"
                value={form.patient_id}
                onChange={handlePatientSelect}
                className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50"
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.age} {p.gender})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Report Type</label>
                <Input name="report_type" value={form.report_type} onChange={onChange} placeholder="Report type" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Referring Doctor</label>
                <Input name="doctor_name" value={form.doctor_name} onChange={onChange} placeholder="Doctor name" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Diagnosis (if known)</label>
              <Input name="diagnosis" value={form.diagnosis} onChange={onChange} placeholder="Diagnosis" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Lab Results / Data</label>
              <Textarea name="lab_report" value={form.lab_report} onChange={onChange} placeholder="Enter all the lab findings here..." className="h-32" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Additional Remarks / Description</label>
              <Textarea name="description" value={form.description} onChange={onChange} placeholder="Description or summary" required />
            </div>
            
            <Button type="submit">Submit Lab Report</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { LabReportCreatePage };
