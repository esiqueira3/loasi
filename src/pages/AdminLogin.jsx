import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const translateError = (msg) => {
  if (!msg) return null;
  if (msg.includes("Invalid login credentials")) return "E-mail o password non corretti. Controlla le credenziali.";
  if (msg.includes("Email not confirmed")) return "E-mail non confermata. Conferma l'indirizzo dal pannello Supabase (Authentication → Users).";
  if (msg.includes("Too many requests") || msg.includes("Rate limit exceeded")) return "Troppi tentativi. Riprova tra qualche minuto.";
  return msg;
};

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/dashboard')
      }
    })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    if (error) {
      setErrorMsg(translateError(error.message))
      setLoading(false)
    } else if (data.session) {
      setLoading(false)
      navigate('/admin/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr',
      backgroundColor: '#0f1316',
      color: '#f0f4f8',
      fontFamily: "'Inter', sans-serif"
    }} className="login-grid-layout">
      
      <style>{`
        @media (min-width: 1024px) {
          .login-grid-layout {
            grid-template-columns: 1fr 1fr !important;
          }
          .login-right-cover {
            display: flex !important;
          }
        }
        @keyframes mirrorSweep {
          0% { transform: translateX(-150%) rotate(25deg); }
          100% { transform: translateX(250%) rotate(25deg); }
        }
        .btn-glossy-sweep {
          position: relative;
          overflow: hidden;
        }
        .btn-glossy-sweep::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(60deg, transparent 30%, rgba(255, 255, 255, 0.4) 50%, transparent 70%);
          animation: mirrorSweep 3.5s infinite;
          pointer-events: none;
        }
      `}</style>

      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        position: 'relative',
        backgroundColor: '#0f1316'
      }}>
        {/* Glow ambiente */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          backgroundColor: 'rgba(200, 161, 101, 0.12)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
          
          {/* Cabeçalho L'OASI */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.2rem',
              fontWeight: 900,
              letterSpacing: '-1px',
              color: '#c8a165',
              textTransform: 'uppercase',
              margin: '0 0 0.5rem 0'
            }}>L'OASI</h1>
            <span style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#c8a165',
              backgroundColor: 'rgba(200, 161, 101, 0.1)',
              border: '1px solid rgba(200, 161, 101, 0.25)',
              padding: '6px 16px',
              borderRadius: '50px'
            }}>Gestione Pastorale</span>
          </div>

          {/* Card Form */}
          <section style={{
            backgroundColor: '#181e22',
            border: '1px solid #2c363f',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: '#fff' }}>
              Accedi al Pannello
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9aa8b6', margin: '0 0 1.5rem 0' }}>
              Inserisci le tue credenziali per gestire il sito della chiesa.
            </p>

            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(230, 57, 70, 0.15)',
                borderLeft: '4px solid #e63946',
                color: '#ff808b',
                padding: '0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#9aa8b6',
                  marginBottom: '0.5rem',
                  marginLeft: '4px'
                }}>E-mail Pastorale</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="pastore@chiesaloasi.it"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.2rem',
                    backgroundColor: '#232b31',
                    border: '1px solid #2c363f',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#9aa8b6',
                  marginBottom: '0.5rem',
                  marginLeft: '4px'
                }}>Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.2rem',
                    backgroundColor: '#232b31',
                    border: '1px solid #2c363f',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-glossy-sweep"
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  backgroundColor: '#c8a165',
                  color: '#000',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '0.8rem',
                  boxShadow: '0 10px 25px rgba(200, 161, 101, 0.25)',
                  transition: 'all 0.25s ease'
                }}
              >
                {loading ? 'Accesso in corso…' : 'Accedi al Gestionale →'}
              </button>
            </form>
          </section>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <a href="/" style={{ color: '#9aa8b6', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Torna al Sito Pubblico
            </a>
          </div>

        </div>
      </div>

      {/* LADO DIREITO: CAPA E SLOGAN */}
      <div className="login-right-cover" style={{
        display: 'none',
        position: 'relative',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        overflow: 'hidden'
      }}>
        <img 
          src="images/slide-1.jpg" 
          alt="Chiesa L'Oasi Capa" 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
            filter: 'brightness(0.7)'
          }} 
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 19, 22, 0.95) 0%, rgba(15, 19, 22, 0.5) 50%, rgba(200, 161, 101, 0.2) 100%)',
          zIndex: 1
        }}></div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '3rem',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            margin: '0 0 1.2rem 0'
          }}>Chiesa Cristiana Evangelica L’Oasi</h2>
          
          <div style={{
            width: '60px',
            height: '4px',
            backgroundColor: '#c8a165',
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}></div>

          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Il nostro scopo è predicare il Vangelo di Gesù Cristo. Perché nel nome di Gesù c’è la potenza che libera, guarisce e salva ancora oggi.
          </p>
        </div>
      </div>

    </div>
  )
}
