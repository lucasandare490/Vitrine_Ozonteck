import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    let safeHistory = history || [];
    if (safeHistory.length > 0 && safeHistory[0].role === 'model') {
        safeHistory.shift();
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest", 
      generationConfig: {
        maxOutputTokens: 150, 
        temperature: 0.7,
      },
      systemInstruction: `Sua Identidade: Assistente Virtual VIP da Vitrine Ozonteck – Unidade Recife.
Tom: Empática, natural, humana (estilo WhatsApp), profissional. Respostas curtas e diretas. SEM marcação markdown (** ou *).

Contexto:
- Loja: E-commerce premium Ozonteck.
- Rogério André: Dono e especialista. Trata protocolos médicos. WhatsApp: (81) 90000-0000.
- Lucas André: Desenvolvedor Full Stack do site e de você.

Catálogo:
- Nutracêuticos: Boryslim, Ox, Cobalactin, Virtuous Caps, Xbooster, Ozon Creat, Vita Ozon Plus, Sofh D, Melatozon, Genolife Kids, Dream Bliss, K2MK7/D3, Ozon Flex, Luminous Vita, Ozon Lev, Tri Magnésio, NX Cap.
- Capilares: Linha WO3, Ampola Soft Hair, Ozon-Blond, Ozon-Kesen, Óleo Açaí, Ozon Cream, Kids, Tônico Capilar, Ozon-For Men, Mel & Ozônio, Master Curls.
- Corpo: Hidratantes, Life Shii, Ozon Trix, Haydek, Ozon Fresh, Sabonete OX3, Esfoliante Oxylush, Pure Hot.
- Perfumes: Soberano, Alem, Easy Line, Aventura, Madame VI, Rhino Royale, Fera, VIP Men, Cinderela, Supremo Elixir, Grécia, Fantastica Bry, Maximum, VG Sexy, Scandaloza, Vida Bella, Sublime, Gouf Blue, Presidente, Doçurinha, Soul, Oud Royale, Sentimento, Max Boss, Seduction, Speed Black, Venum, Woman, Angelical, Famma, DG Red, Blue Sky, Capadócia, Lua de Mel.
- Acessórios: Caixa Memórias, Camiseta GG Rosa, Squeeze Turquesa.

Regras de Ouro:
1. Compreenda a necessidade antes de sugerir produtos.
2. NUNCA invente preços. Mande o cliente buscar na barra superior do site e adicionar ao carrinho.
3. SAÚDE: Você não é médica. Sem diagnósticos ou promessas de cura. Casos graves ou protocolos de ozonioterapia: mande chamar o Rogério no WhatsApp.
4. Foco apenas na loja. Mude de assunto se falarem de futebol, política, etc.`
    });

    const chat = model.startChat({
      history: safeHistory,
    });

    // ==========================================
    // SISTEMA DE RETRY AUTOMÁTICO (TEIMOSIA)
    // ==========================================
    let retries = 3; // Vai tentar até 3 vezes antes de desistir
    let text = '';

    while (retries > 0) {
      try {
        const result = await chat.sendMessage(message);
        const response = await result.response;
        text = response.text();
        break; // Deu certo! Sai do loop de repetição.
      } catch (err: any) {
        if (err.message?.includes('503') || err.status === 503) {
          retries--;
          if (retries === 0) throw err; // Se já tentou 3 vezes e falhou, aí sim ele desiste
          console.log(`[Google API] Servidor lotado (503). Tentando novamente... Restam ${retries} tentativas.`);
          // Espera 2 segundos antes de tentar de novo
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw err; // Se for outro erro (ex: 404, 400), ele para na hora
        }
      }
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Erro definitivo na API do Gemini:", error);
    return NextResponse.json({ error: 'Erro ao processar mensagem com a IA' }, { status: 500 });
  }
}