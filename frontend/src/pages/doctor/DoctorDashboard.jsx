import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Button } from "../../components/ui/button.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function DoctorDashboard() {
  usePageTitle("Doctor Dashboard");
  const { showToast } = useToast();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Forms state
  const [medicalForm, setMedicalForm] = useState({
    diagnosis: "",
    prescription: ""
  });
  
  const [labForm, setLabForm] = useState({
    report_type: "",
    description: ""
  });
  
  const [patientRecords, setPatientRecords] = useState([]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/patients");
      setPatients(res.data || []);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Unable to fetch patients",
        description: error.response?.data?.detail || "Could not fetch your assigned patients.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setMedicalForm({
      diagnosis: patient.diagnosis || "",
      prescription: patient.prescription || ""
    });
    setLabForm({
      report_type: "",
      description: ""
    });
    setPatientRecords([]);
    
    try {
      const res = await apiClient.get(`/api/records/${patient.id}`);
      setPatientRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load patient lab records", err);
    }
  };

  const handleUpdateMedical = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    try {
      await apiClient.put(`/api/update_patient/${selectedPatient.id}`, {
        diagnosis: medicalForm.diagnosis,
        prescription: medicalForm.prescription
      });
      showToast({
        variant: "success",
        title: "Patient Updated",
        description: "Diagnosis and prescription saved successfully.",
      });
      fetchPatients();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Update failed",
        description: error.response?.data?.detail || "Could not update patient data.",
      });
    }
  };

  const handleAssignLab = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    if (!labForm.report_type || !labForm.description) {
      showToast({
        variant: "error",
        title: "Missing fields",
        description: "Please specify the report type and instructions.",
      });
      return;
    }
    
    try {
      await apiClient.post("/api/add_record", {
        patient_id: selectedPatient.id,
        report_type: labForm.report_type,
        description: labForm.description,
        gender: selectedPatient.gender,
        diagnosis: medicalForm.diagnosis || selectedPatient.diagnosis
      });
      
      showToast({
        variant: "success",
        title: "Lab Request Sent",
        description: "The lab technician has been notified.",
      });
      
      setLabForm({ report_type: "", description: "" });
      
      // Refresh patient records to show the new pending request
      const recordsRes = await apiClient.get(`/api/records/${selectedPatient.id}`);
      setPatientRecords(recordsRes.data || []);
      
    } catch (error) {
      showToast({
        variant: "error",
        title: "Request failed",
        description: error.response?.data?.detail || "Could not send lab request.",
      });
    }
  };

  return (
    <DashboardLayout variant="doctor">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Doctor Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your assigned patients, update diagnosis, and assign lab reports.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Left Column: Patient List */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
            <CardDescription>
              Patients waiting for your consultation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {loading ? (
                <div className="flex justify-center p-4"><Spinner /></div>
              ) : patients.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No patients assigned to you right now.</p>
              ) : (
                <div className="space-y-2">
                  {patients.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPatient?.id === p.id 
                          ? "bg-primary/20 border-primary/50" 
                          : "bg-slate-900/50 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-medium text-slate-200">{p.name}</div>
                      <div className="text-xs text-slate-400 flex justify-between mt-1">
                        <span>Age: {p.age} • {p.gender}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        Reason: {p.diagnosis || "Not specified"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column: Patient Details & Actions */}
        <ScrollArea className="h-[600px] pr-4 rounded-xl">
          <div className="space-y-4 flex flex-col">
            {!selectedPatient ? (
              <Card className="flex-1 flex items-center justify-center bg-slate-900/30 border-dashed min-h-[300px]">
                <p className="text-slate-500">Select a patient from the list to view and manage details.</p>
              </Card>
            ) : (
            <>
              {/* Medical Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultation: {selectedPatient.name}</CardTitle>
                  <CardDescription>
                    Update clinical diagnosis and prescribe medication.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateMedical} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Diagnosis / Disease Found</label>
                      <Textarea 
                        placeholder="Enter the detailed diagnosis..."
                        value={medicalForm.diagnosis}
                        onChange={(e) => setMedicalForm({...medicalForm, diagnosis: e.target.value})}
                        className="h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Prescription & Advice</label>
                      <Textarea 
                        placeholder="Enter medicines, dosage, and advice..."
                        value={medicalForm.prescription}
                        onChange={(e) => setMedicalForm({...medicalForm, prescription: e.target.value})}
                        className="h-24"
                      />
                    </div>
                    <Button type="submit" className="w-full">Save Medical Record</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lab Request Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Assign Lab Test</CardTitle>
                  <CardDescription>
                    Send a request to the lab technician for this patient.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignLab} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Test Type</label>
                      <select 
                        value={labForm.report_type}
                        onChange={(e) => setLabForm({...labForm, report_type: e.target.value})}
                        className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="">-- Select Test --</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="Urine Test">Urine Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="MRI">MRI</option>
                        <option value="CT Scan">CT Scan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Instructions / Description</label>
                      <Textarea 
                        placeholder="Specific instructions for the lab technician..."
                        value={labForm.description}
                        onChange={(e) => setLabForm({...labForm, description: e.target.value})}
                        className="h-16"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full">Send Request to Lab</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Lab Reports Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Lab Records</CardTitle>
                  <CardDescription>
                    History of lab reports for {selectedPatient.name}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patientRecords.length === 0 ? (
                    <p className="text-xs text-slate-400">No lab records found for this patient.</p>
                  ) : (
                    <div className="space-y-3">
                      {patientRecords.map((record, idx) => (
                        <div key={idx} className="p-3 border border-slate-800 rounded-md bg-slate-950/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm text-slate-200">{record.report_type}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                              record.status === "verified" ? "bg-green-500/20 text-green-300" :
                              record.status === "in_review" ? "bg-yellow-500/20 text-yellow-300" :
                              "bg-slate-500/20 text-slate-300"
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-1"><span className="font-medium text-slate-300">Instructions:</span> {record.description}</p>
                          {record.lab_report && (
                            <div className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 border border-slate-800">
                              <span className="font-medium block mb-1 text-slate-200">Results:</span>
                              {record.lab_report}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          </div>
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
}

export { DoctorDashboard };