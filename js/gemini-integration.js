// Gemini AI Integration
class GeminiAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async sendMessage(message) {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Erro ao chamar Gemini:', error);
      throw error;
    }
  }
}

// Inicializar quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
  // Substitua 'SUA_API_KEY_AQUI' pela sua chave de API do Gemini
  window.gemini = new GeminiAI('AIzaSyBu8Gc3codALKLeX7hqFoxThrS1MRoQWek');
  console.log('Gemini AI integrado com sucesso!');
});
