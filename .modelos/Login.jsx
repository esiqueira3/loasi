import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'

const translateError = (msg) => {
  if (!msg) return null;
  if (msg.includes("For security purposes, you can only request this after")) {
    const seconds = msg.match(/\d+/);
    return `🔒 Por segurança, aguarde ${seconds ? seconds[0] : 'alguns'} segundos.`;
  }
  if (msg.includes("Email not confirmed")) return "E-mail não confirmado.";
  if (msg.includes("Too many requests")) return "Muitas solicitações! Tente novamente em alguns minutos.";
  if (msg.includes("Rate limit exceeded")) return "Limite de tentativas excedido. Aguarde um momento.";
  return msg;
};

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' ou 'register'
  const [step, setStep] = useState(1) // 1: Form, 2: OTP
  
  // Login States
  const [email, setEmail] = useState('')
  
  // Register States
  const [regNomeIgreja, setRegNomeIgreja] = useState('')
  const [regNome, setRegNome] = useState('')
  const [regTelefone, setRegTelefone] = useState('')
  const [regEmail, setRegEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']) 
  const [errorMsg, setErrorMsg] = useState(null)
  const [timer, setTimer] = useState(0)
  
  const navigate = useNavigate()
  const { setTenant } = useTenant() || {}
  const processingRef = useState(false) // Trava para evitar execução dupla

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timer])

  const [config, setConfig] = useState({
    url_capa_login: 'https://images.unsplash.com/photo-1507679799987-c7377ec48696?q=80&w=2071&auto=format&fit=crop',
    slogan_login: 'Kairon - Gestão de Igrejas',
    subtexto_login: 'A plataforma SaaS definitiva para organizar seu ministério.'
  })

  useEffect(() => {
    supabase.from('configuracoes_gerais').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConfig(prev => ({
            url_capa_login: data.url_capa_login || prev.url_capa_login,
            slogan_login: data.slogan_login || prev.slogan_login,
            subtexto_login: data.subtexto_login || prev.subtexto_login
          }))
        }
      })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkPendingRegistration(session)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        checkPendingRegistration(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const checkPendingRegistration = async (session) => {
    const pendingReg = localStorage.getItem('pendingRegistration')

    if (pendingReg && !processingRef[0]) {
      processingRef[1](true) // Trava execução para evitar dupla chamada
      const regData = JSON.parse(pendingReg)
      localStorage.removeItem('pendingRegistration') // Apaga ANTES de processar

      setLoading(true)
      try {
        // Usa função SECURITY DEFINER no banco — contorna o RLS para o cadastro inicial.
        // Sem isso, o novo usuário sem perfil recebe 403 ao tentar inserir em 'igrejas'/'perfis'
        // porque get_my_igreja_id() retorna NULL e o RLS bloqueia.
        const { data: result, error: rpcError } = await supabase.rpc('registrar_nova_igreja', {
          p_nome_igreja: regData.regNomeIgreja,
          p_nome_usuario: regData.regNome,
          p_telefone: regData.regTelefone,
          p_email: regData.regEmail,
        })

        if (rpcError) throw rpcError

        if (!result?.success) {
          throw new Error(result?.error || 'Erro desconhecido ao criar conta.')
        }

        // Sucesso — navega para home
        setLoading(false)
        navigate('/home')
      } catch (err) {
        console.error("Erro ao processar registro pendente:", err)
        setLoading(false)
        // Não navega — mostra erro para o usuário não ficar em loop
        setErrorMsg('Erro ao criar sua conta: ' + (err.message || 'Tente novamente.'))
        // Volta para a tela de login para o usuário ver o erro
        setStep(1)
        setMode('register')
        // Restaura os dados para o usuário poder tentar de novo
        localStorage.setItem('pendingRegistration', JSON.stringify(regData))
        processingRef[1](false)
      }
    } else {
      // Usuário existente (login normal) — navega direto
      navigate('/home')
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = value
    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length > 7) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    }
    setRegTelefone(formatted)
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const targetEmail = mode === 'login' ? email : regEmail

    if (mode === 'register') {
      localStorage.setItem('pendingRegistration', JSON.stringify({
        regNomeIgreja,
        regNome,
        regTelefone,
        regEmail
      }))
    }

    // Convidados na whitelist (usuarios_sistema) ainda não existem em auth.users;
    // com shouldCreateUser: false o Supabase recusa o OTP do primeiro login
    // ("Signups not allowed for otp"). Se o e-mail está liberado na whitelist,
    // permitimos a criação — o gatilho trg_perfil_hereda_igrejas cuida das permissões.
    let shouldCreateUser = mode === 'register'
    if (mode === 'login') {
      const { data: liberado, error: wlError } = await supabase.rpc('email_liberado_whitelist', {
        p_email: targetEmail.trim().toLowerCase()
      })
      if (wlError) console.warn('Falha ao consultar whitelist (seguindo fluxo padrão):', wlError.message)
      if (liberado === true) shouldCreateUser = true
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: targetEmail.trim().toLowerCase(),
      options: {
        shouldCreateUser,
      }
    })

    const translateError = (err) => {
      if (err.message.includes('Signups not allowed for otp')) {
        return "⚠️ Este e-mail não possui permissão de acesso. Verifique se digitou corretamente ou entre em contato com o administrador da sua igreja."
      }
      if (err.message.includes('Rate limit exceeded')) {
        return "🛑 Muitas solicitações! Por favor, aguarde alguns minutos antes de tentar novamente."
      }
      if (err.message.toLowerCase().includes('error sending magic link')) {
        return "✉️ Falha no envio do e-mail (Limite do servidor atingido ou falha de SMTP). Tente novamente em alguns minutos ou contate o suporte."
      }
      return err.message
    }

    if (authError) {
      setErrorMsg(translateError(authError))
      setLoading(false)
    } else {
      setLoading(false)
      setStep(2)
      setTimer(60)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 8) return
    setLoading(true)
    setErrorMsg(null)

    const targetEmail = mode === 'login' ? email : regEmail

    const { data, error } = await supabase.auth.verifyOtp({
      email: targetEmail.trim().toLowerCase(),
      token: code,
      type: 'email',
    })

    if (error) {
       setErrorMsg("Código inválido ou expirado!")
       setLoading(false)
       return
    } 

    if (data.session) {
      // Se for registro, precisamos criar a Igreja e o Perfil Master
      // O processamento da criação da igreja agora ocorre em checkPendingRegistration
      // que é acionado automaticamente pelo onAuthStateChange ou getSession
      checkPendingRegistration(data.session)
    }
  }

  const handleOtpChange = (e, index) => {
    const val = e.target.value
    if (/[^0-9]/.test(val)) return

    const newOtp = [...otp]
    newOtp[index] = val
    setOtp(newOtp)

    if (val !== '' && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 8)
    if (!pastedData) return

    const newOtp = [...otp]
    const digits = pastedData.split('')
    digits.forEach((digit, i) => { if (i < 8) newOtp[i] = digit })
    setOtp(newOtp)
    const lastIndex = Math.min(digits.length - 1, 7)
    const lastInput = document.getElementById(`otp-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  return (
    <div className="bg-background font-body text-on-surface min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 relative bg-white dark:bg-background">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="w-full max-w-md z-10 space-y-8">
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary mb-2 uppercase">Kairon</h1>
            <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest bg-surface-container-low px-4 py-1.5 rounded-full shadow-sm">
              SaaS Ministerial
            </p>
          </div>

          <section className="bg-white dark:bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-outline-variant/10 relative overflow-hidden">
             
             {/* Aba "Criar Conta" temporariamente oculta
             {step === 1 && (
               <div className="flex p-1 bg-surface-container-low rounded-xl mb-8">
                 <button
                   type="button"
                   onClick={() => setMode('login')}
                   className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow-md text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                 >
                   Entrar
                 </button>
                 <button
                   type="button"
                   onClick={() => setMode('register')}
                   className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${mode === 'register' ? 'bg-white shadow-md text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                 >
                   Criar Conta
                 </button>
               </div>
             )}
             */}

             <div className="space-y-6">
                {errorMsg && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg text-xs font-black uppercase flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">info</span>
                    {translateError(errorMsg)}
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={handleSendCode} className="space-y-6">
                    {mode === 'login' ? (
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Seu E-mail</label>
                        <input 
                          type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@igreja.com"
                          className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-bold text-sm text-on-surface"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Nome da Igreja</label>
                          <input 
                            type="text" required value={regNomeIgreja} onChange={(e) => setRegNomeIgreja(e.target.value)} placeholder="Ex: Igreja Água Viva"
                            className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all font-bold text-sm text-on-surface"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Seu Nome</label>
                             <input type="text" required value={regNome} onChange={(e) => setRegNome(e.target.value)} className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface transition-all" />
                           </div>
                           <div className="space-y-3">
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Telefone</label>
                             <input type="tel" required placeholder="(99) 99999-9999" value={regTelefone} onChange={handlePhoneChange} className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface transition-all" />
                           </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">Seu E-mail (Master)</label>
                          <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface transition-all" />
                        </div>
                      </>
                    )}
                    
                    <button 
                      type="submit" 
                      disabled={loading || (mode === 'login' ? !email : !regEmail)}
                      className="relative overflow-hidden w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:bg-primary-container hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest group"
                    >
                      {/* Efeito Espelho (Glossy Sweep) */}
                      <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror pointer-events-none"></div>

                      {loading ? <span className="relative z-10">Processando...</span> : (
                        mode === 'login' ? (
                          <div className="relative z-10 flex items-center justify-center w-full">
                            Entrar no Ambiente <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span>
                            <img src="/-logo_lgpd.png" alt="LGPD" className="absolute right-4 h-6 opacity-90 object-contain" />
                          </div>
                        ) : <span className="relative z-10">Criar Conta SaaS</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <p className="text-center text-xs font-bold text-on-surface-variant/80">Código de 8 dígitos enviado para o e-mail informado.</p>
                    <div className="flex justify-between gap-1.5" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e, i)} onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          className="w-full h-12 text-center text-lg font-black bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none focus:bg-surface-container-lowest text-on-surface transition-all"
                        />
                      ))}
                    </div>
                    <button type="submit" disabled={loading || otp.join('').length !== 8} className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase text-xs">
                      {loading ? 'Validando...' : 'Confirmar e Acessar'}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="w-full text-xs font-black text-on-surface-variant/40 hover:text-primary">
                       Voltar
                    </button>
                  </form>
                )}
             </div>
          </section>
        </div>
      </div>

      {/* LADO DIREITO: CAPA DINÂMICA */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-950 items-center justify-center p-0">
          <img src={config.url_capa_login} alt="Fundo" className="absolute inset-0 w-full h-full object-cover z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-primary/20 z-10"></div>
          <div className="z-20 max-w-lg p-12 text-left">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">{config.slogan_login}</h2>
            <div className="w-16 h-1 bg-primary mb-6 rounded-full"></div>
            <p className="text-lg text-white/70 font-medium leading-relaxed">{config.subtexto_login}</p>
          </div>
      </div>
    </div>
  )
}
