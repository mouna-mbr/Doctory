import React, { useState, useEffect } from "react";
import {
  FaWallet,
  FaReceipt,
  FaHistory,
  FaCreditCard,
  FaMoneyBillWave,
  FaDownload,
  FaPrint,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaFilter,
  FaSearch,
  FaFileInvoice,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaStepBackward,
  FaStepForward,
  FaEye,
  FaFilePdf
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../assets/css/Payments.css";
import logo from '../assets/photos/logonobg.png';

const API_BASE_URL = "http://localhost:5000/api";
const ITEMS_PER_PAGE = 5;

const Payments = () => {
  const [activeTab, setActiveTab] = useState("receipts");
  const [userRole, setUserRole] = useState("PATIENT");
  const [loading, setLoading] = useState(true);
  
  const [allReceipts, setAllReceipts] = useState([]);
  const [displayedReceipts, setDisplayedReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  
  const [receiptsPagination, setReceiptsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE
  });
  
  const [transactionsPagination, setTransactionsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE
  });
  
  const [withdrawalsPagination, setWithdrawalsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE
  });
  
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: ""
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    method: "BANK_TRANSFER",
    accountNumber: "",
    accountHolder: "",
    bankName: ""
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "PATIENT");
    }
    loadData();
  }, [activeTab, receiptsPagination.currentPage, receiptsPagination.itemsPerPage, filters.status, filters.search]);

  useEffect(() => {
    if (activeTab === "receipts" && allReceipts.length > 0) {
      applyFiltersAndPagination();
    }
  }, [filters, receiptsPagination.currentPage, receiptsPagination.itemsPerPage, allReceipts]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (activeTab === "receipts") {
        const response = await fetch(
          `${API_BASE_URL}/payments/receipts?status=${filters.status}`, 
          {
            headers: { "Authorization": `Bearer ${token}` }
          }
        );
        
        const data = await response.json();
        
        if (data.success) {
          const allReceiptsData = data.data.receipts || data.data || [];
          setAllReceipts(allReceiptsData);
          
          applyFiltersAndPagination(allReceiptsData);
        }
      }
      
      if (userRole === "DOCTOR") {
        const walletRes = await fetch(`${API_BASE_URL}/payments/wallet/balance`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const walletData = await walletRes.json();
        if (walletData.success) setWalletData(walletData.data);
        
        const transRes = await fetch(
          `${API_BASE_URL}/payments/wallet/transactions?page=${transactionsPagination.currentPage}&limit=${transactionsPagination.itemsPerPage}`, 
          {
            headers: { "Authorization": `Bearer ${token}` }
          }
        );
        const transData = await transRes.json();
        if (transData.success) {
          setTransactions(transData.data.transactions);
          setTransactionsPagination(prev => ({
            ...prev,
            totalPages: transData.data.pages || 1,
            totalItems: transData.data.total || transData.data.transactions.length
          }));
        }
        
        const withdrawRes = await fetch(
          `${API_BASE_URL}/payments/wallet/withdrawals?page=${withdrawalsPagination.currentPage}&limit=${withdrawalsPagination.itemsPerPage}`, 
          {
            headers: { "Authorization": `Bearer ${token}` }
          }
        );
        const withdrawData = await withdrawRes.json();
        if (withdrawData.success) {
          setWithdrawals(withdrawData.data.withdrawals || withdrawData.data);
          if (withdrawData.data.totalPages) {
            setWithdrawalsPagination(prev => ({
              ...prev,
              totalPages: withdrawData.data.totalPages,
              totalItems: withdrawData.data.totalItems || withdrawData.data.length
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = (receiptsData = allReceipts) => {
    let filteredReceipts = [...receiptsData];
    
    if (filters.status !== "all") {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReceipts = filteredReceipts.filter(receipt => 
        receipt.doctorName?.toLowerCase().includes(searchLower) ||
        receipt.patientName?.toLowerCase().includes(searchLower) ||
        receipt.specialty?.toLowerCase().includes(searchLower) ||
        receipt.method?.toLowerCase().includes(searchLower)
      );
    }
    
    const totalItems = filteredReceipts.length;
    const totalPages = Math.ceil(totalItems / receiptsPagination.itemsPerPage) || 1;
    
    const startIndex = (receiptsPagination.currentPage - 1) * receiptsPagination.itemsPerPage;
    const endIndex = startIndex + receiptsPagination.itemsPerPage;
    const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);
    
    setDisplayedReceipts(paginatedReceipts);
    setReceiptsPagination(prev => ({
      ...prev,
      totalPages: totalPages,
      totalItems: totalItems,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  };

  const handlePageChange = (page, type) => {
    if (page < 1) return;
    
    switch(type) {
      case 'receipts':
        if (page > receiptsPagination.totalPages) return;
        
        setReceiptsPagination(prev => ({ ...prev, currentPage: page }));
        
        const startIndex = (page - 1) * receiptsPagination.itemsPerPage;
        const endIndex = startIndex + receiptsPagination.itemsPerPage;
        
        let filteredReceipts = [...allReceipts];
        
        if (filters.status !== "all") {
          filteredReceipts = filteredReceipts.filter(receipt => receipt.status === filters.status);
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredReceipts = filteredReceipts.filter(receipt => 
            receipt.doctorName?.toLowerCase().includes(searchLower) ||
            receipt.patientName?.toLowerCase().includes(searchLower) ||
            receipt.specialty?.toLowerCase().includes(searchLower)
          );
        }
        
        const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);
        setDisplayedReceipts(paginatedReceipts);
        break;
        
      case 'transactions':
        if (page > transactionsPagination.totalPages) return;
        setTransactionsPagination(prev => ({ ...prev, currentPage: page }));
        break;
      case 'withdrawals':
        if (page > withdrawalsPagination.totalPages) return;
        setWithdrawalsPagination(prev => ({ ...prev, currentPage: page }));
        break;
      default:
        break;
    }
  };

  const handleItemsPerPageChange = (itemsPerPage, type) => {
    const newItemsPerPage = parseInt(itemsPerPage);
    if (newItemsPerPage < 1) return;
    
    switch(type) {
      case 'receipts':
        let filteredReceipts = [...allReceipts];
        
        if (filters.status !== "all") {
          filteredReceipts = filteredReceipts.filter(receipt => receipt.status === filters.status);
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredReceipts = filteredReceipts.filter(receipt => 
            receipt.doctorName?.toLowerCase().includes(searchLower) ||
            receipt.patientName?.toLowerCase().includes(searchLower) ||
            receipt.specialty?.toLowerCase().includes(searchLower)
          );
        }
        
        const totalItems = filteredReceipts.length;
        const totalPages = Math.ceil(totalItems / newItemsPerPage) || 1;
        
        const paginatedReceipts = filteredReceipts.slice(0, newItemsPerPage);
        
        setDisplayedReceipts(paginatedReceipts);
        setReceiptsPagination({ 
          currentPage: 1,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: newItemsPerPage
        });
        break;
        
      case 'transactions':
        setTransactionsPagination(prev => ({ 
          ...prev, 
          itemsPerPage: newItemsPerPage,
          currentPage: 1
        }));
        break;
      case 'withdrawals':
        setWithdrawalsPagination(prev => ({ 
          ...prev, 
          itemsPerPage: newItemsPerPage,
          currentPage: 1
        }));
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleViewReceiptDetails = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDetails(true);
  };

  const handleDownloadPDF = async (receiptId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/payments/receipts/${receiptId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          icon: 'success',
          title: 'PDF téléchargé',
          text: 'Le reçu a été téléchargé avec succès',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de télécharger le PDF'
      });
    }
  };

  const handlePrintReceipt = (receipt) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu #${receipt.id.slice(-8)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
              padding: 40px;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 5px 20px rgba(0,0,0,0.1);
              padding: 40px;
              position: relative;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2c3e50;
            }
            
            .logo {
              max-width: 180px;
              margin-bottom: 20px;
            }
            
            .receipt-title {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 8px;
            }
            
            .receipt-id {
              font-size: 16px;
              color: #7f8c8d;
              font-weight: 500;
            }
            
            .receipt-info {
              margin: 30px 0;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            
            .total {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              margin: 40px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              color: #2c3e50;
            }
            
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            
            @media print {
              body {
                padding: 20px;
              }
              
              .receipt-container {
                box-shadow: none;
                border: 1px solid #ddd;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="${logo}" alt="Logo" class="logo">
              <h1 class="receipt-title">Reçu de Paiement</h1>
              <div class="receipt-id">#${receipt.id.slice(-8)}</div>
            </div>
            
            <div class="receipt-info">
              <div class="info-row">
                <span><strong>Date:</strong></span>
                <span>${formatDate(receipt.date)}</span>
              </div>
              <div class="info-row">
                <span><strong>Médecin:</strong></span>
                <span>${receipt.doctorName}</span>
              </div>
              ${receipt.specialty ? `
              <div class="info-row">
                <span><strong>Spécialité:</strong></span>
                <span>${receipt.specialty}</span>
              </div>` : ''}
              <div class="info-row">
                <span><strong>Méthode de paiement:</strong></span>
                <span>${receipt.method}</span>
              </div>
              ${receipt.appointmentDate ? `
              <div class="info-row">
                <span><strong>Date de consultation:</strong></span>
                <span>${formatDate(receipt.appointmentDate)}</span>
              </div>` : ''}
            </div>
            
            <div class="total">
              Montant: ${formatCurrency(receipt.amount)}
            </div>
            
            <div class="footer">
              <p>Merci pour votre confiance!</p>
              <p>Ce document est un reçu officiel de paiement.</p>
              <p>Pour toute question, contactez notre service client.</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
              <button onclick="window.print()" style="
                background: #2c3e50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
                transition: all 0.3s;
              ">
                🖨️ Imprimer
              </button>
              <button onclick="window.close()" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
              ">
                Fermer
              </button>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              const printBtn = document.querySelector('button[onclick="window.print()"]');
              const closeBtn = document.querySelector('button[onclick="window.close()"]');
              
              printBtn.onmouseover = function() {
                this.style.backgroundColor = '#1a252f';
                this.style.transform = 'translateY(-2px)';
              }
              printBtn.onmouseout = function() {
                this.style.backgroundColor = '#2c3e50';
                this.style.transform = 'translateY(0)';
              }
              
              closeBtn.onmouseover = function() {
                this.style.backgroundColor = '#5a6268';
                this.style.transform = 'translateY(-2px)';
              }
              closeBtn.onmouseout = function() {
                this.style.backgroundColor = '#6c757d';
                this.style.transform = 'translateY(0)';
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const Pagination = ({ pagination, onPageChange, onItemsPerPageChange, type }) => {
    const { currentPage, totalPages, itemsPerPage, totalItems } = pagination;
    
    if (totalItems === 0 || totalPages <= 1) return null;
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          <span>
            Affichage de {startItem} à {endItem} sur {totalItems} éléments
          </span>
          <div className="items-per-page">
            <span>Éléments par page:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange(e.target.value, type)}
              className="form-select"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        
        <div className="pagination-controls">
          <button 
            className="pagination-btn first"
            onClick={() => onPageChange(1, type)}
            disabled={currentPage === 1}
            title="Première page"
          >
            <FaStepBackward />
          </button>
          
          <button 
            className="pagination-btn prev"
            onClick={() => onPageChange(currentPage - 1, type)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Précédent
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum, type)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="ellipsis">...</span>
                <button
                  className="page-number"
                  onClick={() => onPageChange(totalPages, type)}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button 
            className="pagination-btn next"
            onClick={() => onPageChange(currentPage + 1, type)}
            disabled={currentPage === totalPages}
          >
            Suivant <FaChevronRight />
          </button>
          
          <button 
            className="pagination-btn last"
            onClick={() => onPageChange(totalPages, type)}
            disabled={currentPage === totalPages}
            title="Dernière page"
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
            defaultValue={currentPage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page, type);
                  e.target.value = '';
                }
              }
            }}
            className="page-input"
          />
        </div>
      </div>
    );
  };

  const handleWithdraw = async () => {
    try {
      if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) < 100) {
        Swal.fire({
          icon: 'warning',
          title: 'Montant invalide',
          text: 'Le minimum de retrait est de 100 DT'
        });
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/payments/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalForm.amount),
          method: withdrawalForm.method,
          destination: withdrawalForm.accountNumber
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: data.message
        });
        setShowWithdrawalForm(false);
        setWithdrawalForm({
          amount: "",
          method: "BANK_TRANSFER",
          accountNumber: "",
          accountHolder: "",
          bankName: ""
        });
        loadData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de traiter la demande'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0.00 DT";
    return `${parseFloat(amount).toFixed(2)} DT`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SUCCEEDED: { color: "success", text: "Réussi", icon: <FaCheckCircle /> },
      PAID: { color: "success", text: "Payé", icon: <FaCheckCircle /> },
      PENDING: { color: "warning", text: "En attente", icon: <FaClock /> },
      FAILED: { color: "danger", text: "Échoué", icon: <FaTimesCircle /> },
      REFUNDED: { color: "info", text: "Remboursé", icon: <FaArrowDown /> }
    };
    
    const config = statusConfig[status] || { color: "secondary", text: status };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  if (loading && activeTab === "receipts") {
    return (
      <div className="payments-container loading">
        <div className="spinner"></div>
        <p>Chargement des reçus...</p>
      </div>
    );
  }

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h1><FaWallet /> Mes Paiements</h1>
        <p className="subtitle">
          {userRole === "DOCTOR" ? "Gérez votre portefeuille" : "Consultez vos reçus"}
        </p>
      </div>

      <div className="payments-tabs">
        <button className={`tab-btn ${activeTab === "receipts" ? "active" : ""}`}
                onClick={() => setActiveTab("receipts")}>
          <FaReceipt /> Mes reçus de paiement
        </button>
        
        {userRole === "DOCTOR" && (
          <>
            <button className={`tab-btn ${activeTab === "wallet" ? "active" : ""}`}
                    onClick={() => setActiveTab("wallet")}>
              <FaWallet /> Portefeuille
            </button>
            <button className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
                    onClick={() => setActiveTab("transactions")}>
              <FaHistory /> Historique
            </button>
            <button className={`tab-btn ${activeTab === "withdrawals" ? "active" : ""}`}
                    onClick={() => setActiveTab("withdrawals")}>
              <FaMoneyBillWave /> Retraits
            </button>
          </>
        )}
      </div>

      <div className="payments-content">
        {activeTab === "receipts" && (
          <div className="receipts-section">
            <div className="section-header">
              <h2><FaFileInvoice /> Mes reçus de paiement</h2>
              <div className="filters">
                <select 
                  value={filters.status} 
                  onChange={(e) => handleFilterChange({...filters, status: e.target.value})}
                  className="form-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="SUCCEEDED">Réussis</option>
                  <option value="PENDING">En attente</option>
                  <option value="FAILED">Échoués</option>
                  <option value="REFUNDED">Remboursés</option>
                </select>
                <div className="search-box">
                  <FaSearch />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom ou spécialité..." 
                    value={filters.search}
                    onChange={(e) => handleFilterChange({...filters, search: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {displayedReceipts.length === 0 ? (
              <div className="empty-state">
                <FaReceipt size={48} />
                <h3>Aucun reçu trouvé</h3>
                <p>{allReceipts.length === 0 ? "Vous n'avez pas encore de paiements" : "Aucun reçu ne correspond à vos critères"}</p>
              </div>
            ) : (
              <>
                <div className="receipts-grid">
                  {displayedReceipts.map((receipt) => (
                    <div key={receipt.id} className="receipt-card">
                      <div className="receipt-header">
                        <div>
                          <span className="receipt-id">#{receipt.id.slice(-8)}</span>
                          <div className="receipt-date">{formatDate(receipt.date)}</div>
                        </div>
                        {getStatusBadge(receipt.status)}
                      </div>
                      
                      <div className="receipt-body">
                        <div className="receipt-info">
                          <span className="receipt-label">
                            {userRole === "PATIENT" ? "Médecin" : "Patient"}
                          </span>
                          <span className="receipt-value">
                            {userRole === "PATIENT" ? receipt.doctorName : receipt.patientName}
                          </span>
                        </div>
                        
                        {receipt.specialty && (
                          <div className="receipt-info">
                            <span className="receipt-label">Spécialité</span>
                            <span className="receipt-value">{receipt.specialty}</span>
                          </div>
                        )}
                        
                        <div className="receipt-amount">
                          {formatCurrency(receipt.amount)}
                        </div>
                        
                        <div className="receipt-info">
                          <span className="receipt-label">Méthode</span>
                          <span className="receipt-value">{receipt.method}</span>
                        </div>
                        
                        {receipt.appointmentDate && (
                          <div className="receipt-info">
                            <span className="receipt-label">Date consultation</span>
                            <span className="receipt-value">{formatDate(receipt.appointmentDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="receipt-footer">
                        <button 
                          className="details-btn"
                          onClick={() => handleViewReceiptDetails(receipt)}
                        >
                          <FaEye /> Détails
                        </button>
                        <div className="receipt-actions">
                          <button 
                            className="pdf-btn"
                            onClick={() => handleDownloadPDF(receipt.id)}
                          >
                            <FaFilePdf /> PDF
                          </button>
                          <button 
                            className="print-btn"
                            onClick={() => handlePrintReceipt(receipt)}
                          >
                            <FaPrint /> Imprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Pagination
                  pagination={receiptsPagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  type="receipts"
                />
              </>
            )}
          </div>
        )}

        {activeTab === "wallet" && userRole === "DOCTOR" && (
          <div className="wallet-section">
            <div className="wallet-header">
              <h2><FaWallet /> Mon Portefeuille</h2>
              <button className="withdraw-btn" onClick={() => setShowWithdrawalForm(true)}>
                <FaMoneyBillWave /> Retirer
              </button>
            </div>
            
            <div className="wallet-balance">
              <div className="balance-label">Solde disponible</div>
              <div className="balance-amount">{formatCurrency(walletData?.balance || 0)}</div>
              <div className="balance-subtitle">
                {walletData?.canWithdraw 
                  ? "✅ Retrait disponible" 
                  : `Minimum: 100 DT (manque ${formatCurrency(100 - (walletData?.balance || 0))})`}
              </div>
            </div>
            
            <div className="wallet-stats">
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(walletData?.totalEarned || 0)}</div>
                <div className="stat-label">Total gagné</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(walletData?.pendingBalance || 0)}</div>
                <div className="stat-label"><FaClock /> En attente</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">
                  {walletData?.lastWithdrawal 
                    ? new Date(walletData.lastWithdrawal).toLocaleDateString("fr-FR")
                    : "—"}
                </div>
                <div className="stat-label">Dernier retrait</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && userRole === "DOCTOR" && (
          <div className="transactions-section">
            <h2><FaHistory /> Historique des transactions</h2>
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>{tx.description}</td>
                      <td className={`amount ${tx.amount < 0 ? "negative" : "positive"}`}>
                        {tx.amount < 0 ? "-" : "+"} {formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td>{getStatusBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination
              pagination={transactionsPagination}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              type="transactions"
            />
          </div>
        )}

        {activeTab === "withdrawals" && userRole === "DOCTOR" && (
          <div className="withdrawals-section">
            <h2><FaMoneyBillWave /> Mes retraits</h2>
            {withdrawals.length === 0 ? (
              <div className="empty-state">
                <FaMoneyBillWave size={48} />
                <h3>Aucun retrait</h3>
                <p>Vous n'avez pas encore effectué de retraits</p>
              </div>
            ) : (
              <>
                <div className="withdrawals-list">
                  {withdrawals.map((w) => (
                    <div key={w._id} className="withdrawal-card">
                      <div className="withdrawal-header">
                        <span className="withdrawal-id">#{w._id.slice(-8)}</span>
                        <span className={`status-badge status-${w.status.toLowerCase()}`}>
                          {w.status}
                        </span>
                      </div>
                      <div className="withdrawal-body">
                        <div className="withdrawal-info">
                          <span>Montant:</span>
                          <span className="amount">{formatCurrency(w.amount)}</span>
                        </div>
                        <div className="withdrawal-info">
                          <span>Frais:</span>
                          <span>{formatCurrency(w.fees)}</span>
                        </div>
                        <div className="withdrawal-info">
                          <span>Net:</span>
                          <span className="net-amount">{formatCurrency(w.netAmount)}</span>
                        </div>
                        <div className="withdrawal-info">
                          <span>Méthode:</span>
                          <span>{w.method}</span>
                        </div>
                        <div className="withdrawal-info">
                          <span>Date:</span>
                          <span>{formatDate(w.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Pagination
                  pagination={withdrawalsPagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  type="withdrawals"
                />
              </>
            )}
          </div>
        )}
      </div>

      {showReceiptDetails && selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content receipt-details-modal">
            <div className="modal-header">
              <h2><FaFileInvoice /> Détails du reçu</h2>
              <button className="close-btn" onClick={() => setShowReceiptDetails(false)}>×</button>
            </div>
            
            <div className="receipt-details-content">
              <div className="receipt-logo">
                <img src={logo} alt="Logo" />
              </div>
              
              <div className="receipt-details-info">
                <div className="detail-row">
                  <span className="detail-label">Numéro:</span>
                  <span className="detail-value">#{selectedReceipt.id.slice(-8)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(selectedReceipt.date)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Statut:</span>
                  <span className="detail-value">{getStatusBadge(selectedReceipt.status)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Médecin:</span>
                  <span className="detail-value">{selectedReceipt.doctorName}</span>
                </div>
                
                {selectedReceipt.specialty && (
                  <div className="detail-row">
                    <span className="detail-label">Spécialité:</span>
                    <span className="detail-value">{selectedReceipt.specialty}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Méthode de paiement:</span>
                  <span className="detail-value">{selectedReceipt.method}</span>
                </div>
                
                {selectedReceipt.appointmentDate && (
                  <div className="detail-row">
                    <span className="detail-label">Date de consultation:</span>
                    <span className="detail-value">{formatDate(selectedReceipt.appointmentDate)}</span>
                  </div>
                )}
                
                <div className="detail-row total-amount">
                  <span className="detail-label">Montant total:</span>
                  <span className="detail-value">{formatCurrency(selectedReceipt.amount)}</span>
                </div>
              </div>
              
              <div className="receipt-actions-modal">
                <button 
                  className="action-btn pdf-btn"
                  onClick={() => {
                    handleDownloadPDF(selectedReceipt.id);
                    setShowReceiptDetails(false);
                  }}
                >
                  <FaFilePdf /> Télécharger PDF
                </button>
                <button 
                  className="action-btn print-btn"
                  onClick={() => {
                    handlePrintReceipt(selectedReceipt);
                    setShowReceiptDetails(false);
                  }}
                >
                  <FaPrint /> Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWithdrawalForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2><FaMoneyBillWave /> Demande de retrait</h2>
              <button className="close-btn" onClick={() => setShowWithdrawalForm(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>Montant (DT)</label>
              <input type="number" 
                     value={withdrawalForm.amount}
                     onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                     min="100"
                     max={walletData?.balance || 0}
                     placeholder={`Maximum: ${formatCurrency(walletData?.balance || 0)}`} />
            </div>
            
            <div className="form-group">
              <label>Méthode</label>
              <select value={withdrawalForm.method}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, method: e.target.value})}>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
            
            {withdrawalForm.method === "BANK_TRANSFER" && (
              <>
                <div className="form-group">
                  <label>Titulaire du compte</label>
                  <input type="text" 
                         value={withdrawalForm.accountHolder}
                         onChange={(e) => setWithdrawalForm({...withdrawalForm, accountHolder: e.target.value})}
                         placeholder="Nom complet" />
                </div>
                <div className="form-group">
                  <label>Nom de la banque</label>
                  <input type="text" 
                         value={withdrawalForm.bankName}
                         onChange={(e) => setWithdrawalForm({...withdrawalForm, bankName: e.target.value})}
                         placeholder="Ex: Banque de Tunisie" />
                </div>
                <div className="form-group">
                  <label>Numéro de compte/IBAN</label>
                  <input type="text" 
                         value={withdrawalForm.accountNumber}
                         onChange={(e) => setWithdrawalForm({...withdrawalForm, accountNumber: e.target.value})}
                         placeholder="TN59 1234 5678 9012 3456 7890" />
                </div>
              </>
            )}
            
            {withdrawalForm.method === "MOBILE_MONEY" && (
              <div className="form-group">
                <label>Numéro de téléphone</label>
                <input type="tel" 
                       value={withdrawalForm.accountNumber}
                       onChange={(e) => setWithdrawalForm({...withdrawalForm, accountNumber: e.target.value})}
                       placeholder="+216 XX XXX XXX" />
              </div>
            )}
            
            {withdrawalForm.amount && (
              <div className="fees-display">
                <div className="fees-item">
                  <span>Montant:</span>
                  <span>{formatCurrency(parseFloat(withdrawalForm.amount))}</span>
                </div>
                <div className="fees-item">
                  <span>Frais (5%):</span>
                  <span>-{formatCurrency(Math.max(parseFloat(withdrawalForm.amount) * 0.05, 10))}</span>
                </div>
                <div className="fees-total">
                  <span>Net reçu:</span>
                  <span>{formatCurrency(parseFloat(withdrawalForm.amount) - Math.max(parseFloat(withdrawalForm.amount) * 0.05, 10))}</span>
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowWithdrawalForm(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleWithdraw}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;