"use client"
import { useState, useEffect, useRef } from "react"
import { FaRobot, FaUser, FaTooth, FaHeartbeat, FaStethoscope, FaLungs, FaBrain, FaChevronRight, FaSpinner, FaCommentMedical, FaTimes } from "react-icons/fa"

const Chatbot = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef(null)

  // Spécialités avec couleurs
  const specialties = {
    dentiste: { name: "Dentiste", color: "#3b82f6", icon: <FaTooth /> },
    generaliste: { name: "Médecin Généraliste", color: "#10b981", icon: <FaStethoscope /> },
    cardiologue: { name: "Cardiologue", color: "#ef4444", icon: <FaHeartbeat /> },
    pneumologue: { name: "Pneumologue", color: "#0d9488", icon: <FaLungs /> }
  }

  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      text: "👋 Bonjour ! Je suis votre assistant médical. Décrivez vos symptômes et je vous orienterai vers la spécialité appropriée.\n\nExemples : mal aux dents, douleur thoracique, toux, fièvre...",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages([welcomeMessage])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return

    // Message utilisateur
    const userMessage = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      console.log("Envoi au backend:", text)
      
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ message: text })
      })

      console.log("Status:", response.status)
      
      const data = await response.json()
      console.log("Réponse backend:", data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur serveur")
      }

      // Message bot
      const botMessage = {
        id: Date.now() + 1,
        text: data.message,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialty: data.specialty
      }
      
      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error("Erreur complète:", error)
      
      // Mode secours
      const lowerText = text.toLowerCase()
      let responseText = "Je comprends votre message. "
      let specialtyKey = "generaliste"
      
      if (lowerText.includes("dent")) {
        responseText += "Pour des problèmes dentaires, consultez un dentiste."
        specialtyKey = "dentiste"
      } else if (lowerText.includes("cœur") || lowerText.includes("thoracique")) {
        responseText += "Pour des douleurs thoraciques, consultez un cardiologue ou rendez-vous aux urgences."
        specialtyKey = "cardiologue"
      } else if (lowerText.includes("toux") || lowerText.includes("respirer")) {
        responseText += "Pour des problèmes respiratoires, consultez un médecin généraliste."
        specialtyKey = "pneumologue"
      } else {
        responseText += "Consultez un médecin généraliste pour une évaluation."
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialty: specialties[specialtyKey]
      }
      
      setMessages(prev => [...prev, botMessage])
      
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage)
    }
  }

  const handleQuickMessage = (text) => {
    sendMessage(text)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  return (
    <div className="chatbot-wrapper">
      {/* Bouton flottant */}
      {!showChat && (
        <button 
          className="chatbot-toggle-btn"
          onClick={() => setShowChat(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '15px 25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
            fontSize: '16px',
            fontWeight: '600',
            zIndex: 1000
          }}
        >
          <FaCommentMedical /> Assistant Médical
        </button>
      )}

      {/* Fenêtre de chat */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '400px',
          maxHeight: '600px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden'
        }}>
          {/* En-tête */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaRobot style={{ fontSize: '24px' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Assistant Médical</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>Mode local</p>
              </div>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Suggestions rapides */}
          <div style={{ padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Essayer :</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {["Bonjour", "Mal aux dents", "Douleur thoracique", "Toux"].map((text) => (
                <button
                  key={text}
                  onClick={() => handleQuickMessage(text)}
                  disabled={isTyping}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            maxHeight: '300px',
            background: '#f9fafb'
          }}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                style={{ 
                  display: 'flex',
                  marginBottom: '15px',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  maxWidth: '80%',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: message.sender === 'bot' ? '#10b981' : '#4f46e5',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
                  </div>
                  
                  <div style={{
                    background: message.sender === 'user' ? '#4f46e5' : 'white',
                    color: message.sender === 'user' ? 'white' : '#1f2937',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    borderBottomLeftRadius: message.sender === 'bot' ? '4px' : '18px',
                    borderBottomRightRadius: message.sender === 'user' ? '4px' : '18px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.7, 
                      marginTop: '5px',
                      textAlign: message.sender === 'user' ? 'right' : 'left'
                    }}>
                      {message.timestamp}
                    </div>
                    
                    {/* Spécialité */}
                    {message.sender === 'bot' && message.specialty && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${message.specialty.color || '#6b7280'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{ color: message.specialty.color, fontSize: '18px' }}>
                          {message.specialty.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {message.specialty.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Recommandé
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaRobot />
                </div>
                <div style={{
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  borderBottomLeftRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '14px' }}>Analyse en cours...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: '15px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '10px'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Décrivez vos symptômes..."
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              style={{
                padding: '12px 20px',
                background: isTyping || !inputMessage.trim() ? '#cbd5e1' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: isTyping || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isTyping && inputMessage.trim()) {
                  e.currentTarget.style.background = '#3730a3'
                }
              }}
              onMouseOut={(e) => {
                if (!isTyping && inputMessage.trim()) {
                  e.currentTarget.style.background = '#4f46e5'
                }
              }}
            >
              {isTyping ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaChevronRight />}
            </button>
          </form>

          {/* Disclaimer */}
          <div style={{
            padding: '12px 15px',
            background: '#fef3c7',
            borderTop: '1px solid #fde68a',
            fontSize: '11px',
            color: '#92400e',
            textAlign: 'center'
          }}>
            <FaSpinner style={{ marginRight: '5px', fontSize: '10px' }} />
            Ceci est une version de test. Consultez toujours un professionnel de santé.
          </div>
        </div>
      )}

      {/* Styles inline */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .chatbot-wrapper * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export default Chatbot