import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUserMd,
  FaStethoscope,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaCalendarTimes,
  FaExternalLinkAlt,
  FaNotesMedical,
  FaUsers,
  FaCalendarDay,
  FaCreditCard,
  FaMoneyBillWave,
  FaLock,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaStepBackward,
  FaStepForward,
  FaPrescription,
  FaFlask,
  FaFileMedical,
  FaPills,
  FaFilePdf,
  FaPrint,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaShare,
  FaHeartbeat,
  FaVial,
  FaXRay,
  FaBrain,
  FaHeart,
  FaLungs,
  FaProcedures
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../assets/css/MyAppointments.css";
import { loadStripe } from "@stripe/stripe-js";

// Import du composant calendrier pour les médecins
import DoctorCalendar from "./DoctorCalendar";

// Initialiser Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorView, setDoctorView] = useState("calendar");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumbers, setPageNumbers] = useState([]);
  
  // États pour les prescriptions et examens médicaux
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalExams, setMedicalExams] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments"); // "appointments", "prescriptions", "exams"
  
  // États pour les modals
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] = useState(false);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  
  // États pour créer une nouvelle prescription
  const [newPrescription, setNewPrescription] = useState({
    appointmentId: "",
    diagnosis: "",
    medications: [{
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 1
    }],
    medicalAdvice: "",
    recommendations: ""
  });
  
  // États pour créer un nouvel examen
  const [newExam, setNewExam] = useState({
    appointmentId: "",
    examType: "BLOOD_TEST",
    examTypeLabel: "",
    reason: "",
    instructions: "",
    priority: "NORMAL",
    preparationNeeded: "",
    fastingRequired: false,
    fastingDuration: "",
    labName: "",
    labAddress: ""
  });

  // États pour les données par rendez-vous
  const [appointmentDetails, setAppointmentDetails] = useState({});

  const API_BASE_URL = "http://localhost:5000/api";

  // Configuration de la pagination
  useEffect(() => {
    const calculatePagination = () => {
      const filtered = appointments.filter(appointment => {
        const now = new Date();
        const appointmentDate = new Date(appointment.startDateTime);
        
        switch (filter) {
          case "upcoming":
            return appointmentDate > now && appointment.status !== "CANCELLED";
          case "past":
            return appointmentDate < now;
          case "REQUESTED":
            return appointment.status === "REQUESTED";
          case "CONFIRMED":
            return appointment.status === "CONFIRMED";
          case "CANCELLED":
            return appointment.status === "CANCELLED";
          case "COMPLETED":
            return appointment.status === "COMPLETED";
          default:
            return true;
        }
      });
      
      const total = filtered.length;
      const pages = Math.ceil(total / itemsPerPage);
      setTotalPages(pages);
      
      // Ajuster la page courante si nécessaire
      if (currentPage > pages && pages > 0) {
        setCurrentPage(1);
      }
      
      // Générer les numéros de page à afficher
      const maxPagesToShow = 5;
      let startPage, endPage;
      
      if (pages <= maxPagesToShow) {
        startPage = 1;
        endPage = pages;
      } else {
        const halfMaxPages = Math.floor(maxPagesToShow / 2);
        if (currentPage <= halfMaxPages + 1) {
          startPage = 1;
          endPage = maxPagesToShow;
        } else if (currentPage >= pages - halfMaxPages) {
          startPage = pages - maxPagesToShow + 1;
          endPage = pages;
        } else {
          startPage = currentPage - halfMaxPages;
          endPage = currentPage + halfMaxPages;
        }
      }
      
      const pageArray = [];
      for (let i = startPage; i <= endPage; i++) {
        pageArray.push(i);
      }
      setPageNumbers(pageArray);
    };
    
    calculatePagination();
  }, [appointments, filter, currentPage, itemsPerPage]);

  // Filtrer et paginer les rendez-vous
  const getPaginatedAppointments = () => {
    const filtered = appointments.filter(appointment => {
      const now = new Date();
      const appointmentDate = new Date(appointment.startDateTime);
      
      switch (filter) {
        case "upcoming":
          return appointmentDate > now && appointment.status !== "CANCELLED";
        case "past":
          return appointmentDate < now;
        case "REQUESTED":
          return appointment.status === "REQUESTED";
        case "CONFIRMED":
          return appointment.status === "CONFIRMED";
        case "CANCELLED":
          return appointment.status === "CANCELLED";
        case "COMPLETED":
          return appointment.status === "COMPLETED";
        default:
          return true;
      }
    });
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  };

  // Récupérer toutes les prescriptions de l'utilisateur
  const fetchAllPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const token = localStorage.getItem("token");
      console.log("Fetching all prescriptions...");
      
      const response = await fetch(`${API_BASE_URL}/prescriptions/my-prescriptions`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log(`All prescriptions response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("All prescriptions data:", data);
        if (data.success) {
          setPrescriptions(data.data || []);
        } else {
          console.error("API returned success false:", data.message);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error fetching all prescriptions:", errorData);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorData.message || 'Impossible de charger vos prescriptions.',
        });
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger vos prescriptions.',
      });
    } finally {
      setLoadingPrescriptions(false);
    }
  };
 // Récupérer les prescriptions d'un rendez-vous spécifique
const fetchPrescriptionsByAppointment = async (appointmentId) => {
  try {
    console.log(`Fetching prescriptions for appointment: ${appointmentId}`);
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_BASE_URL}/prescriptions/appointment/${appointmentId}/prescriptions`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log(`Response status for prescriptions: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Prescriptions data received:", data);
      if (data.success) {
        return data.data || [];
      }
    } else {
      // Voir l'erreur détaillée
      try {
        const errorData = await response.json();
        console.error("Error response:", errorData);
      } catch (e) {
        console.error("Could not parse error response");
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching appointment prescriptions:", error);
    return [];
  }
};

  // Récupérer tous les examens de l'utilisateur
  const fetchAllMedicalExams = async () => {
    try {
      setLoadingExams(true);
      const token = localStorage.getItem("token");
      console.log("Fetching all medical exams...");
      
      const response = await fetch(`${API_BASE_URL}/medicalexams/my-exams`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log(`All medical exams response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("All medical exams data:", data);
        if (data.success) {
          setMedicalExams(data.data || []);
        } else {
          console.error("API returned success false:", data.message);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error fetching all medical exams:", errorData);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorData.message || 'Impossible de charger vos examens médicaux.',
        });
      }
    } catch (error) {
      console.error("Error fetching medical exams:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger vos examens médicaux.',
      });
    } finally {
      setLoadingExams(false);
    }
  };

  // Récupérer les examens d'un rendez-vous spécifique
  const fetchExamsByAppointment = async (appointmentId) => {
    try {
      console.log(`Fetching exams for appointment: ${appointmentId}`);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/medicalexams/appointment/${appointmentId}/exams`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log(`Response status for exams: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Exams data received:", data);
        if (data.success) {
          return data.data || [];
        }
      } else {
        // Voir l'erreur détaillée
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
        } catch (e) {
          console.error("Could not parse error response");
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching appointment exams:", error);
      return [];
    }
  };
  // Charger les détails d'un rendez-vous (prescriptions + examens)
  const loadAppointmentDetails = async (appointmentId) => {
    try {
      const [prescriptions, exams] = await Promise.all([
        fetchPrescriptionsByAppointment(appointmentId),
        fetchExamsByAppointment(appointmentId)
      ]);
      
      setAppointmentDetails(prev => ({
        ...prev,
        [appointmentId]: { prescriptions, exams }
      }));
      
      return { prescriptions, exams };
    } catch (error) {
      console.error("Error loading appointment details:", error);
      return { prescriptions: [], exams: [] };
    }
  };

  // Télécharger une prescription en PDF
// Télécharger une prescription en PDF
const downloadPrescription = async (prescriptionId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez vous reconnecter',
      });
      return;
    }
    
    // Utiliser la nouvelle route avec token dans l'URL
    const url = `${API_BASE_URL}/prescriptions/${prescriptionId}/download/${encodeURIComponent(token)}`;
    console.log("Download URL:", url);
    
    // Essayer d'ouvrir dans un nouvel onglet
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Si bloqué par le navigateur, utiliser fetch et créer un blob
      Swal.fire({
        title: 'Téléchargement',
        text: 'Préparation du téléchargement...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `ordonnance-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        Swal.close();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors du téléchargement');
      }
    }
  } catch (error) {
    console.error("Error downloading prescription:", error);
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.message || 'Impossible de télécharger la prescription.',
    });
  }
};

// Télécharger une demande d'examen en PDF
const downloadExamRequest = async (examId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez vous reconnecter',
      });
      return;
    }
    
    // Utiliser la nouvelle route avec token dans l'URL
    const url = `${API_BASE_URL}/medicalexams/${examId}/download/${encodeURIComponent(token)}`;
    console.log("Download URL:", url);
    
    // Essayer d'ouvrir dans un nouvel onglet
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Si bloqué par le navigateur, utiliser fetch et créer un blob
      Swal.fire({
        title: 'Téléchargement',
        text: 'Préparation du téléchargement...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `demande-examen-${examId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        Swal.close();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors du téléchargement');
      }
    }
  } catch (error) {
    console.error("Error downloading exam request:", error);
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.message || 'Impossible de télécharger la demande d\'examen.',
    });
  }
};


  // Télécharger les résultats d'examen
  const downloadExamResults = async (examId, resultId) => {
    try {
      const token = localStorage.getItem("token");
      window.open(`${API_BASE_URL}/medicalexams/${examId}/results/${resultId}/download`, '_blank');
    } catch (error) {
      console.error("Error downloading exam results:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de télécharger les résultats.',
      });
    }
  };

  // Créer une nouvelle prescription (pour médecin)
  const handleCreatePrescription = async () => {
    try {
      if (!newPrescription.appointmentId) {
        throw new Error("Aucun rendez-vous sélectionné");
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/prescriptions/appointment/${newPrescription.appointmentId}/prescription`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPrescription),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Prescription créée",
          text: "La prescription a été créée avec succès.",
        });
        setShowNewPrescriptionModal(false);
        setNewPrescription({
          appointmentId: "",
          diagnosis: "",
          medications: [{
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            quantity: 1
          }],
          medicalAdvice: "",
          recommendations: ""
        });
        
        // Recharger les prescriptions et mettre à jour les détails
        await loadAppointmentDetails(newPrescription.appointmentId);
        await fetchAllPrescriptions();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
    }
  };

  // Créer un nouvel examen (pour médecin)
  const handleCreateExam = async () => {
    try {
      if (!newExam.appointmentId) {
        throw new Error("Aucun rendez-vous sélectionné");
      }

      // Vérifier que l'examTypeLabel est défini
      if (!newExam.examTypeLabel) {
        const examTypeLabels = {
          "BLOOD_TEST": "Analyse sanguine",
          "URINE_TEST": "Analyse d'urine",
          "X_RAY": "Radiographie",
          "CT_SCAN": "Scanner",
          "MRI": "IRM",
          "ULTRASOUND": "Échographie",
          "ECG": "Électrocardiogramme",
          "EEG": "Électroencéphalogramme",
          "OTHER": "Autre examen"
        };
        
        setNewExam(prev => ({
          ...prev,
          examTypeLabel: examTypeLabels[prev.examType] || "Examen médical"
        }));
      }
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/medicalexams/appointment/${newExam.appointmentId}/exam`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExam),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Examen créé",
          text: "La demande d'examen a été créée avec succès.",
        });
        setShowNewExamModal(false);
        setNewExam({
          appointmentId: "",
          examType: "BLOOD_TEST",
          examTypeLabel: "",
          reason: "",
          instructions: "",
          priority: "NORMAL",
          preparationNeeded: "",
          fastingRequired: false,
          fastingDuration: "",
          labName: "",
          labAddress: ""
        });
        
        // Recharger les examens et mettre à jour les détails
        await loadAppointmentDetails(newExam.appointmentId);
        await fetchAllMedicalExams();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message || "Erreur lors de la création de l'examen",
      });
    }
  };

  // Signer une prescription (pour médecin)
  const handleSignPrescription = async (prescriptionId, appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/sign`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Prescription signée",
          text: "La prescription a été signée avec succès.",
        });
        // Recharger les prescriptions
        await loadAppointmentDetails(appointmentId);
        await fetchAllPrescriptions();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error signing prescription:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
    }
  };

  // Marquer un examen comme terminé
  const handleCompleteExam = async (examId, appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/medicalexams/${examId}/review`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments: "Examen revoyé par le médecin" }),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Examen terminé",
          text: "L'examen a été marqué comme terminé.",
        });
        // Recharger les examens
        await loadAppointmentDetails(appointmentId);
        await fetchAllMedicalExams();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error completing exam:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
    }
  };

  // Ajouter un médicament à la nouvelle prescription
  const addMedication = () => {
    setNewPrescription({
      ...newPrescription,
      medications: [
        ...newPrescription.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: 1
        }
      ]
    });
  };

  // Supprimer un médicament
  const removeMedication = (index) => {
    const newMedications = [...newPrescription.medications];
    newMedications.splice(index, 1);
    setNewPrescription({
      ...newPrescription,
      medications: newMedications
    });
  };

  // Ouvrir la modal de création de prescription
  const openNewPrescriptionModal = (appointmentId) => {
    setNewPrescription({
      ...newPrescription,
      appointmentId
    });
    setShowNewPrescriptionModal(true);
  };

  // Ouvrir la modal de création d'examen
  const openNewExamModal = (appointmentId) => {
    setNewExam({
      ...newExam,
      appointmentId
    });
    setShowNewExamModal(true);
  };

  // Obtenir l'icône pour le type d'examen
  const getExamTypeIcon = (examType) => {
    switch (examType) {
      case "BLOOD_TEST":
        return <FaVial />;
      case "URINE_TEST":
        return <FaVial />;
      case "X_RAY":
        return <FaXRay />;
      case "CT_SCAN":
        return <FaBrain />;
      case "MRI":
        return <FaBrain />;
      case "ULTRASOUND":
        return <FaProcedures />;
      case "ECG":
        return <FaHeart />;
      case "EEG":
        return <FaBrain />;
      default:
        return <FaFlask />;
    }
  };

  // Obtenir la couleur pour le statut
  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "#f39c12";
      case "SIGNED":
        return "#27ae60";
      case "SENT":
        return "#3498db";
      case "EXPIRED":
        return "#e74c3c";
      case "REQUESTED":
        return "#f39c12";
      case "SCHEDULED":
        return "#3498db";
      case "COMPLETED":
        return "#27ae60";
      case "RESULTS_UPLOADED":
        return "#9b59b6";
      case "REVIEWED":
        return "#2ecc71";
      default:
        return "#7f8c8d";
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case "DRAFT":
        return "Brouillon";
      case "SIGNED":
        return "Signée";
      case "SENT":
        return "Envoyée";
      case "EXPIRED":
        return "Expirée";
      case "REQUESTED":
        return "Demandé";
      case "SCHEDULED":
        return "Programmé";
      case "COMPLETED":
        return "Terminé";
      case "RESULTS_UPLOADED":
        return "Résultats uploadés";
      case "REVIEWED":
        return "Revoir";
      default:
        return status;
    }
  };

  // Changer de page
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll vers le haut de la liste
      const container = document.querySelector('.appointments-list');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Aller à la première page
  const goToFirstPage = () => handlePageChange(1);
  
  // Aller à la dernière page
  const goToLastPage = () => handlePageChange(totalPages);
  
  // Aller à la page précédente
  const goToPrevPage = () => handlePageChange(currentPage - 1);
  
  // Aller à la page suivante
  const goToNextPage = () => handlePageChange(currentPage + 1);

  // Changer le nombre d'éléments par page
  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Retourner à la première page
  };

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("User from localStorage:", user);
        const role = user.role || user.Role || "";
        setUserRole(role);
        
        const isDoctorUser = role === "DOCTOR" || role === "doctor" || role === "médecin";
        setIsDoctor(isDoctorUser);
        console.log("User role detected:", role, "isDoctor:", isDoctorUser);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // Fonction pour tester la connexion API
  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/appointments/test`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      console.log("API Test response:", data);
      
      if (response.ok) {
        console.log("✅ API test successful!");
        console.log("User data from backend:", data.user);
      } else {
        console.log("❌ API test failed:", data);
      }
    } catch (error) {
      console.error("Test API error:", error);
    }
  };

  // Récupérer les rendez-vous
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Veuillez vous connecter pour voir vos rendez-vous");
          setLoading(false);
          return;
        }

        console.log("Fetching appointments with token...");
        
        await testApiConnection();

        const response = await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("API Response status:", response.status);
        
        if (!response.ok) {
          let errorMessage = `Erreur ${response.status} lors du chargement des rendez-vous`;
          
          try {
            const errorData = await response.json();
            console.log("Error data from backend:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.log("Could not parse error response");
          }
          
          if (response.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => {
              window.location.href = "/signin";
            }, 2000);
            return;
          } else if (response.status === 400) {
            setError(`Erreur de requête: ${errorMessage}. Veuillez vérifier votre configuration.`);
          } else {
            setError(errorMessage);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Appointments data received:", data);
        
        if (data.success) {
          const appointmentsData = data.data || [];
          console.log("Appointments count:", appointmentsData.length);
          
          const sortedAppointments = appointmentsData.sort((a, b) => {
            return new Date(b.startDateTime) - new Date(a.startDateTime);
          });
          
          setAppointments(sortedAppointments);
          
          // Charger les détails pour les rendez-vous terminés
          const completedAppointments = sortedAppointments.filter(app => app.status === "COMPLETED");
          for (const appointment of completedAppointments) {
            await loadAppointmentDetails(appointment._id);
          }
          
          console.log("Appointments loaded successfully:", sortedAppointments);
        } else {
          throw new Error(data.message || "Erreur inconnue du serveur");
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des rendez-vous");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Charger les prescriptions et examens quand on change d'onglet
  useEffect(() => {
    if (activeTab === "prescriptions") {
      fetchAllPrescriptions();
    } else if (activeTab === "exams") {
      fetchAllMedicalExams();
    }
  }, [activeTab]);

  // Formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Heure invalide";
    }
  };

  // Calculer la durée
  const calculateDuration = (start, end) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
      return `${durationMinutes} min`;
    } catch (error) {
      return "Durée invalide";
    }
  };

  // Obtenir le statut avec icône
  const getStatusInfo = (status) => {
    switch (status) {
      case "REQUESTED":
        return {
          text: "Demandé",
          icon: <FaHourglassHalf />,
          color: "#f39c12",
          bgColor: "#fef5e6"
        };
      case "CONFIRMED":
        return {
          text: "Confirmé",
          icon: <FaCheckCircle />,
          color: "#27ae60",
          bgColor: "#eafaf1"
        };
      case "CANCELLED":
        return {
          text: "Annulé",
          icon: <FaTimesCircle />,
          color: "#e74c3c",
          bgColor: "#fdedec"
        };
      case "COMPLETED":
        return {
          text: "Terminé",
          icon: <FaCalendarCheck />,
          color: "#3498db",
          bgColor: "#eaf2f8"
        };
      default:
        return {
          text: status || "Inconnu",
          icon: <FaInfoCircle />,
          color: "#7f8c8d",
          bgColor: "#f4f6f6"
        };
    }
  };

  // Obtenir le statut de paiement avec icône
  const getPaymentStatusInfo = (paymentStatus) => {
    switch (paymentStatus) {
      case "PAID":
        return {
          text: "Payé",
          icon: <FaCheckCircle />,
          color: "#27ae60",
          bgColor: "#eafaf1"
        };
      case "PENDING":
        return {
          text: "En attente",
          icon: <FaHourglassHalf />,
          color: "#f39c12",
          bgColor: "#fef5e6"
        };
      case "FAILED":
        return {
          text: "Échoué",
          icon: <FaTimesCircle />,
          color: "#e74c3c",
          bgColor: "#fdedec"
        };
      case "REFUNDED":
        return {
          text: "Remboursé",
          icon: <FaMoneyBillWave />,
          color: "#3498db",
          bgColor: "#eaf2f8"
        };
      default:
        return {
          text: "Non payé",
          icon: <FaTimesCircle />,
          color: "#7f8c8d",
          bgColor: "#f4f6f6"
        };
    }
  };

  // Fonction pour consulter le profil
  const viewProfile = (userId) => {
    window.location.href = `/profile/${userId}`;
  };

  // Annuler un rendez-vous
  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancelling(true);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { ...app, status: "CANCELLED" } : app
        ));
        setShowCancelModal(false);
        setSelectedAppointment(null);
        
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous annulé',
          text: 'Le rendez-vous a été annulé avec succès.',
          confirmButtonColor: '#27ae60',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de l'annulation");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de l'annulation: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Confirmer un rendez-vous (pour médecin)
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { 
            ...app, 
            status: "CONFIRMED",
            amount: data.amount || app.amount,
            paymentStatus: "PENDING"
          } : app
        ));
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous confirmé',
          text: data.message || 'Le rendez-vous a été confirmé avec succès. Le patient doit maintenant effectuer le paiement.',
          confirmButtonColor: '#27ae60',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de la confirmation");
      }
    } catch (err) {
      console.error("Error confirming appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de la confirmation: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  // Marquer comme terminé (pour médecin) - MODIFIÉ pour charger les détails
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Charger les détails du rendez-vous (prescriptions et examens)
        const details = await loadAppointmentDetails(appointmentId);
        
        // Mettre à jour l'état
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { 
            ...app, 
            status: "COMPLETED"
          } : app
        ));
        
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous terminé',
          text: 'Le rendez-vous a été marqué comme terminé. Vous pouvez maintenant créer des prescriptions et examens.',
          confirmButtonColor: '#3498db',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de la complétion");
      }
    } catch (err) {
      console.error("Error completing appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de la complétion: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  // Ouvrir la modal d'annulation
  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Ouvrir la modal de paiement
  const openPaymentModal = (appointment) => {
    setSelectedPaymentAppointment(appointment);
    setShowPaymentModal(true);
  };

  // Vérifier si un rendez-vous peut être annulé
  const canCancelAppointment = (appointment) => {
    try {
      const appointmentDate = new Date(appointment.startDateTime);
      const now = new Date();
      const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
      
      return appointment.status === "REQUESTED" || 
             (appointment.status === "CONFIRMED" && hoursDifference > 24);
    } catch (error) {
      return false;
    }
  };

  // Vérifier si le paiement est requis
  const requiresPayment = (appointment) => {
    return appointment.status === "CONFIRMED" && 
           appointment.paymentStatus !== "PAID" &&
           new Date(appointment.startDateTime) > new Date();
  };

  // Fonction pour rejoindre la consultation avec vérification de paiement
  const handleJoinConsultation = async (appointment) => {
    try {
      const token = localStorage.getItem("token");
      
      // Vérifier l'accès à la salle
      const response = await fetch(`${API_BASE_URL}/appointments/room/${appointment.videoRoomId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.allowed) {
        window.location.href = `/video/${appointment.videoRoomId}`;
      } else {
        // Si le paiement est requis
        if (data.requiresPayment) {
          Swal.fire({
            title: 'Paiement requis',
            html: `
              <p>Vous devez effectuer le paiement avant d'accéder à la consultation.</p>
              <p><strong>Montant:</strong> ${data.amount} DT</p>
              <p><strong>Statut:</strong> ${data.paymentStatus || "Non payé"}</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Procéder au paiement',
            cancelButtonText: 'Plus tard',
          }).then((result) => {
            if (result.isConfirmed) {
              // Ouvrir la modal de paiement
              openPaymentModal(appointment);
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Accès refusé',
            text: data.message || 'Vous ne pouvez pas accéder à cette consultation.',
          });
        }
      }
    } catch (error) {
      console.error("Error checking room access:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de vérifier l\'accès à la consultation.',
      });
    }
  };

  // Effectuer un paiement par carte
  const handleCardPayment = async () => {
    try {
      setPaymentProcessing(true);
      const token = localStorage.getItem("token");
      
      // Créer la session Stripe
      const response = await fetch(`${API_BASE_URL}/payments/stripe/${selectedPaymentAppointment._id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Nouvelle méthode: utiliser window.location pour la redirection
        if (data.data.sessionUrl) {
          // Si le backend renvoie une URL directe
          window.location.href = data.data.sessionUrl;
        } else if (data.data.sessionId) {
          // Sinon construire l'URL de checkout Stripe
          const stripe = await stripePromise;
          
          // Nouvelle méthode avec redirectToCheckout
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.data.sessionId,
          });

          if (error) {
            // Fallback: redirection manuelle
            window.location.href = `https://checkout.stripe.com/c/pay/${data.data.sessionId}`;
          }
        } else {
          throw new Error("Aucune information de session reçue");
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error initiating card payment:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
      setPaymentProcessing(false);
    }
  };
  
  // Effectuer un paiement mobile money
  const handleMobileMoneyPayment = async (provider) => {
    try {
      setPaymentProcessing(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/payments/mobile-money/${selectedPaymentAppointment._id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "info",
          title: "Instructions de paiement",
          html: `
            <div style="text-align: left;">
              <p><strong>Montant:</strong> ${data.data.amount} DT</p>
              <p><strong>Instructions:</strong></p>
              <p>${data.data.instructions}</p>
              <p>Après avoir effectué le paiement, cliquez sur le bouton ci-dessous pour vérifier.</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "J'ai payé, vérifier",
          cancelButtonText: "Annuler",
        }).then((result) => {
          if (result.isConfirmed) {
            verifyPayment(data.data.paymentId);
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error initiating mobile money payment:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Vérifier le paiement
  const verifyPayment = async (paymentId) => {
    try {
      setPaymentProcessing(true);
      
      setTimeout(async () => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/payments/status/${selectedPaymentAppointment._id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data.appointment.paymentStatus === "PAID") {
            setAppointments(prev => prev.map(app => 
              app._id === selectedPaymentAppointment._id ? { 
                ...app, 
                paymentStatus: "PAID" 
              } : app
            ));
            
            setShowPaymentModal(false);
            setSelectedPaymentAppointment(null);
            
            Swal.fire({
              icon: "success",
              title: "Paiement confirmé!",
              text: "Votre paiement a été confirmé avec succès.",
              confirmButtonText: "Accéder à la consultation",
            }).then(() => {
              window.location.href = `/video/${data.data.appointment.videoRoomId}`;
            });
          } else {
            Swal.fire({
              icon: "warning",
              title: "Paiement en attente",
              text: "Votre paiement n'a pas encore été confirmé. Veuillez réessayer dans quelques minutes.",
            });
          }
        }
        setPaymentProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Error verifying payment:", error);
      setPaymentProcessing(false);
    }
  };

  // Obtenir les statistiques
  const getStats = () => {
    const now = new Date();
    return {
      total: appointments.length,
      upcoming: appointments.filter(a => {
        try {
          return new Date(a.startDateTime) > now && a.status !== "CANCELLED";
        } catch {
          return false;
        }
      }).length,
      requested: appointments.filter(a => a.status === "REQUESTED").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      pendingPayment: appointments.filter(a => requiresPayment(a)).length
    };
  };

  // Déterminer si l'utilisateur est un médecin
  const checkIsDoctor = () => {
    return userRole === "DOCTOR" || userRole === "doctor" || isDoctor;
  };

  // Obtenir le nombre total d'éléments filtrés
  const getFilteredCount = () => {
    const now = new Date();
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDateTime);
      
      switch (filter) {
        case "upcoming":
          return appointmentDate > now && appointment.status !== "CANCELLED";
        case "past":
          return appointmentDate < now;
        case "REQUESTED":
          return appointment.status === "REQUESTED";
        case "CONFIRMED":
          return appointment.status === "CONFIRMED";
        case "CANCELLED":
          return appointment.status === "CANCELLED";
        case "COMPLETED":
          return appointment.status === "COMPLETED";
        default:
          return true;
      }
    }).length;
  };

  // Afficher les données médicales d'un rendez-vous
  const renderAppointmentMedicalData = (appointmentId) => {
    const details = appointmentDetails[appointmentId];
    if (!details || (!details.prescriptions?.length && !details.exams?.length)) {
      return null;
    }
    
  
  };

  // Charger les détails d'un rendez-vous au clic
  const handleLoadAppointmentDetails = async (appointmentId) => {
    if (!appointmentDetails[appointmentId]) {
      await loadAppointmentDetails(appointmentId);
    }
  };

  if (loading) {
    return (
      <div className="my-appointments-container loading">
        <div className="spinner"></div>
        <p>Chargement de vos rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-appointments-container error">
        <div className="error-content">
          <FaExclamationTriangle size={48} />
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
            {!checkIsDoctor() && (
              <button 
                className="btn-secondary"
                onClick={() => window.location.href = "/doctors"}
              >
                Prendre un rendez-vous
              </button>
            )}
            <button 
              className="btn-secondary"
              onClick={testApiConnection}
            >
              Tester la connexion API
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si c'est un médecin, afficher l'interface médecin
  if (checkIsDoctor()) {
    const stats = getStats();
    const paginatedAppointments = getPaginatedAppointments();

    return (
      <div className="my-appointments-container">
        <div className="appointments-header">
          <h1>
            <FaCalendarAlt /> Mes Rendez-vous - Médecin
          </h1>
          <p className="subtitle">
            Gérez votre calendrier de consultations
          </p>
        </div>

        {/* Boutons de vue pour médecin */}
        <div className="doctor-view-switcher">
          <button 
            className={`view-switch-btn ${doctorView === "calendar" ? "active" : ""}`}
            onClick={() => setDoctorView("calendar")}
          >
            <FaCalendarDay /> Calendrier
          </button>
          <button 
            className={`view-switch-btn ${doctorView === "list" ? "active" : ""}`}
            onClick={() => setDoctorView("list")}
          >
            <FaUsers /> Liste
          </button>
        </div>

        {/* Statistiques pour médecin */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>Total</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon upcoming">
              <FaClock />
            </div>
            <div className="stat-info">
              <h3>À venir</h3>
              <p className="stat-number">{stats.upcoming}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon requested">
              <FaHourglassHalf />
            </div>
            <div className="stat-info">
              <h3>Demandés</h3>
              <p className="stat-number">{stats.requested}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon confirmed">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>Confirmés</h3>
              <p className="stat-number">{stats.confirmed}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <FaCalendarCheck />
            </div>
            <div className="stat-info">
              <h3>Terminés</h3>
              <p className="stat-number">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Affichage selon la vue sélectionnée */}
        {doctorView === "calendar" ? (
          <DoctorCalendar appointments={appointments} />
        ) : (
          // Vue liste pour médecin
          <>
            <div className="filters-section-myappointments">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => {setFilter("all"); setCurrentPage(1);}}
                >
                  Tous
                </button>
                <button 
                  className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
                  onClick={() => {setFilter("upcoming"); setCurrentPage(1);}}
                >
                  À venir
                </button>
                <button 
                  className={`filter-btn ${filter === "REQUESTED" ? "active" : ""}`}
                  onClick={() => {setFilter("REQUESTED"); setCurrentPage(1);}}
                >
                  Demandés
                </button>
                <button 
                  className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
                  onClick={() => {setFilter("CONFIRMED"); setCurrentPage(1);}}
                >
                  Confirmés
                </button>
                <button 
                  className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
                  onClick={() => {setFilter("COMPLETED"); setCurrentPage(1);}}
                >
                  Terminés
                </button>
              </div>
              
              <div className="filter-info">
                <span className="filter-count">
                  {getFilteredCount()} rendez-vous
                </span>
                {filter !== "all" && (
                  <button 
                    className="clear-filter"
                    onClick={() => {setFilter("all"); setCurrentPage(1);}}
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>
            </div>

            {/* Contrôles de pagination - EN HAUT */}
            <div className="pagination-controls top">
              <div className="pagination-info">
                <span>
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, getFilteredCount())} sur {getFilteredCount()} rendez-vous
                </span>
              </div>
              <div className="pagination-select">
                <label htmlFor="itemsPerPage">Rendez-vous par page:</label>
                <select 
                  id="itemsPerPage" 
                  value={itemsPerPage} 
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            {/* Liste des rendez-vous pour médecin */}
            {paginatedAppointments.length === 0 ? (
              <div className="no-appointments">
                <FaCalendarAlt size={64} />
                <h3>Aucun rendez-vous trouvé</h3>
                <p>
                  {appointments.length === 0 
                    ? "Vous n'avez pas encore de rendez-vous."
                    : `Aucun rendez-vous ne correspond au filtre "${filter}".`}
                </p>
              </div>
            ) : (
              <div className="appointments-list">
                {paginatedAppointments.map((appointment) => {
                  const statusInfo = getStatusInfo(appointment.status);
                  const paymentStatusInfo = getPaymentStatusInfo(appointment.paymentStatus);
                  const isUpcoming = new Date(appointment.startDateTime) > new Date();
                  
                  const patientInfo = appointment.patientId || {};
                  const patientName = patientInfo.fullName || patientInfo.name || patientInfo.username || "Patient";
                  
                  return (
                    <div 
                      key={appointment._id} 
                      className={`appointment-cardd ${appointment.status} ${isUpcoming ? 'upcoming' : 'past'}`}
                      onClick={() => handleLoadAppointmentDetails(appointment._id)}
                    >
                      <div className="appointment-header">
                        <div className="appointment-date">
                          <FaCalendarAlt />
                          <span>{formatDate(appointment.startDateTime)}</span>
                        </div>
                        <div className="status-container">
                          <div className="appointment-status" style={{ 
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bgColor
                          }}>
                            {statusInfo.icon}
                            <span>{statusInfo.text}</span>
                          </div>
                          {appointment.status === "CONFIRMED" && (
                            <div className="payment-status" style={{ 
                              color: paymentStatusInfo.color,
                              backgroundColor: paymentStatusInfo.bgColor
                            }}>
                              {paymentStatusInfo.icon}
                              <span>{paymentStatusInfo.text}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="appointment-body">
                        <div className="appointment-info">
                          <div className="info-row">
                            <div className="info-item">
                              <FaClock />
                              <span>
                                <strong>Horaire :</strong> {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                                <span className="duration"> ({calculateDuration(appointment.startDateTime, appointment.endDateTime)})</span>
                              </span>
                            </div>
                            
                            <div className="info-item">
                              <FaUsers />
                              <div className="patient-details">
                                <span><strong>Patient :</strong> {patientName}</span>
                              </div>
                            </div>
                            
                            {appointment.amount && (
                              <div className="info-item">
                                <FaMoneyBillWave />
                                <span>
                                  <strong>Montant :</strong> {appointment.amount} DT
                                </span>
                              </div>
                            )}
                            
                            {appointment.reason && (
                              <div className="info-item">
                                <FaNotesMedical />
                                <span>
                                  <strong>Raison :</strong> {appointment.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Afficher les données médicales pour les rendez-vous terminés */}
                        {appointment.status === "COMPLETED" && renderAppointmentMedicalData(appointment._id)}
                        
                        <div className="appointment-actions">
                          {appointment.status === "REQUESTED" && isUpcoming && (
                            <div className="doctor-actions">
                              <button 
                                className="confirm-btn"
                                onClick={() => handleConfirmAppointment(appointment._id)}
                              >
                                <FaCheckCircle /> Confirmer
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={() => openCancelModal(appointment)}
                              >
                                <FaTimesCircle /> Refuser
                              </button>
                            </div>
                          )}
                          
                          {appointment.status === "CONFIRMED" && isUpcoming && (
                            <>
                              <button
                                className="join-btn"
                                onClick={() => handleJoinConsultation(appointment)}
                              >
                                <FaExternalLinkAlt /> Rejoindre la consultation
                              </button>

                              <button 
                                className="complete-btn"
                                onClick={() => handleCompleteAppointment(appointment._id)}
                              >
                                <FaCalendarCheck /> Marquer comme terminé
                              </button>
                            </>
                          )}
                          
                          {appointment.status === "COMPLETED" && (
                            <div className="doctor-medical-actions">
                              <button
                                className="prescription-btn"
                                onClick={() => openNewPrescriptionModal(appointment._id)}
                              >
                                <FaPrescription /> Créer ordonnance
                              </button>
                              <button
                                className="exam-btn"
                                onClick={() => openNewExamModal(appointment._id)}
                              >
                                <FaFlask /> Prescrire examens
                              </button>
                            </div>
                          )}
                          
                          {appointment.status === "CANCELLED" && (
                            <div className="cancelled-info">
                              <FaTimesCircle />
                              <span>Rendez-vous annulé</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.createdAt && (
                        <div className="appointment-footer">
                          <button 
                            className="view-profile-btn"  
                            onClick={() => viewProfile(patientInfo._id)}
                          >
                            <FaExternalLinkAlt /> Voir profil patient
                          </button>
                          <small>
                            Rendez-vous créé le {formatDate(appointment.createdAt)} à {formatTime(appointment.createdAt)}
                          </small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contrôles de pagination - EN BAS */}
            {paginatedAppointments.length > 0 && (
              <div className="pagination-controls bottom">
                <div className="pagination-info">
                  <span>
                    Page {currentPage} sur {totalPages} • {getFilteredCount()} rendez-vous
                  </span>
                </div>
                
                <div className="pagination-navigation">
                  <button 
                    className="pagination-btn first"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                  >
                    <FaStepBackward />
                  </button>
                  
                  <button 
                    className="pagination-btn prev"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  <div className="page-numbers">
                    {pageNumbers.map(number => (
                      <button
                        key={number}
                        className={`page-number ${currentPage === number ? 'active' : ''}`}
                        onClick={() => handlePageChange(number)}
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="pagination-btn next"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                  
                  <button 
                    className="pagination-btn last"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                  >
                    <FaStepForward />
                  </button>
                </div>
                
                <div className="pagination-jump">
                  <span>Aller à la page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Si c'est un patient, afficher l'interface patient
  const stats = getStats();
  const paginatedAppointments = getPaginatedAppointments();

  return (
    <div className="my-appointments-container">
      <div className="appointments-header">
        <h1>
          <FaCalendarAlt /> Mon Espace Médical
        </h1>
        <p className="subtitle">
          Gérez vos rendez-vous, prescriptions et examens médicaux
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="medical-tabs">
        <button 
          className={`medical-tab ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          <FaCalendarAlt /> Mes Rendez-vous
          <span className="tab-badge">{appointments.length}</span>
        </button>
        <button 
          className={`medical-tab ${activeTab === "prescriptions" ? "active" : ""}`}
          onClick={() => setActiveTab("prescriptions")}
        >
          <FaPrescription /> Mes Prescriptions
          <span className="tab-badge">{prescriptions.length}</span>
        </button>
        <button 
          className={`medical-tab ${activeTab === "exams" ? "active" : ""}`}
          onClick={() => setActiveTab("exams")}
        >
          <FaFlask /> Mes Examens
          <span className="tab-badge">{medicalExams.length}</span>
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "prescriptions" ? (
        <div className="prescriptions-section">
          <div className="section-header">
            <h2><FaPrescription /> Mes Prescriptions Médicales</h2>
            <p>Consultez toutes vos prescriptions médicales</p>
          </div>

          {loadingPrescriptions ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement de vos prescriptions...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="no-data">
              <FaFileMedical size={64} />
              <h3>Aucune prescription trouvée</h3>
              <p>Vous n'avez pas encore de prescriptions médicales.</p>
            </div>
          ) : (
            <div className="prescriptions-grid">
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className="prescription-card">
                  <div className="prescription-header">
                    <div className="prescription-info">
                      <h3>Ordonnance #{prescription._id.slice(-6)}</h3>
                      <div className="prescription-meta">
                        <span><FaUserMd /> Dr. {prescription.doctorId?.fullName || "Médecin"}</span>
                        <span><FaCalendarAlt /> {formatDate(prescription.createdAt)}</span>
                        {prescription.appointmentId && (
                          <span><FaCalendarCheck /> Rendez-vous du {formatDate(prescription.appointmentId?.startDateTime)}</span>
                        )}
                      </div>
                    </div>
                    <div className="prescription-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(prescription.status),
                          color: 'white'
                        }}
                      >
                        {getStatusLabel(prescription.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="prescription-body">
                    {prescription.diagnosis && (
                      <div className="diagnosis-section">
                        <h4><FaNotesMedical /> Diagnostic</h4>
                        <p>{prescription.diagnosis}</p>
                      </div>
                    )}
                    
                    <div className="medications-section">
                      <h4><FaPills /> Médicaments</h4>
                      <div className="medications-list">
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="medication-item">
                            <div className="medication-header">
                              <strong>{med.name}</strong>
                              <span className="dosage">{med.dosage}</span>
                            </div>
                            <div className="medication-details">
                              <span><FaClock /> {med.frequency}</span>
                              <span>⏱️ {med.duration}</span>
                              {med.quantity > 1 && <span>📦 {med.quantity} unités</span>}
                            </div>
                            {med.instructions && (
                              <div className="medication-instructions">
                                <small>💡 {med.instructions}</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {prescription.medicalAdvice && (
                      <div className="advice-section">
                        <h4>Conseils médicaux</h4>
                        <p>{prescription.medicalAdvice}</p>
                      </div>
                    )}
                    
                    {prescription.recommendations && (
                      <div className="recommendations-section">
                        <h4>Recommandations</h4>
                        <p>{prescription.recommendations}</p>
                      </div>
                    )}
                    
                    <div className="prescription-footer">
                      <div className="validity-info">
                        <strong>Validité:</strong> jusqu'au {formatDate(prescription.expiresAt)}
                      </div>
                      {prescription.signedAt && (
                        <div className="signature-info">
                          <strong>Signée le:</strong> {formatDate(prescription.signedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="prescription-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <FaEye /> Détails
                    </button>
                    <button 
                      className="action-btn download-btn"
                      onClick={() => downloadPrescription(prescription._id)}
                    >
                      <FaDownload /> PDF
                    </button>
                    {prescription.status === "SIGNED" && (
                      <button 
                        className="action-btn print-btn"
                        onClick={() => window.print()}
                      >
                        <FaPrint /> Imprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "exams" ? (
        <div className="exams-section">
          <div className="section-header">
            <h2><FaFlask /> Mes Examens Médicaux</h2>
            <p>Consultez toutes vos demandes d'examens et résultats</p>
          </div>

          {loadingExams ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement de vos examens...</p>
            </div>
          ) : medicalExams.length === 0 ? (
            <div className="no-data">
              <FaFlask size={64} />
              <h3>Aucun examen trouvé</h3>
              <p>Vous n'avez pas encore de demandes d'examens médicaux.</p>
            </div>
          ) : (
            <div className="exams-grid">
              {medicalExams.map((exam) => (
                <div key={exam._id} className="exam-card">
                  <div className="exam-header">
                    <div className="exam-icon">
                      {getExamTypeIcon(exam.examType)}
                    </div>
                    <div className="exam-info">
                      <h3>{exam.examTypeLabel}</h3>
                      <div className="exam-meta">
                        <span><FaUserMd /> Dr. {exam.doctorId?.fullName || "Médecin"}</span>
                        <span><FaCalendarAlt /> {formatDate(exam.createdAt)}</span>
                        {exam.appointmentId && (
                          <span><FaCalendarCheck /> Rendez-vous du {formatDate(exam.appointmentId?.startDateTime)}</span>
                        )}
                      </div>
                    </div>
                    <div className="exam-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(exam.status),
                          color: 'white'
                        }}
                      >
                        {getStatusLabel(exam.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="exam-body">
                    <div className="exam-details">
                      <div className="detail-row">
                        <span className="detail-label">Raison:</span>
                        <span className="detail-value">{exam.reason}</span>
                      </div>
                      
                      {exam.instructions && (
                        <div className="detail-row">
                          <span className="detail-label">Instructions:</span>
                          <span className="detail-value">{exam.instructions}</span>
                        </div>
                      )}
                      
                      {exam.preparationNeeded && (
                        <div className="detail-row">
                          <span className="detail-label">Préparation:</span>
                          <span className="detail-value">{exam.preparationNeeded}</span>
                        </div>
                      )}
                      
                      {exam.fastingRequired && (
                        <div className="detail-row">
                          <span className="detail-label">Jeûne:</span>
                          <span className="detail-value">{exam.fastingDuration || "Requis"}</span>
                        </div>
                      )}
                      
                      {exam.labName && (
                        <div className="detail-row">
                          <span className="detail-label">Laboratoire:</span>
                          <span className="detail-value">{exam.labName}</span>
                        </div>
                      )}
                      
                      {exam.labAddress && (
                        <div className="detail-row">
                          <span className="detail-label">Adresse:</span>
                          <span className="detail-value">{exam.labAddress}</span>
                        </div>
                      )}
                    </div>
                    
                    {exam.results && exam.results.length > 0 && (
                      <div className="exam-results">
                        <h4><FaFilePdf /> Résultats</h4>
                        <div className="results-list">
                          {exam.results.map((result, index) => (
                            <div key={index} className="result-item">
                              <span className="result-name">{result.fileName}</span>
                              <button 
                                className="result-download-btn"
                                onClick={() => downloadExamResults(exam._id, result._id)}
                              >
                                <FaDownload /> Télécharger
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {exam.doctorComments && (
                      <div className="exam-comments">
                        <h4>Commentaires du médecin</h4>
                        <p>{exam.doctorComments}</p>
                      </div>
                    )}
                    
                    <div className="exam-footer">
                      <div className="priority-info">
                        <strong>Priorité:</strong> 
                        <span className={`priority-${exam.priority.toLowerCase()}`}>
                          {exam.priority === "URGENT" ? "Urgent" : "Normale"}
                        </span>
                      </div>
                      {exam.reviewedAt && (
                        <div className="review-info">
                          <strong>Revoir le:</strong> {formatDate(exam.reviewedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="exam-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => setSelectedExam(exam)}
                    >
                      <FaEye /> Détails
                    </button>
                    <button 
                      className="action-btn download-btn"
                      onClick={() => downloadExamRequest(exam._id)}
                    >
                      <FaDownload /> Demande PDF
                    </button>
                    {exam.results && exam.results.length > 0 && (
                      <button 
                        className="action-btn results-btn"
                        onClick={() => {
                          exam.results.forEach((result, index) => {
                            setTimeout(() => {
                              downloadExamResults(exam._id, result._id);
                            }, index * 500);
                          });
                        }}
                      >
                        <FaDownload /> Tous les résultats
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Onglet rendez-vous (par défaut)
        <>
          {/* Statistiques */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FaCalendarAlt />
              </div>
              <div className="stat-info">
                <h3>Total</h3>
                <p className="stat-number">{stats.total}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon upcoming">
                <FaClock />
              </div>
              <div className="stat-info">
                <h3>À venir</h3>
                <p className="stat-number">{stats.upcoming}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon requested">
                <FaHourglassHalf />
              </div>
              <div className="stat-info">
                <h3>Demandés</h3>
                <p className="stat-number">{stats.requested}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon confirmed">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <h3>Confirmés</h3>
                <p className="stat-number">{stats.confirmed}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon upcoming">
                <FaMoneyBillWave />
              </div>
              <div className="stat-info">
                <h3>Paiement en attente</h3>
                <p className="stat-number">{stats.pendingPayment}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon completed">
                <FaCalendarCheck />
              </div>
              <div className="stat-info">
                <h3>Terminés</h3>
                <p className="stat-number">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="filters-section-myappointments">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => {setFilter("all"); setCurrentPage(1);}}
              >
                Tous
              </button>
              <button 
                className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
                onClick={() => {setFilter("upcoming"); setCurrentPage(1);}}
              >
                À venir
              </button>
              <button 
                className={`filter-btn ${filter === "REQUESTED" ? "active" : ""}`}
                onClick={() => {setFilter("REQUESTED"); setCurrentPage(1);}}
              >
                Demandés
              </button>
              <button 
                className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
                onClick={() => {setFilter("CONFIRMED"); setCurrentPage(1);}}
              >
                Confirmés
              </button>
              <button 
                className={`filter-btn ${filter === "CANCELLED" ? "active" : ""}`}
                onClick={() => {setFilter("CANCELLED"); setCurrentPage(1);}}
              >
                Annulés
              </button>
              <button 
                className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
                onClick={() => {setFilter("COMPLETED"); setCurrentPage(1);}}
              >
                Terminés
              </button>
            </div>
            
            <div className="filter-info">
              <span className="filter-count">
                {getFilteredCount()} rendez-vous
              </span>
              {filter !== "all" && (
                <button 
                  className="clear-filter"
                  onClick={() => {setFilter("all"); setCurrentPage(1);}}
                >
                  Effacer le filtre
                </button>
              )}
            </div>
          </div>

          {/* Contrôles de pagination - EN HAUT */}
          <div className="pagination-controls top">
            <div className="pagination-info">
              <span>
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, getFilteredCount())} sur {getFilteredCount()} rendez-vous
              </span>
            </div>
            <div className="pagination-select">
              <label htmlFor="itemsPerPage">Rendez-vous par page:</label>
              <select 
                id="itemsPerPage" 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Liste des rendez-vous */}
          {paginatedAppointments.length === 0 ? (
            <div className="no-appointments">
              <FaCalendarAlt size={64} />
              <h3>Aucun rendez-vous trouvé</h3>
              <p>
                {appointments.length === 0 
                  ? "Vous n'avez pas encore de rendez-vous."
                  : `Aucun rendez-vous ne correspond au filtre "${filter}".`}
              </p>
              {appointments.length === 0 && (
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = "/doctors"}
                >
                  Prendre un rendez-vous
                </button>
              )}
            </div>
          ) : (
            <div className="appointments-list">
              {paginatedAppointments.map((appointment) => {
                const statusInfo = getStatusInfo(appointment.status);
                const paymentStatusInfo = getPaymentStatusInfo(appointment.paymentStatus);
                const isUpcoming = new Date(appointment.startDateTime) > new Date();
                const canCancel = canCancelAppointment(appointment);
                const needsPayment = requiresPayment(appointment);
                
                const doctorInfo = appointment.doctorId || {};
                const doctorName = doctorInfo.fullName || doctorInfo.name || doctorInfo.username || "Médecin";
                const doctorSpecialty = doctorInfo.specialty || "Non spécifié";
                
                return (
                  <div 
                    key={appointment._id} 
                    className={`appointment-cardd ${appointment.status} ${isUpcoming ? 'upcoming' : 'past'}`}
                    onClick={() => handleLoadAppointmentDetails(appointment._id)}
                  >
                    <div className="appointment-header">
                      <div className="appointment-date">
                        <FaCalendarAlt />
                        <span>{formatDate(appointment.startDateTime)}</span>
                      </div>
                      <div className="status-container">
                        <div className="appointment-status" style={{ 
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor
                        }}>
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                        {appointment.status === "CONFIRMED" && (
                          <div className="payment-status" style={{ 
                            color: paymentStatusInfo.color,
                            backgroundColor: paymentStatusInfo.bgColor
                          }}>
                            {paymentStatusInfo.icon}
                            <span>{paymentStatusInfo.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="appointment-body">
                      <div className="appointment-info">
                        <div className="info-row">
                          <div className="info-item doctor-info">
                            <FaUserMd />
                            <div className="doctor-details">
                              <span><strong>Médecin :</strong> Dr. {doctorName} </span>
                            </div>
                          </div>
                          <div className="info-item">
                            <FaClock />
                            <span>
                              <strong>Horaire :</strong> {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                              <span className="duration"> ({calculateDuration(appointment.startDateTime, appointment.endDateTime)})</span>
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <FaStethoscope />
                            <span>
                              <strong>Spécialité :</strong> {doctorSpecialty}
                            </span>
                          </div>
                          
                          {appointment.amount && (
                            <div className="info-item">
                              <FaMoneyBillWave />
                              <span>
                                <strong>Montant :</strong> {appointment.amount} DT
                              </span>
                            </div>
                          )}
                          
                          {appointment.reason && (
                            <div className="info-item">
                              <FaNotesMedical />
                              <span>
                                <strong>Raison :</strong> {appointment.reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Afficher les données médicales pour les rendez-vous terminés */}
                      {appointment.status === "COMPLETED" && renderAppointmentMedicalData(appointment._id)}
                      
                      <div className="appointment-actions">
                        {appointment.status === "REQUESTED" && isUpcoming && (
                          <div className="pending-info">
                            <FaInfoCircle />
                            <small>En attente de confirmation par le médecin</small>
                          </div>
                        )}
                        
                        {needsPayment && (
                          <button 
                            className="pay-btn"
                            onClick={() => openPaymentModal(appointment)}
                          >
                            <FaCreditCard /> Payer maintenant
                          </button>
                        )}
                        
                        {appointment.status === "CONFIRMED" && appointment.paymentStatus === "PAID" && isUpcoming && (
                          <button
                            className="join-btn"
                            onClick={() => handleJoinConsultation(appointment)}
                          >
                            <FaExternalLinkAlt /> Rejoindre la consultation
                          </button>
                        )}
                        
                        {canCancel && isUpcoming && appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
                          <button 
                            className="cancel-btn"
                            onClick={() => openCancelModal(appointment)}
                            disabled={cancelling}
                          >
                            <FaCalendarTimes /> Annuler
                          </button>
                        )}
                        
                        {!isUpcoming && appointment.status === "COMPLETED" && (
                          <div className="completed-actions">
                            <button 
                              className="prescription-btn"
                              onClick={() => setActiveTab("prescriptions")}
                            >
                              <FaPrescription /> Voir prescriptions
                            </button>
                            <button 
                              className="exam-btn"
                              onClick={() => setActiveTab("exams")}
                            >
                              <FaFlask /> Voir examens
                            </button>
                          </div>
                        )}
                        
                        {appointment.status === "CANCELLED" && (
                          <div className="cancelled-info">
                            <FaTimesCircle />
                            <span>Ce rendez-vous a été annulé</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {appointment.createdAt && (
                      <div className="appointment-footer">
                        <button 
                          className="view-profile-btn"  
                          onClick={() => viewProfile(doctorInfo._id)}
                        >
                          <FaExternalLinkAlt /> Voir profil médecin
                        </button>
                        <small>
                          Rendez-vous créé le {formatDate(appointment.createdAt)} à {formatTime(appointment.createdAt)}
                        </small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Contrôles de pagination - EN BAS */}
          {paginatedAppointments.length > 0 && (
            <div className="pagination-controls bottom">
              <div className="pagination-info">
                <span>
                  Page {currentPage} sur {totalPages} • {getFilteredCount()} rendez-vous
                </span>
              </div>
              
              <div className="pagination-navigation">
                <button 
                  className="pagination-btn first"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <FaStepBackward />
                </button>
                
                <button 
                  className="pagination-btn prev"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>
                
                <div className="page-numbers">
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      className={`page-number ${currentPage === number ? 'active' : ''}`}
                      onClick={() => handlePageChange(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn next"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <FaChevronRight />
                </button>
                
                <button 
                  className="pagination-btn last"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <FaStepForward />
                </button>
              </div>
              
              <div className="pagination-jump">
                <span>Aller à la page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Bouton pour prendre un nouveau rendez-vous */}
          <div className="new-appointment-section">
            <button 
              className="new-appointment-btn"
              onClick={() => window.location.href = "/doctors"}
            >
              <FaCalendarAlt /> Prendre un nouveau rendez-vous
            </button>
          </div>
        </>
      )}

      {/* Modal d'annulation */}
      {showCancelModal && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Annuler le rendez-vous</h3>
            <p>
              Êtes-vous sûr de vouloir annuler votre rendez-vous 
              du {formatDate(selectedAppointment.startDateTime)} à {formatTime(selectedAppointment.startDateTime)} ?
            </p>
            
            <div className="modal-actions">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Non, garder
              </button>
              <button 
                className="modal-confirm-btn"
                onClick={() => handleCancelAppointment(selectedAppointment._id)}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="spinner-small"></span>
                    Annulation...
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Oui, annuler
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedPaymentAppointment && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="payment-modal-header">
              <button 
                className="back-button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentAppointment(null);
                }}
              >
                <FaArrowLeft /> Retour
              </button>
              <h3><FaLock /> Paiement de la consultation</h3>
            </div>
            
            <div className="payment-summary">
              <h4>Résumé du paiement</h4>
              <div className="summary-details">
                <div className="summary-item">
                  <span>Médecin:</span>
                  <span>Dr. {selectedPaymentAppointment.doctorId?.fullName}</span>
                </div>
                <div className="summary-item">
                  <span>Date:</span>
                  <span>{formatDate(selectedPaymentAppointment.startDateTime)}</span>
                </div>
                <div className="summary-item">
                  <span>Heure:</span>
                  <span>{formatTime(selectedPaymentAppointment.startDateTime)}</span>
                </div>
                <div className="summary-item">
                  <span>Durée:</span>
                  <span>{calculateDuration(selectedPaymentAppointment.startDateTime, selectedPaymentAppointment.endDateTime)}</span>
                </div>
                <div className="summary-item total">
                  <span>Montant à payer:</span>
                  <span className="amount">{selectedPaymentAppointment.amount} DT</span>
                </div>
              </div>
            </div>
            
            <div className="payment-methods">
              <h4>Méthode de paiement</h4>
              <div className="method-options">
                <button 
                  className="method-option"
                  onClick={handleCardPayment}
                  disabled={paymentProcessing}
                >
                  <FaCreditCard />
                  <span>Carte bancaire</span>
                  <small>Visa, Mastercard</small>
                </button>
                <button 
                  className="method-option"
                  onClick={() => handleMobileMoneyPayment("orange")}
                  disabled={paymentProcessing}
                >
                  <FaMoneyBillWave />
                  <span>Orange Money</span>
                  <small>Paiement mobile</small>
                </button>
                <button 
                  className="method-option"
                  onClick={() => handleMobileMoneyPayment("mtn")}
                  disabled={paymentProcessing}
                >
                  <FaMoneyBillWave />
                  <span>MTN Mobile Money</span>
                  <small>Paiement mobile</small>
                </button>
              </div>
            </div>
            
            <div className="payment-security">
              <p><FaLock /> Paiement sécurisé par cryptage SSL</p>
              {paymentProcessing && (
                <div className="processing-payment">
                  <span className="spinner-small"></span>
                  <span>Traitement du paiement en cours...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation de prescription */}
      {selectedPrescription && (
        <div className="modal-overlay">
          <div className="modal-content prescription-detail-modal">
            <div className="modal-header">
              <h3><FaPrescription /> Détails de la Prescription</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedPrescription(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="prescription-detail">
                <div className="detail-section">
                  <h4>Informations générales</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Numéro:</strong> #{selectedPrescription._id.slice(-6)}
                    </div>
                    <div className="detail-item">
                      <strong>Médecin:</strong> Dr. {selectedPrescription.doctorId?.fullName}
                    </div>
                    <div className="detail-item">
                      <strong>Date:</strong> {formatDate(selectedPrescription.createdAt)}
                    </div>
                    <div className="detail-item">
                      <strong>Statut:</strong>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedPrescription.status) }}>
                        {getStatusLabel(selectedPrescription.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedPrescription.diagnosis && (
                  <div className="detail-section">
                    <h4>Diagnostic</h4>
                    <p>{selectedPrescription.diagnosis}</p>
                  </div>
                )}
                
                <div className="detail-section">
                  <h4>Médicaments prescrits</h4>
                  <div className="medications-detail">
                    {selectedPrescription.medications.map((med, index) => (
                      <div key={index} className="medication-detail-item">
                        <div className="med-header">
                          <strong>{index + 1}. {med.name}</strong>
                          <span className="dosage">{med.dosage}</span>
                        </div>
                        <div className="med-info">
                          <span><FaClock /> {med.frequency}</span>
                          <span>⏱️ {med.duration}</span>
                          {med.quantity > 1 && <span>📦 {med.quantity} unités</span>}
                        </div>
                        {med.instructions && (
                          <div className="med-instructions">
                            <strong>Instructions:</strong> {med.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedPrescription.medicalAdvice && (
                  <div className="detail-section">
                    <h4>Conseils médicaux</h4>
                    <p>{selectedPrescription.medicalAdvice}</p>
                  </div>
                )}
                
                {selectedPrescription.recommendations && (
                  <div className="detail-section">
                    <h4>Recommandations</h4>
                    <p>{selectedPrescription.recommendations}</p>
                  </div>
                )}
                
                <div className="detail-section">
                  <h4>Informations de validité</h4>
                  <div className="validity-info">
                    <p><strong>Prescription valide jusqu'au:</strong> {formatDate(selectedPrescription.expiresAt)}</p>
                    {selectedPrescription.signedAt && (
                      <p><strong>Signée électroniquement le:</strong> {formatDate(selectedPrescription.signedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setSelectedPrescription(null)}
              >
                Fermer
              </button>
              <button 
                className="modal-btn primary"
                onClick={() => downloadPrescription(selectedPrescription._id)}
              >
                <FaDownload /> Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation d'examen */}
      {selectedExam && (
        <div className="modal-overlay">
          <div className="modal-content exam-detail-modal">
            <div className="modal-header">
              <h3><FaFlask /> Détails de l'Examen</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedExam(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="exam-detail">
                <div className="detail-section">
                  <h4>Informations générales</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Type d'examen:</strong> {selectedExam.examTypeLabel}
                    </div>
                    <div className="detail-item">
                      <strong>Médecin:</strong> Dr. {selectedExam.doctorId?.fullName}
                    </div>
                    <div className="detail-item">
                      <strong>Date de demande:</strong> {formatDate(selectedExam.createdAt)}
                    </div>
                    <div className="detail-item">
                      <strong>Statut:</strong>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedExam.status) }}>
                        {getStatusLabel(selectedExam.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Raison et instructions</h4>
                  <div className="exam-reason">
                    <p><strong>Raison:</strong> {selectedExam.reason}</p>
                  </div>
                  {selectedExam.instructions && (
                    <div className="exam-instructions">
                      <p><strong>Instructions:</strong> {selectedExam.instructions}</p>
                    </div>
                  )}
                </div>
                
                {selectedExam.preparationNeeded && (
                  <div className="detail-section">
                    <h4>Préparation requise</h4>
                    <p>{selectedExam.preparationNeeded}</p>
                    {selectedExam.fastingRequired && (
                      <p><strong>Jeûne:</strong> {selectedExam.fastingDuration || "Requis"}</p>
                    )}
                  </div>
                )}
                
                {(selectedExam.labName || selectedExam.labAddress) && (
                  <div className="detail-section">
                    <h4>Laboratoire</h4>
                    {selectedExam.labName && <p><strong>Nom:</strong> {selectedExam.labName}</p>}
                    {selectedExam.labAddress && <p><strong>Adresse:</strong> {selectedExam.labAddress}</p>}
                  </div>
                )}
                
                {selectedExam.results && selectedExam.results.length > 0 && (
                  <div className="detail-section">
                    <h4>Résultats disponibles</h4>
                    <div className="results-list">
                      {selectedExam.results.map((result, index) => (
                        <div key={index} className="result-detail-item">
                          <div className="result-info">
                            <strong>{result.fileName}</strong>
                            <small>Téléchargé le: {formatDate(result.uploadedAt)}</small>
                          </div>
                          <button 
                            className="download-btn"
                            onClick={() => downloadExamResults(selectedExam._id, result._id)}
                          >
                            <FaDownload />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedExam.doctorComments && (
                  <div className="detail-section">
                    <h4>Commentaires du médecin</h4>
                    <p>{selectedExam.doctorComments}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setSelectedExam(null)}
              >
                Fermer
              </button>
              <button 
                className="modal-btn primary"
                onClick={() => downloadExamRequest(selectedExam._id)}
              >
                <FaDownload /> Télécharger demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de prescription (médecin) */}
      {showNewPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content new-prescription-modal">
            <div className="modal-header">
              <h3><FaPrescription /> Nouvelle Prescription</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNewPrescriptionModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleCreatePrescription(); }}>
                <div className="form-group">
                  <label>Diagnostic</label>
                  <textarea
                    value={newPrescription.diagnosis}
                    onChange={(e) => setNewPrescription({...newPrescription, diagnosis: e.target.value})}
                    placeholder="Diagnostic du patient..."
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Médicaments</label>
                  {newPrescription.medications.map((med, index) => (
                    <div key={index} className="medication-form">
                      <div className="form-row">
                        <div className="form-col">
                          <input
                            type="text"
                            placeholder="Nom du médicament"
                            value={med.name}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].name = e.target.value;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                            required
                          />
                        </div>
                        <div className="form-col">
                          <input
                            type="text"
                            placeholder="Dosage (ex: 500mg)"
                            value={med.dosage}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].dosage = e.target.value;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-col">
                          <input
                            type="text"
                            placeholder="Fréquence (ex: 3 fois/jour)"
                            value={med.frequency}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].frequency = e.target.value;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                            required
                          />
                        </div>
                        <div className="form-col">
                          <input
                            type="text"
                            placeholder="Durée (ex: 7 jours)"
                            value={med.duration}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].duration = e.target.value;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-col">
                          <input
                            type="number"
                            placeholder="Quantité"
                            value={med.quantity}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].quantity = parseInt(e.target.value) || 1;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                            min="1"
                          />
                        </div>
                        <div className="form-col">
                          <input
                            type="text"
                            placeholder="Instructions spéciales"
                            value={med.instructions}
                            onChange={(e) => {
                              const newMedications = [...newPrescription.medications];
                              newMedications[index].instructions = e.target.value;
                              setNewPrescription({...newPrescription, medications: newMedications});
                            }}
                          />
                        </div>
                      </div>
                      
                      {newPrescription.medications.length > 1 && (
                        <button 
                          type="button"
                          className="remove-btn"
                          onClick={() => removeMedication(index)}
                        >
                          <FaTrash /> Supprimer ce médicament
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    className="add-btn"
                    onClick={addMedication}
                  >
                    <FaPlus /> Ajouter un médicament
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Conseils médicaux</label>
                  <textarea
                    value={newPrescription.medicalAdvice}
                    onChange={(e) => setNewPrescription({...newPrescription, medicalAdvice: e.target.value})}
                    placeholder="Conseils médicaux pour le patient..."
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Recommandations</label>
                  <textarea
                    value={newPrescription.recommendations}
                    onChange={(e) => setNewPrescription({...newPrescription, recommendations: e.target.value})}
                    placeholder="Recommandations supplémentaires..."
                    rows="3"
                  />
                </div>
              </form>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowNewPrescriptionModal(false)}
              >
                Annuler
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleCreatePrescription}
              >
                <FaCheckCircle /> Créer la prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'examen (médecin) */}
      {showNewExamModal && (
        <div className="modal-overlay">
          <div className="modal-content new-exam-modal">
            <div className="modal-header">
              <h3><FaFlask /> Nouvelle Demande d'Examen</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNewExamModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateExam(); }}>
                <div className="form-group">
                  <label>Type d'examen</label>
                  <select
                    value={newExam.examType}
                    onChange={(e) => {
                      const examType = e.target.value;
                      let examTypeLabel = "";
                      switch(examType) {
                        case "BLOOD_TEST": examTypeLabel = "Analyse sanguine"; break;
                        case "URINE_TEST": examTypeLabel = "Analyse d'urine"; break;
                        case "X_RAY": examTypeLabel = "Radiographie"; break;
                        case "CT_SCAN": examTypeLabel = "Scanner"; break;
                        case "MRI": examTypeLabel = "IRM"; break;
                        case "ULTRASOUND": examTypeLabel = "Échographie"; break;
                        case "ECG": examTypeLabel = "Électrocardiogramme"; break;
                        case "EEG": examTypeLabel = "Électroencéphalogramme"; break;
                        default: examTypeLabel = "Autre examen";
                      }
                      setNewExam({...newExam, examType, examTypeLabel});
                    }}
                    required
                  >
                    <option value="BLOOD_TEST">Analyse sanguine</option>
                    <option value="URINE_TEST">Analyse d'urine</option>
                    <option value="X_RAY">Radiographie</option>
                    <option value="CT_SCAN">Scanner</option>
                    <option value="MRI">IRM</option>
                    <option value="ULTRASOUND">Échographie</option>
                    <option value="ECG">Électrocardiogramme (ECG)</option>
                    <option value="EEG">Électroencéphalogramme (EEG)</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Raison de l'examen</label>
                  <textarea
                    value={newExam.reason}
                    onChange={(e) => setNewExam({...newExam, reason: e.target.value})}
                    placeholder="Raison médicale pour cet examen..."
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Instructions pour le patient</label>
                  <textarea
                    value={newExam.instructions}
                    onChange={(e) => setNewExam({...newExam, instructions: e.target.value})}
                    placeholder="Instructions spécifiques pour le patient..."
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label>Priorité</label>
                      <select
                        value={newExam.priority}
                        onChange={(e) => setNewExam({...newExam, priority: e.target.value})}
                      >
                        <option value="NORMAL">Normale</option>
                        <option value="URGENT">Urgente</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-col">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newExam.fastingRequired}
                          onChange={(e) => setNewExam({...newExam, fastingRequired: e.target.checked})}
                        />
                        Jeûne requis
                      </label>
                    </div>
                  </div>
                </div>
                
                {newExam.fastingRequired && (
                  <div className="form-group">
                    <label>Durée du jeûne</label>
                    <input
                      type="text"
                      value={newExam.fastingDuration}
                      onChange={(e) => setNewExam({...newExam, fastingDuration: e.target.value})}
                      placeholder="Ex: 8 heures"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Préparation nécessaire</label>
                  <textarea
                    value={newExam.preparationNeeded}
                    onChange={(e) => setNewExam({...newExam, preparationNeeded: e.target.value})}
                    placeholder="Préparation spécifique requise..."
                    rows="2"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label>Nom du laboratoire</label>
                      <input
                        type="text"
                        value={newExam.labName}
                        onChange={(e) => setNewExam({...newExam, labName: e.target.value})}
                        placeholder="Nom du laboratoire"
                      />
                    </div>
                  </div>
                  
                  <div className="form-col">
                    <div className="form-group">
                      <label>Adresse du laboratoire</label>
                      <input
                        type="text"
                        value={newExam.labAddress}
                        onChange={(e) => setNewExam({...newExam, labAddress: e.target.value})}
                        placeholder="Adresse du laboratoire"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowNewExamModal(false)}
              >
                Annuler
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleCreateExam}
              >
                <FaCheckCircle /> Créer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;