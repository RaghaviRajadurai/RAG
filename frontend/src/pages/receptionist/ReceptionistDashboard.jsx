import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function ReceptionistDashboard() {
  usePageTitle("Receptionist Dashboard");
  const { showToast } = useToast();
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    diagnosis: "",
    prescription: "",
    assigned_doctor_id: "",
    assigned_doctor_name: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get("/api/patients"),
        apiClient.get("/api/doctors")
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Failed to load data",
        description: error.response?.data?.detail || "Could not fetch data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "assigned_doctor_id") {
      const selectedDoctor = doctors.find(doc => doc.id === value);
      setFormData(prev => ({
        ...prev,
        assigned_doctor_id: value,
        assigned_doctor_name: selectedDoctor ? selectedDoctor.username : ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.gender || !formData.diagnosis || !formData.assigned_doctor_id) {
      showToast({
        variant: "error",
        title: "Missing Fields",
        description: "Please fill in all required fields, including assigning a doctor.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/add_patient", {
        name: formData.name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription || "Pending",
        assigned_doctor_id: formData.assigned_doctor_id,
        assigned_doctor_name: formData.assigned_doctor_name
      });
      
      showToast({
        variant: "success",
        title: "Patient Created",
        description: "New patient profile successfully created and assigned to doctor.",
      });
      
      setFormData({
        name: "",
        age: "",
        gender: "",
        diagnosis: "",
        prescription: "",
        assigned_doctor_id: "",
        assigned_doctor_name: ""
      });
      
      fetchData(); // Refresh patient list
    } catch (error) {
      showToast({
        variant: "error",
        title: "Creation Failed",
        description: error.response?.data?.detail || "Could not create patient.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout variant="receptionist">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Receptionist Desk
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Register new patients and assign them to doctors.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Register New Patient</CardTitle>
            <CardDescription>
              Create a new profile and assign a doctor immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Patient Name"
                  />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Reason for Visit / Initial Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="e.g., Fever, General Checkup"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Assign Doctor</label>
                <select
                  name="assigned_doctor_id"
                  value={formData.assigned_doctor_id}
                  onChange={handleInputChange}
                  className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="">-- Select a Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.username.split('@')[0].replace('.', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Registering..." : "Register & Assign Patient"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>
              List of all registered patients in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : patients.length > 0 ? (
                <ul className="space-y-4 text-xs text-slate-300">
                  {patients.slice().reverse().map((patient, idx) => (
                    <li key={idx} className="flex flex-col gap-1 border-b border-slate-800/50 pb-3 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-50">{patient.name}</span>
                        <span className="text-slate-500">Age: {patient.age} | {patient.gender}</span>
                      </div>
                      <span className="text-slate-400">Condition: {patient.diagnosis}</span>
                      {patient.assigned_doctor_name && (
                        <span className="text-blue-400 font-medium">Assigned to: Dr. {patient.assigned_doctor_name.split('@')[0].replace('.', ' ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 mt-4">No patients registered yet.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export { ReceptionistDashboard };