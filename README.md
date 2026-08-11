#  Vitrine Ozonteck

Uma plataforma de e-commerce moderna e responsiva construída para otimizar a experiência de compra, com foco em uma jornada de checkout fluida e conversão.

## Funcionalidades

- **Catálogo Dinâmico:** Apresentação de produtos com interface limpa e animações suaves.
- **Carrinho de Compras Inteligente:** Gerenciamento de estado global para adicionar, remover e alterar quantidades de produtos em tempo real.
- **Checkout em Etapas (Multi-step):** Navegação intuitiva dividida em Revisão, Endereço e Pagamento.
- **Autopreenchimento de Endereço:** Integração com a API ViaCEP para busca automática de logradouro, bairro e cidade a partir do CEP.
- **Máscaras de Input:** Formatação automática para CPF e números de WhatsApp (Celular).
- **Pagamento Integrado:** Checkout transparente utilizando o Brick do Mercado Pago, suportando transações via Cartão de Crédito, Pix e Boleto Bancário com telas de sucesso customizadas.

##  Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando as seguintes tecnologias:

- **[Next.js](https://nextjs.org/)** - Framework React para renderização e rotas.
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para maior segurança e previsibilidade do código.
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utilitária para construção rápida e responsiva de interfaces.
- **[Zustand](https://github.com/pmndrs/zustand)** - Gerenciamento de estado global simplificado (utilizado no carrinho).
- **[Supabase](https://supabase.com/)** - Banco de dados PostgreSQL e backend as a service (BaaS) para listagem de produtos.
- **[Mercado Pago SDK React](https://github.com/mercadopago/sdk-react)** - Integração de pagamentos (Checkout Brick).
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones.

## 🛠️ Como rodar o projeto localmente

Siga as instruções abaixo para executar o projeto em sua máquina:

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) instalado.
- Gerenciador de pacotes (NPM, Yarn ou PNPM).

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/Vitrine_Ozonteck.git](https://github.com/seu-usuario/Vitrine_Ozonteck.git)
